#!/usr/bin/env python3
"""
Telegram Bot Enterprise - Entry Point
Optimized with Batch Verification, Tenacity Retry Mechanism, Pytz Timezone, & Structured Logging.
"""
import logging
import threading
import time
from datetime import datetime
import pytz
import schedule
from tenacity import retry, stop_after_attempt, wait_exponential

from core.bot import bot
from core.database import init_db, safe_execute
from core.utils import check_domain_ownership
from models.user import User

# Import semua handler agar terdaftar
from handlers import menu, verification, tickets, forum, payment, admin

# ================== STRUCTURED LOGGING ==================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("telegram_bot_enterprise")

# ================== NOTIFICATION WITH RETRY ==================
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=False
)
def send_notification_with_retry(uid: int, text: str):
    """Kirim pesan Telegram dengan auto-retry exponential backoff."""
    bot.send_message(uid, text, parse_mode="Markdown")

# ================== SCHEDULER (BATCH OPTIMIZED) ==================
def monthly_check():
    """Cek keaktifan domain member setiap bulan dengan batch update & log terstruktur."""
    tz = pytz.timezone("Asia/Jakarta")
    now_str = datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S %Z")
    logger.info(f"🔄 Running monthly verification check at {now_str}...")

    users = safe_execute(
        "SELECT telegram_id, domain_name, verification_token FROM users WHERE domain_verified=1",
        fetch=True
    )

    if not users:
        logger.info("ℹ️ Tidak ada member aktif dengan domain_verified=1 yang perlu dicek.")
        return

    invalid_users = []

    for uid, domain, token in users:
        if not domain or not token:
            invalid_users.append((uid, domain or "N/A"))
            continue

        result = check_domain_ownership(domain, token)
        # Pythonic check: if not result
        if not result:
            logger.warning(f"⚠️ Domain check failed for user {uid} ({domain}) -> result: {result}")
            invalid_users.append((uid, domain))
        else:
            logger.info(f"✅ Domain {domain} (user {uid}) terverifikasi aktif.")

    # Batch update jika ada domain kadaluarsa / tidak valid
    if invalid_users:
        invalid_uids = [u[0] for u in invalid_users]
        logger.info(f"⚡ Melakukan Single Batch Update untuk {len(invalid_uids)} user tidak valid...")
        User.update_domain_verified_batch(invalid_uids, 0)

        # Kirim notifikasi dengan retry mechanism
        for uid, domain in invalid_users:
            try:
                send_notification_with_retry(
                    uid,
                    f"⚠️ Verifikasi domain `{domain}` Anda kadaluarsa / token TXT tidak ditemukan. "
                    "Silakan ketik /start untuk memperbarui verifikasi DNS."
                )
                logger.info(f"📩 Notifikasi dikirim ke user {uid} (domain: {domain})")
            except Exception as e:
                logger.error(f"❌ Gagal mengirim notifikasi ke user {uid} setelah retries: {e}")

    logger.info(
        f"✅ Monthly check selesai. Diperiksa: {len(users)} domain | Kadaluarsa: {len(invalid_users)} domain."
    )

def run_scheduler():
    """Jalankan scheduler di background thread dengan zona waktu Asia/Jakarta."""
    # Jadwalkan pengecekan harian pada pukul 00:00 WIB
    schedule.every().day.at("00:00").do(monthly_check)
    logger.info("⏰ Background scheduler aktif (Setiap hari pukul 00:00 Asia/Jakarta).")
    while True:
        schedule.run_pending()
        time.sleep(60)

# ================== MAIN ==================
if __name__ == "__main__":
    init_db()
    threading.Thread(target=run_scheduler, daemon=True).start()
    logger.info("=" * 60)
    logger.info("🚀 BOT ENTERPRISE (Multi-File) READY TO DEPLOY")
    logger.info("✅ Status: Production Ready | Timezone: Asia/Jakarta")
    logger.info("=" * 60)
    bot.infinity_polling()
