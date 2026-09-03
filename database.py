"""
Database Layer: Wrapper anti-lock dan inisialisasi tabel.
Semua operasi CRUD berada di models/*.py.
"""

import sqlite3
import time
from config import DB_NAME

# ================== WRAPPER ANTI DATABASE LOCK ==================
def safe_execute(query, params=(), retries=5, fetch=False):
    """
    Eksekusi query SQL dengan retry mechanism (exponential backoff).
    - WAL mode untuk mengurangi lock.
    - Timeout 20 detik.
    - Jika terjadi lock, retry hingga 5 kali dengan jeda eksponensial.
    """
    for attempt in range(retries):
        try:
            conn = sqlite3.connect(DB_NAME, timeout=20.0)
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            cursor = conn.cursor()
            cursor.execute(query, params)
            result = cursor.fetchall() if fetch else True
            conn.commit()
            conn.close()
            return result
        except sqlite3.OperationalError as e:
            if "locked" in str(e) or "busy" in str(e):
                if attempt < retries - 1:
                    time.sleep(1.5 ** attempt)
                    continue
            raise e
    return False

# ================== INISIALISASI DATABASE ==================
def init_db():
    """Buat semua tabel yang diperlukan jika belum ada."""
    print("🔄 Migrasi Database dimulai...")
    
    # Users
    safe_execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER UNIQUE NOT NULL,
            telegram_username TEXT,
            full_name TEXT,
            whatsapp_number TEXT,
            domain_name TEXT,
            verification_token TEXT,
            token_expiry INTEGER,
            tg_handle TEXT,
            role TEXT DEFAULT 'new_user',
            is_verified BOOLEAN DEFAULT 0,
            domain_verified BOOLEAN DEFAULT 0,
            last_verified_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Migrasi kolom (jika upgrade dari versi lama)
    for col in ['verification_token', 'token_expiry', 'domain_verified', 'role', 'last_verified_at']:
        try:
            safe_execute(f"ALTER TABLE users ADD COLUMN {col} TEXT")
        except:
            pass

    # Tickets
    safe_execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_number TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            assigned_to INTEGER,
            priority TEXT DEFAULT 'medium',
            admin_reply TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Forum Topics
    safe_execute("""
        CREATE TABLE IF NOT EXISTS forum_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            status TEXT DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Forum Comments
    safe_execute("""
        CREATE TABLE IF NOT EXISTS forum_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            comment_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE
        )
    """)

    # Payments
    safe_execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount TEXT,
            proof_file_id TEXT,
            status TEXT DEFAULT 'pending',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Web Requests
    safe_execute("""
        CREATE TABLE IF NOT EXISTS web_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            domain TEXT,
            request_type TEXT,
            description TEXT,
            status TEXT DEFAULT 'pending',
            admin_reply TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Member Websites (NDP/QWB/Nawala)
    safe_execute("""
        CREATE TABLE IF NOT EXISTS member_websites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            domain TEXT,
            ndp_status TEXT DEFAULT 'pending',
            qwb_status TEXT DEFAULT 'inactive',
            last_indexed TIMESTAMP,
            is_nawala BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Announcements
    safe_execute("""
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER,
            title TEXT,
            content TEXT,
            target_role TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Rate Limits
    safe_execute("""
        CREATE TABLE IF NOT EXISTS rate_limits (
            user_id INTEGER PRIMARY KEY,
            last_action INTEGER,
            daily_count INTEGER DEFAULT 0
        )
    """)

    # Audit Logs
    safe_execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER,
            action TEXT,
            target_id TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ Database siap.")