# 📘 BOT TELEGRAM ENTERPRISE — DOKUMENTASI LENGKAP (README.md)

**Versi:** 4.0 (Production Ready)  
**Status:** ✅ **STABLE / READY TO DEPLOY**  
**Arsitektur:** Monolitik Terstruktur (Single File dengan Modular Internal)  

---

## DAFTAR ISI
1. [Tentang Proyek](#-tentang-proyek)
2. [Fitur Utama](#-fitur-utama)
3. [Arsitektur & Teknologi](#-arsitektur--teknologi)
4. [Struktur Database](#-struktur-database)
5. [Hierarki & Hak Akses (RBAC)](#-hierarki--hak-akses-rbac)
6. [Panduan Instalasi](#-panduan-instalasi)
7. [Konfigurasi](#-konfigurasi)
8. [Panduan Pengguna (Member)](#-panduan-pengguna-member)
9. [Panduan Admin (Super Admin)](#-panduan-admin-super-admin)
10. [Manajemen Risiko & SOP](#-manajemen-risiko--sop)
11. [Deployment ke Produksi](#-deployment-ke-produksi)
12. [Troubleshooting](#-troubleshooting)

---

## 🚀 TENTANG PROYEK

Bot Telegram Enterprise adalah solusi **manajemen member, verifikasi domain, dan operasional bisnis** yang dirancang untuk tim/komunitas yang mengelola kepemilikan website. Bot ini menggabungkan sistem **Verifikasi Domain (DNS TXT)**, **Sistem Tiket/Request**, **Forum Diskusi**, **Manajemen Pembayaran**, dan **Tools Admin Operasional** dalam satu ekosistem terintegrasi.

Dibangun dengan **pyTelegramBotAPI** dan **SQLite**, bot ini siap dijalankan di VPS/Server dengan sumber daya minimal.

---

## ✅ FITUR UTAMA

| Modul | Fitur | Status |
| :--- | :--- | :--- |
| **Verifikasi** | Registrasi Nama, WA, Domain | ✅ |
| | Verifikasi kepemilikan domain via DNS TXT | ✅ |
| | Token unik (expiry 30 hari) | ✅ |
| | Scheduler pengecekan bulanan otomatis | ✅ |
| **Tiket** | 11 Kategori (Domain, Masalah, Payment, Push, Migrasi, Pendapatan, Member, Akuisisi, Kendala Web, Claim, Web Update) | ✅ |
| | Status: Pending → Assigned → Resolved | ✅ |
| | Notifikasi ke Super Admin | ✅ |
| **Forum** | Buat topik diskusi | ✅ |
| | Komentar (threaded) | ✅ |
| | Tutup/Buka topik (oleh pembuat/admin) | ✅ |
| | Hapus topik/komentar (admin) | ✅ |
| **Payment** | Upload bukti transfer (foto/dokumen) | ✅ |
| | Verifikasi oleh admin | ✅ |
| **Admin Tools** | Daftar semua member | ✅ |
| | Cek status domain (WHOIS) | ✅ |
| | Broadcast pengumuman (2-step approval) | ✅ |
| | Lihat pending payment | ✅ |
| **Keamanan** | 3 Super Admin (hardcoded) | ✅ |
| | Rate limiting (cooldown) | ✅ |
| | Database Lock Prevention (WAL + Retry) | ✅ |
| | 2-Step Broadcast Approval | ✅ |

---

## 🏗 ARSITEKTUR & TEKNOLOGI

### Arsitektur Layer (dalam 1 File)

```text
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  (Handler, Callback, State Management)                     │
│  ~ Menu, Verifikasi, Tiket, Forum, Payment                │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                     │
│  (Validasi Domain, Logika Tiket, Scheduler)                │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    DATA ACCESS LAYER                        │
│  (safe_execute, CRUD functions)                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                     │
│  (SQLite, DNS Resolver 1.1.1.1, WHOIS)                    │
└──────────────────────────────────────────────────────────────┘
```

### Stack Teknologi
- **Bahasa:** Python 3.9+
- **Framework:** pyTelegramBotAPI (telebot)
- **Database:** SQLite (dengan WAL mode & retry mechanism)
- **DNS:** dnspython (resolver publik 1.1.1.1 & 8.8.8.8)
- **WHOIS:** python-whois
- **Scheduler:** schedule (threading)

---

## 🗄 STRUKTUR DATABASE

Bot membuat 8 tabel secara otomatis saat pertama kali dijalankan:

| Tabel | Fungsi | Kolom Utama |
| :--- | :--- | :--- |
| `users` | Data member | `telegram_id`, `full_name`, `whatsapp_number`, `domain_name`, `verification_token`, `token_expiry`, `role`, `domain_verified`, `last_verified_at` |
| `tickets` | Tiket/Request | `ticket_number`, `user_id`, `category`, `message`, `status`, `assigned_to`, `admin_reply` |
| `forum_topics` | Topik forum | `topic_id`, `user_id`, `title`, `content`, `status` (open/closed) |
| `forum_comments` | Komentar forum | `topic_id`, `user_id`, `comment_text` |
| `payments` | Bukti pembayaran | `user_id`, `proof_file_id`, `status` (pending/verified) |
| `web_requests` | Request web | `user_id`, `domain`, `request_type`, `description` |
| `member_websites` | Data NDP/QWB/Nawala | `user_id`, `domain`, `ndp_status`, `qwb_status`, `is_nawala` |
| `rate_limits` | Anti-spam | `user_id`, `last_action`, `daily_count` |

---

## 👥 HIERARKI & HAK AKSES (RBAC)

Bot menggunakan **3 Role** dengan matriks akses yang jelas:

| Role | Jumlah | Hak Akses |
| :--- | :---: | :--- |
| **Super Admin** | 3 (hardcoded di config) | **Segala akses:** Verifikasi, Buat tiket, Kelola tiket (semua), Lihat semua topik, Hapus topik/komentar, Verifikasi payment, Broadcast, List member, Cek domain, Change role (via manual DB) |
| **Member** | Dinamis | Verifikasi, Buat tiket, Lihat tiket sendiri, Lihat forum, Buat topik, Komentar, Tutup topik sendiri |
| **New User** | Dinamis | Verifikasi (belum selesai), Buat tiket (terbatas), Lihat forum (read-only), **TIDAK BISA** buat topik atau komentar |

**Implementasi di Kode:**
```python
SUPER_ADMIN_IDS = [123456789, 987654321, 555555555]  # 3 orang
```

---

## 🔧 PANDUAN INSTALASI

### Prasyarat
- Server/VPS dengan **Ubuntu 22.04** atau yang setara.
- Python 3.9+ terinstal.
- Koneksi internet untuk mengakses DNS eksternal.

### Langkah 1: Clone / Buat Folder Proyek
```bash
mkdir -p /opt/telegram-bot
cd /opt/telegram-bot
```

### Langkah 2: Buat Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Langkah 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Langkah 4: Gunakan Entry Point

Paket multi-file sudah berisi seluruh `core/`, `models/`, `handlers/`, dan
`middlewares/`. Jangan membuat `bot.py` baru atau menjalankan handler secara
langsung. Entry point yang benar adalah `main.py`.

### Langkah 5: Konfigurasi

---

## ⚙️ KONFIGURASI

Salin `.env.example` menjadi `.env`, lalu isi konfigurasi berikut:

```dotenv
BOT_TOKEN=isi_token_asli_dari_BotFather
SUPER_ADMIN_IDS=id_telegram_1,id_telegram_2
DB_NAME=data_member.db
VERIFICATION_EXPIRY_DAYS=30
```

Jangan commit `.env`. Gunakan secret manager atau environment variables pada
server produksi.

### Cara Mendapatkan Token & ID:
1. **Token Bot:** Buka Telegram, cari `@BotFather`, kirim `/newbot`, ikuti instruksi.
2. **ID Telegram:** Buka `@userinfobot`, kirim `/start`, dapatkan ID Anda.

---

## 📖 PANDUAN PENGGUNA (MEMBER)

### 1. Registrasi & Verifikasi Domain
- Ketik `/start` atau klik tombol **"✅ Verifikasi"**.
- Masukkan **Nama Lengkap** → **Nomor WhatsApp** → **Domain Website**.
- Bot akan memberikan **Token** (contoh: `xK9mP2nQ4rS8tU6vW1`).
- Tambahkan **Record TXT** di panel DNS domain Anda dengan value token tersebut.
- Tunggu 5-10 menit, lalu klik tombol **"🔍 Cek Sekarang"**.
- Jika berhasil, status menjadi **"Terverifikasi"**.

### 2. Membuat Tiket (Request)
- Klik **"🎫 Tiket"** → **"📝 Buat Tiket"**.
- Pilih kategori (Domain, Masalah, Payment, Push, Migrasi, Pendapatan, Member, Akuisisi, Kendala Web, Claim, Web Update).
- Tulis detail pesan (min 10 karakter).
- Tiket akan masuk ke antrian admin.

### 3. Forum Diskusi
- Klik **"💬 Forum"**.
- **📚 Lihat Topik:** Lihat daftar topik terbuka.
- **📝 Buat Topik:** Hanya untuk Member (New User tidak bisa).
- Klik topik untuk melihat detail & komentar.
- Klik **"💬 Komentar"** untuk berdiskusi.

### 4. Upload Pembayaran
- Klik **"💳 Upload Payment"**.
- Kirim **screenshot/foto bukti transfer**.
- Admin akan memverifikasi dan memberi notifikasi.

### 5. Cek Status
- Klik **"📋 Status Saya"** untuk melihat data diri dan status verifikasi.

---

## 🛠️ PANDUAN ADMIN (SUPER ADMIN)

### Perintah Khusus (Hanya untuk 3 Super Admin)

| Perintah | Fungsi |
| :--- | :--- |
| `/broadcast [pesan]` | Kirim pengumuman ke semua member (konfirmasi 2-step) |
| `/verify_pay [id]` | Verifikasi pembayaran berdasarkan ID |
| `/cekdomain [domain.com]` | Cek status WHOIS domain |
| `/list_members` | Lihat daftar member terverifikasi |

### Admin Panel (Via Menu)
- Klik **"🔧 Admin Ops"** (muncul jika Anda Super Admin).
- **📋 List Member:** Lihat semua member.
- **💳 Pending Pay:** Lihat payment yang menunggu verifikasi.
- **🌐 Cek Domain:** Cek status domain.

### Manajemen Tiket
- Admin melihat semua tiket **Pending** di menu **"📊 Kelola Pending"**.
- Admin bisa mengambil tiket (status berubah `assigned`) dan menyelesaikannya (status `resolved`).

### Manajemen Forum
- Admin bisa **menutup/membuka** topik orang lain.
- Admin bisa **menghapus** topik atau komentar (tombol muncul otomatis).

---

## ⚠️ MANAJEMEN RISIKO & SOP

| Risiko | Mitigasi | SOP |
| :--- | :--- | :--- |
| **Domain Takeover** | Scheduler verifikasi ulang setiap 30 hari | Member wajib memperbarui TXT record sebelum expiry. |
| **Database Corrupt** | WAL mode + `safe_execute` (retry 5x) | Backup otomatis disarankan via cron. |
| **Phishing Broadcast** | 2-Step Approval (Preview → Konfirmasi) | Admin tidak boleh broadcast tanpa persetujuan 2 dari 3 Super Admin. |
| **Spam Verifikasi** | Cooldown 30 detik per user | Jika user spam, otomatis ditolak. |
| **Penyusup (Akun Hilang)** | Prosedur manual via Super Admin | Admin harus verifikasi identitas (nama+domain) sebelum migrasi. |
| **SQL Injection** | Parameterized query (`?`) + sanitasi | Semua input text di-escape. |

### Prosedur Pemulihan Akun (Jika Hilang)
Jika member kehilangan akun Telegram:
1. Member hubungi Super Admin via jalur darurat (WhatsApp/Email).
2. Admin verifikasi dengan menanyakan **Nama Lengkap** & **Domain** yang terdaftar.
3. Admin jalankan perintah SQL (manual) untuk update `telegram_id`:
   ```sql
   UPDATE users SET telegram_id = [ID_BARU] WHERE domain_name = '[domain]';
   ```

---

## 🚀 DEPLOYMENT KE PRODUKSI

### Opsi 1: Menggunakan Screen (Sederhana)
```bash
cd /opt/telegram-bot
source venv/bin/activate
screen -S telegram_bot
    python main.py
```
Tekan `Ctrl+A+D` untuk detach.  
Kembali: `screen -r telegram_bot`

### Opsi 2: Menggunakan Systemd (Auto-Restart)
Buat file `/etc/systemd/system/telegram-bot.service`:
```ini
[Unit]
Description=Telegram Bot Enterprise
After=network.target

[Service]
User=root
WorkingDirectory=/opt/telegram-bot
ExecStart=/opt/telegram-bot/.venv/bin/python /opt/telegram-bot/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Jalankan:
```bash
sudo systemctl daemon-reload
sudo systemctl enable telegram-bot
sudo systemctl start telegram-bot
sudo systemctl status telegram-bot
```

### Opsi 3: Backup Otomatis (Cron)
Tambahkan cron untuk backup database setiap hari:
```bash
crontab -e
```
Tambahkan:
```bash
0 2 * * * cp /opt/telegram-bot/data_member.db /opt/telegram-bot/backups/data_$(date +\%Y\%m\%d).db
```

---

## 🔍 TROUBLESHOOTING

| Masalah | Solusi |
| :--- | :--- |
| **Bot tidak merespon** | Cek log: `sudo journalctl -u telegram-bot -f`. Pastikan TOKEN benar. |
| **Database locked error** | Bot akan retry otomatis. Jika terus terjadi, restart bot. |
| **Verifikasi gagal** | Pastikan record TXT sudah terpropagasi (cek di `dns.google`). Tunggu 10-15 menit. |
| **Broadcast tidak terkirim** | Pastikan pesan tidak kosong. Cek log untuk error rate limit Telegram. |
| **ModuleNotFoundError** | Install ulang: `pip install -r requirements.txt` |

---

## 📊 STATUS & ROADMAP

| Fitur | Status |
| :--- | :--- |
| Core Bot | ✅ Production Ready |
| Verifikasi Domain | ✅ Stable |
| Tiket 11 Kategori | ✅ Stable |
| Forum Diskusi | ✅ Stable |
| Payment | ✅ Stable |
| Admin Tools | ✅ Stable |
| Scheduler Bulanan | ✅ Stable |
| RBAC 3 Super Admin | ✅ Stable |

---

## 📜 LISENSI

Hak Cipta © 2026. **Internal Use Only.**  
Dibangun khusus untuk tim operasional.

---

**Dokumen ini adalah panduan resmi. Simpan sebagai `README.md` di root proyek.**  
Jika ada pertanyaan lebih lanjut, hubungi tim developer. 😊