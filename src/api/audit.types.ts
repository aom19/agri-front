export type AuditEntry = {
    id: number
    entity_type: string
    entity_id: string
    entity_name?: string | null
    action: string
    actor_id: number | null
    actor_name?: string | null
    changes: Record<string, unknown> | null
    created_at: string
}
