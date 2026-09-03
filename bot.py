from telebot import TeleBot, apihelper
from telebot.storage import StateMemoryStorage
from config import BOT_TOKEN

# WAJIB: tanpa baris ini, semua @bot.middleware_handler (auth & ratelimit)
# TIDAK PERNAH dijalankan oleh pyTelegramBotAPI (silent no-op).
apihelper.ENABLE_MIDDLEWARE = True

# Inisialisasi state storage
state_storage = StateMemoryStorage()

# Inisialisasi bot instance (SATU-SATUNYA instance bot di seluruh proyek —
# jangan buat instance TeleBot lain di file manapun, atau handler yang
# didaftarkan di instance lain tidak akan pernah terpanggil oleh polling).
bot = TeleBot(BOT_TOKEN, state_storage=state_storage)

# Register semua middleware (di-import di sini agar circular import aman)
def register_middlewares():
    from middlewares.auth import register_auth_middleware
    from middlewares.ratelimit import register_ratelimit_middleware
    
    register_auth_middleware(bot)
    register_ratelimit_middleware(bot)

register_middlewares()