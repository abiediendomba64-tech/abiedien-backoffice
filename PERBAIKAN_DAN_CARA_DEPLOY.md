# ✅ Catatan Perbaikan & Panduan Deploy (Revisi)

## 1. Bug yang sudah diperbaiki

| # | Bug | File | Dampak sebelumnya | Perbaikan |
|---|-----|------|--------------------|-----------|
| 1 | Dua instance `TeleBot` berbeda | `main.py` mengambil bot dari `core/dispatcher.py`, semua handler mengambil dari `core/bot.py` | Bot yang di-*polling* **tidak punya handler terdaftar** → semua fitur (menu, tiket, forum, payment, verifikasi) tidak merespons sama sekali | `core/dispatcher.py` dihapus, `bot.py` (duplikat entry point lama) dihapus. `main.py` sekarang import `bot` dari `core/bot.py` — satu-satunya instance di seluruh proyek |
| 2 | Middleware auth & rate-limit tidak pernah jalan | `core/bot.py` | `apihelper.ENABLE_MIDDLEWARE` tidak pernah diaktifkan → `@bot.middleware_handler` di `middlewares/auth.py` & `middlewares/ratelimit.py` silent no-op | Ditambahkan `apihelper.ENABLE_MIDDLEWARE = True` sebelum instance bot dibuat |
| 3 | Salah kolom index di forum | `handlers/forum.py` (`forum_view`, `forum_toggle`) | Cek status topik ("open/closed") salah baca dari kolom *category*; cek kepemilikan topik membandingkan `user_id` dengan `topic_id` (string) — akibatnya tombol komentar nyaris tak pernah muncul, dan pemilik topik tidak bisa tutup/buka topiknya sendiri | Diperbaiki ke index kolom yang benar (`status` = index 6, `user_id` = index 2) |
| 4 | Tombol admin/menu tidak mengikuti RBAC | `handlers/menu.py` | Tombol "Admin Ops", "Kelola Pending", "All Topics" hanya muncul untuk `SUPER_ADMIN_IDS` hardcoded / role `member`, padahal role `admin` dan `dev` (hasil `/setrole`) seharusnya juga berhak | Diganti pakai `has_access()` dari `core/rbac.py` yang konsisten dengan hierarki role |
| 5 | `assigned_to` ke-reset ke NULL | `models/ticket.py` | Saat admin `resolve` tiket tanpa parameter `assigned_to`, kolom itu tertimpa `NULL`, menghapus jejak siapa yang menangani | Pakai `COALESCE(?, assigned_to)` agar tidak menimpa nilai lama jika tidak diisi |
| 6 | File duplikat/mengganggu | `bot.py` (root lama), `Semua Handler & Fungsi Forum.py` | Membingungkan saat deploy — dua "versi" project dengan gaya kode & entry point berbeda | `bot.py` root dihapus. `Semua Handler & Fungsi Forum.py` **tidak dipakai oleh siapapun** (tidak pernah di-import) — abaikan/hapus file ini dari folder deploy |

## 2. Cara Deploy (Revisi — WAJIB ikuti urutan ini)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
```
BOT_TOKEN=isi_token_asli_dari_BotFather
SUPER_ADMIN_IDS=id_telegram_1,id_telegram_2,id_telegram_3
DB_NAME=data_member.db
VERIFICATION_EXPIRY_DAYS=30
```

Jalankan **HANYA** `main.py`:
```bash
python main.py
```

Paket bersih ini tidak menyertakan `.env`; jangan menambahkan token asli ke
arsip, Git, atau chat. Untuk deployment otomatis, gunakan contoh di folder
`deploy/`.

## 3. ⚠️ Peringatan khusus PythonAnywhere versi Gratis

Ini bukan bug kode, tapi keterbatasan platform yang akan tetap membuat sebagian fitur gagal walau kode sudah benar:

- **Cek domain (DNS TXT) & WHOIS** (`core/utils.py`) melakukan koneksi *raw socket* langsung (DNS ke `1.1.1.1`/`8.8.8.8`, WHOIS ke port 43). Akun gratis PythonAnywhere **hanya mengizinkan HTTP/HTTPS lewat proxy ke domain whitelist** — permintaan raw socket seperti ini akan gagal/timeout terus-menerus di sana. Fitur verifikasi domain & `/cekdomain` tidak akan pernah berhasil di akun gratis.
- **Tidak ada "Always-on Task"** di paket gratis — proses `bot.infinity_polling()` yang dijalankan lewat console akan mati begitu console idle/ditutup, sehingga bot terlihat "hidup lalu mati sendiri".
- `api.telegram.org` sendiri sebenarnya **ada** di whitelist gratis, jadi koneksi ke Telegram biasanya tetap bisa.

**Rekomendasi**: untuk uji coba deploy yang stabil dan fitur cek domain berfungsi penuh, pakai VPS kecil (mis. $5/bulan) atau platform seperti Railway/Fly.io yang punya akses internet penuh, sesuai yang memang direkomendasikan di `sop.md` asli proyek ini ("Server/VPS dengan Ubuntu 22.04"). PythonAnywhere gratis cocok untuk uji struktur menu/tiket/forum/payment saja (yang tidak butuh koneksi keluar selain ke Telegram).

## 4. Verifikasi yang sudah saya lakukan
- Semua file lolos `py_compile` (tidak ada syntax error).
- `init_db()` berhasil membuat semua tabel tanpa error.
- Dikonfirmasi lewat introspeksi: setelah perbaikan, `main.py`, `core/bot.py`, dan seluruh `handlers/*.py` kini merujuk **instance bot yang sama persis** (`bot_a is bot_b is bot_c is bot_d is bot_e` → `True`).
- Setelah perbaikan: 16 message handler, 20 callback handler, dan 4 middleware handler berhasil terdaftar di instance yang di-*polling* (sebelumnya 0, karena salah wiring).
