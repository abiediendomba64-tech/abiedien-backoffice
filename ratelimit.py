import time
from core.database import safe_execute

def register_ratelimit_middleware(bot):
    """Daftarkan middleware rate limiting."""
    
    @bot.middleware_handler(update_types=['callback_query'])
    def ratelimit_callback_middleware(bot_instance, call):
        user_id = call.from_user.id
        current = int(time.time())
        
        # Cek cooldown 5 detik
        result = safe_execute(
            "SELECT last_action FROM rate_limits WHERE user_id = ?", (user_id,), fetch=True
        )
        if result and current - result[0][0] < 5:
            bot_instance.answer_callback_query(
                call.id, "⏳ Tunggu 5 detik!", show_alert=True
            )
            return
        
        # Update last_action
        safe_execute(
            "INSERT OR REPLACE INTO rate_limits (user_id, last_action) VALUES (?, ?)",
            (user_id, current)
        )
    
    @bot.middleware_handler(update_types=['message'])
    def ratelimit_message_middleware(bot_instance, message):
        user_id = message.from_user.id
        current = int(time.time())
        
        # Cek cooldown 3 detik untuk message
        result = safe_execute(
            "SELECT last_action FROM rate_limits WHERE user_id = ?", (user_id,), fetch=True
        )
        if result and current - result[0][0] < 3:
            bot_instance.reply_to(message, "⏳ Slow down!")
            return
        
        safe_execute(
            "INSERT OR REPLACE INTO rate_limits (user_id, last_action) VALUES (?, ?)",
            (user_id, current)
        )