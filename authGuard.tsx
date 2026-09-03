import React from 'react';
import { UserRole } from '../types';
import { ShieldAlert, Lock } from 'lucide-react';

export const ROLE_LEVELS: Record<string, number> = {
  new_user: 0,
  member: 1,
  admin: 2,
  dev: 3,
  super_admin: 4,
  root: 5,
};

export function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role?.toLowerCase()] ?? 0;
}

export function hasAccess(userRole: string, requiredRole: string): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export const TIER_NAMES: Record<string, { label: string; tier: number; desc: string }> = {
  new_user: { label: 'New User (Tier 0)', tier: 0, desc: 'Onboarding & Pending Review' },
  member: { label: 'Member (Tier 1)', tier: 1, desc: 'Requester, Tickets & Forum' },
  admin: { label: 'Admin Operasional (Tier 2)', tier: 2, desc: 'Operational & Ticket Decisions' },
  dev: { label: 'Dev Tech (Tier 3)', tier: 3, desc: 'Technical, DNS & Infrastructure' },
  super_admin: { label: 'Super Admin (Tier 4)', tier: 4, desc: 'High-Risk & Financial Security' },
  root: { label: 'Root / System Owner (Tier 5)', tier: 5, desc: 'Emergency & System Recovery' },
};

interface RoleGuardProps {
  minRole: UserRole | string;
  currentRole: UserRole | string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * RoleGuard component to conditionally render or disable operations in workspaces
 * based on the 5-Tier RBAC hierarchy (Tier 0 to Tier 5).
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  minRole,
  currentRole,
  fallback,
  children,
}) => {
  const allowed = hasAccess(currentRole, minRole);

  if (!allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }
    const requiredInfo = TIER_NAMES[minRole] || { label: `Tier minimum: ${minRole}` };
    const currentInfo = TIER_NAMES[currentRole] || { label: currentRole };

    return (
      <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <span className="font-bold text-rose-200">Akses Dibatasi oleh RBAC 5-Tier</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Operasi ini memerlukan otorisasi <strong className="text-slate-200">{requiredInfo.label}</strong>. Role Anda saat ini: <strong className="text-amber-300">{currentInfo.label}</strong>.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-300 uppercase shrink-0 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Locked
        </span>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Higher-Order Component (HOC) `requireRole` to wrap workspace components or action buttons
 * with strict tier enforcement and unified UI feedback.
 */
export function requireRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  minRole: UserRole | string
) {
  return function WithRoleComponent(props: P & { currentUserRole?: string; currentRole?: string }) {
    const role = props.currentUserRole || props.currentRole || 'new_user';
    const allowed = hasAccess(role, minRole);

    if (!allowed) {
      const requiredInfo = TIER_NAMES[minRole] || { label: minRole };
      return (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">Akses Workspace Dibatasi</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Workspace atau panel ini memerlukan otorisasi minimum <span className="text-amber-300 font-semibold">{requiredInfo.label}</span>. Role akun Anda saat ini tidak memenuhi syarat untuk operasi ini.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Helper to assert action permissions inside event handlers (e.g. resolve, approve).
 * Throws or returns an error message for unified UI feedback.
 */
export function assertActionPermission(currentRole: string, minRole: string, actionName: string): boolean {
  if (!hasAccess(currentRole, minRole)) {
    const required = TIER_NAMES[minRole]?.label || minRole;
    throw new Error(`⛔ Aksi ditolak (${actionName}): Memerlukan otorisasi ${required}.`);
  }
  return true;
}
