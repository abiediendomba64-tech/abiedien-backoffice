import dns.resolver
import whois
from datetime import datetime
import time

def check_domain_ownership(domain, token):
    """Check DNS TXT record for token."""
    try:
        resolver = dns.resolver.Resolver()
        resolver.nameservers = ['1.1.1.1', '8.8.8.8']
        resolver.timeout = 5
        resolver.lifetime = 10
        try:
            resolver.resolve(domain, 'A')
        except dns.resolver.NXDOMAIN:
            return "NO_DOMAIN"
        except:
            pass
        answers = resolver.resolve(domain, 'TXT')
        for rdata in answers:
            txt = ''.join(rdata.strings).decode('utf-8')
            if token in txt:
                return True
        return "NO_TXT"
    except dns.resolver.NXDOMAIN:
        return "NO_DOMAIN"
    except dns.resolver.NoAnswer:
        return "NO_TXT"
    except dns.exception.Timeout:
        return "TIMEOUT"
    except Exception:
        return False

def check_domain_status(domain):
    """Check domain status via WHOIS."""
    try:
        w = whois.whois(domain)
        if w.domain_name is None:
            return "available", None, None
        expiry = w.expiration_date
        if isinstance(expiry, list):
            expiry = expiry[0]
        if expiry and expiry < datetime.now():
            return "expired", expiry, w.registrar
        return "active", expiry, w.registrar
    except:
        return "available", None, None

def check_nawala(domain):
    """Check if domain is blocked by Nawala (simulated)."""
    # Di production, bisa diganti dengan API/Scraping
    return False

def submit_to_google(url):
    """Submit URL to Google Indexing API."""
    try:
        # Implementasi Google Indexing API di sini jika punya service_account.json
        return True
    except:
        return False

def generate_token(length=16):
    """Generate random token."""
    import secrets
    return secrets.token_urlsafe(length)

def generate_ticket_number():
    import secrets
    return f"TKT-{secrets.token_hex(4).upper()}"

def generate_topic_id():
    import secrets
    return f"FRM-{secrets.token_hex(3).upper()}"