export type AuditMutationKind = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'export' | 'lock';

export interface AuditMutationContext {
  resource: string;
  kind: AuditMutationKind;
  recordId?: string | number;
  meta?: Record<string, unknown>;
}

export function recordAuditIntent(ctx: AuditMutationContext): void {
  if (import.meta.env.DEV) {
    // R09: wire to POST /audit_logs or Refine audit provider when backend is ready
    console.debug('[audit]', ctx.kind, ctx.resource, ctx.recordId ?? '', ctx.meta ?? {});
  }
}
