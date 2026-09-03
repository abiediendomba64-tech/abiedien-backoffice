from telebot import types
from core.bot import bot
from models.payment import Payment
from config import SUPER_ADMIN_IDS

# ================== STATES ==================
from telebot.handler_backends import State, StatesGroup

class PaymentStates(StatesGroup):
    waiting_payment = State()

# ================== HANDLER UPLOAD PEMBAYARAN ==================
@bot.callback_query_handler(func=lambda call: call.data == "menu_payment")
def payment_callback(call):
    """Menampilkan instruksi upload bukti + tombol batal."""
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("❌ Batal", callback_data="payment_cancel"))
    bot.send_message(
        call.message.chat.id,
        "📤 Kirim screenshot/foto bukti transfer.\nKlik tombol di bawah untuk membatalkan.",
        reply_markup=markup
    )
    bot.set_state(call.from_user.id, PaymentStates.waiting_payment, call.message.chat.id)

@bot.callback_query_handler(func=lambda call: call.data == "payment_cancel")
def payment_cancel(call):
    """Membatalkan proses upload payment."""
    bot.delete_state(call.from_user.id, call.message.chat.id)
    bot.delete_message(call.message.chat.id, call.message.message_id)
    bot.send_message(call.message.chat.id, "❌ Pembayaran dibatalkan.")

@bot.message_handler(state=PaymentStates.waiting_payment, content_types=['photo', 'document'])
def payment_handler(message):
    """Menerima bukti transfer (foto atau dokumen)."""
    # Jika user mengetik "batal" (fallback)
    if message.text and message.text.lower() == "batal":
        bot.reply_to(message, "❌ Dibatalkan.")
        return bot.delete_state(message.from_user.id, message.chat.id)
    
    # Ambil file_id (prioritas foto, lalu dokumen)
    fid = message.photo[-1].file_id if message.photo else message.document.file_id
    
    # Simpan ke database (status pending)
    Payment.create(message.from_user.id, fid)
    bot.reply_to(message, "✅ Bukti terkirim. Menunggu verifikasi admin.")
    bot.delete_state(message.from_user.id, message.chat.id)
    
    # Kirim notifikasi ke semua Super Admin
    for admin in SUPER_ADMIN_IDS:
        try:
            bot.send_photo(admin, fid, caption=f"💳 Payment dari {message.from_user.id}")
        except:
            pass

# ================== COMMAND VERIFIKASI (SUPER ADMIN) ==================
@bot.message_handler(commands=['verify_pay'])
def verify_pay_cmd(message):
    """Verifikasi payment berdasarkan ID (hanya Super Admin)."""
    if message.from_user.id not in SUPER_ADMIN_IDS:
        return bot.reply_to(message, "⛔ Hanya Super Admin!")
    
    args = message.text.split()
    if len(args) < 2:
        return bot.reply_to(message, "❌ Format: /verify_pay [id]")
    
    try:
        pay_id = int(args[1])
        Payment.verify(pay_id)
        bot.reply_to(message, f"✅ Payment {pay_id} berhasil diverifikasi.")
    except ValueError:
        bot.reply_to(message, "❌ ID harus berupa angka.")
    except Exception as e:
        bot.reply_to(message, f"❌ Gagal verifikasi: {e}")