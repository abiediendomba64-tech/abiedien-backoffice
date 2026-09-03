import os
from dotenv import load_dotenv

load_dotenv()

# ================== KONFIGURASI ==================
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
if not BOT_TOKEN or BOT_TOKEN == "replace_with_token_from_botfather":
    raise RuntimeError(
        "BOT_TOKEN belum diatur. Salin .env.example menjadi .env lalu isi token BotFather."
    )

SUPER_ADMIN_IDS = [int(x.strip()) for x in os.getenv("SUPER_ADMIN_IDS", "").split(",") if x.strip()]
DB_NAME = os.getenv("DB_NAME", "data_member.db")
VERIFICATION_EXPIRY_DAYS = int(os.getenv("VERIFICATION_EXPIRY_DAYS", "30"))