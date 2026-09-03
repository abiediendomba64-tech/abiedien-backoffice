"""
Repository Layer - Data Access Abstraction
Pisahkan handler dari query logic
"""
import os
from supabase import create_client, Client
from typing import List, Dict, Optional

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ==================== TICKET REPOSITORY ====================
class TicketRepository:
    """Data access untuk Tickets"""
    
    @staticmethod
    def get_pending_tickets(limit: int = 20) -> List[Dict]:
        """Get pending tickets dengan user info"""
        result = (
            supabase
            .table("tickets")
            .select("""
                id,
                ticket_number,
                category,
                priority,
                status,
                title,
                created_at,
                users:user_id (
                    full_name,
                    telegram_id
                )
            """)
            .eq("status", "pending")
            .order("priority", desc=False)
            .order("created_at")
            .limit(limit)
            .execute()
        )
        return result.data

    @staticmethod
    def get_ticket_detail(ticket_id: int) -> Optional[Dict]:
        """Get detail tiket + messages + conversation state"""
        result = (
            supabase
            .table("tickets")
            .select("""
                id,
                ticket_number,
                category,
                priority,
                status,
                title,
                description,
                collected_data,
                created_at,
                updated_at,
                resolved_at,
                users:user_id (
                    id,
                    full_name,
                    telegram_id,
                    domain_name
                ),
                assigned_user:assigned_to (
                    id,
                    full_name,
                    role
                ),
                ticket_messages (
                    id,
                    sender_id,
                    message,
                    created_at
                )
            """)
            .eq("id", ticket_id)
            .single()
            .execute()
        )
        return result.data

    @staticmethod
    def get_user_tickets(user_id: int, status: str = "pending") -> List[Dict]:
        """Get tickets milik user tertentu"""
        result = (
            supabase
            .table("tickets")
            .select("id, ticket_number, category, status, title, created_at")
            .eq("user_id", user_id)
            .eq("status", status)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    @staticmethod
    def create_ticket(user_id: int, category: str, title: str, 
                     description: str, collected_data: Dict) -> Dict:
        """Create new ticket"""
        # Generate ticket number
        count = supabase.table("tickets").select("COUNT()").execute()
        ticket_number = f"TKT-{count.count + 1:04d}"
        
        result = (
            supabase
            .table("tickets")
            .insert({
                "user_id": user_id,
                "ticket_number": ticket_number,
                "category": category,
                "priority": "urgent" if category == "MAINTENANCE" else "medium",
                "status": "pending",
                "title": title,
                "description": description,
                "collected_data": collected_data
            })
            .execute()
        )
        return result.data[0] if result.data else None

    @staticmethod
    def update_ticket_status(ticket_id: int, status: str) -> bool:
        """Update ticket status"""
        result = (
            supabase
            .table("tickets")
            .update({"status": status, "updated_at": "now()"})
            .eq("id", ticket_id)
            .execute()
        )
        return bool(result.data)

    @staticmethod
    def assign_ticket(ticket_id: int, admin_id: int) -> bool:
        """Assign ticket to admin"""
        result = (
            supabase
            .table("tickets")
            .update({
                "assigned_to": admin_id,
                "status": "assigned",
                "updated_at": "now()"
            })
            .eq("id", ticket_id)
            .execute()
        )
        return bool(result.data)

    @staticmethod
    def append_message(ticket_id: int, sender_id: int, message: str) -> bool:
        """Append message to ticket conversation"""
        result = (
            supabase
            .table("ticket_messages")
            .insert({
                "ticket_id": ticket_id,
                "sender_id": sender_id,
                "message": message
            })
            .execute()
        )
        return bool(result.data)

# ==================== USER REPOSITORY ====================
class UserRepository:
    """Data access untuk Users"""
    
    @staticmethod
    def get_by_telegram_id(telegram_id: int) -> Optional[Dict]:
        """Get user by telegram ID"""
        result = (
            supabase
            .table("users")
            .select("*")
            .eq("telegram_id", telegram_id)
            .single()
            .execute()
        )
        return result.data

    @staticmethod
    def get_pending_members(limit: int = 20) -> List[Dict]:
        """Get new users awaiting verification"""
        result = (
            supabase
            .table("users")
            .select("id, telegram_id, full_name, domain_name, created_at")
            .eq("role", "new_user")
            .eq("domain_verified", False)
            .order("created_at")
            .limit(limit)
            .execute()
        )
        return result.data

    @staticmethod
    def verify_domain(user_id: int) -> bool:
        """Mark domain as verified"""
        result = (
            supabase
            .table("users")
            .update({
                "domain_verified": True,
                "role": "member",
                "updated_at": "now()"
            })
            .eq("id", user_id)
            .execute()
        )
        return bool(result.data)

# ==================== PAYMENT REPOSITORY ====================
class PaymentRepository:
    """Data access untuk Payments"""
    
    @staticmethod
    def get_pending_payments(limit: int = 20) -> List[Dict]:
        """Get pending payment verifications"""
        result = (
            supabase
            .table("payments")
            .select("""
                id,
                payment_number,
                amount,
                status,
                created_at,
                users:user_id (
                    full_name,
                    telegram_id
                )
            """)
            .eq("status", "pending")
            .order("created_at")
            .limit(limit)
            .execute()
        )
        return result.data

    @staticmethod
    def verify_payment(payment_id: int, admin_id: int, notes: str = "") -> bool:
        """Approve payment"""
        result = (
            supabase
            .table("payments")
            .update({
                "status": "verified",
                "verified_by": admin_id,
                "verification_notes": notes,
                "verified_at": "now()"
            })
            .eq("id", payment_id)
            .execute()
        )
        return bool(result.data)

    @staticmethod
    def reject_payment(payment_id: int, admin_id: int, reason: str) -> bool:
        """Reject payment"""
        result = (
            supabase
            .table("payments")
            .update({
                "status": "rejected",
                "verified_by": admin_id,
                "verification_notes": reason
            })
            .eq("id", payment_id)
            .execute()
        )
        return bool(result.data)

# ==================== AUDIT REPOSITORY ====================
class AuditRepository:
    """Data access untuk Audit Logs (immutable)"""
    
    @staticmethod
    def log_action(actor_id: int, action_type: str, resource_type: str,
                   resource_id: int, old_value: Dict = None, new_value: Dict = None) -> bool:
        """Log action to audit trail"""
        result = (
            supabase
            .table("audit_logs")
            .insert({
                "actor_id": actor_id,
                "action_type": action_type,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "old_value": old_value,
                "new_value": new_value
            })
            .execute()
        )
        return bool(result.data)

    @staticmethod
    def get_audit_trail(limit: int = 100) -> List[Dict]:
        """Get recent audit logs (super admin only)"""
        result = (
            supabase
            .table("audit_logs")
            .select("""
                id,
                actor_id,
                action_type,
                resource_type,
                created_at,
                users:actor_id (
                    full_name,
                    role
                )
            """)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data

print("✅ Repository layer initialized")