import { dbLogAudit } from './db';

export interface AuditActionParams {
  actorId: number;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
}

export class AuditLogService {
  /**
   * Records a role-based action into the audit_logs database table,
   * capturing the actor's ID, action type, and target resource for accountability across all workspaces.
   */
  public static async recordAction(params: AuditActionParams): Promise<any> {
    try {
      const result = await dbLogAudit({
        actor_id: params.actorId,
        actor_role: params.actorRole,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        details_json: params.details || {},
        ip_address: params.ipAddress || '127.0.0.1'
      });
      console.log(`[AuditLog] Recorded action: ${params.action} by actor #${params.actorId} (${params.actorRole || 'unknown'}) on target ${params.targetType || 'N/A'}:${params.targetId || 'N/A'}`);
      return result;
    } catch (error) {
      console.error(`[AuditLog Error] Failed to record audit log for action "${params.action}":`, error);
      return null;
    }
  }
}

export const auditService = AuditLogService;
