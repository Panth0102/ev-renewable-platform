package com.evrenewable.model;

import lombok.*;

import javax.persistence.*;
import java.time.Instant;

/**
 * Immutable audit trail — never update rows in this table.
 * Hibernate should only ever INSERT here.
 */
@Entity
@Table(name = "audit_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // actor_id is stored as plain UUID string — no FK so deleting a user
    // doesn't cascade-delete audit history
    @Column(name = "actor_id", columnDefinition = "uuid")
    private java.util.UUID actorId;

    @Column(name = "action", nullable = false, length = 80)
    private String action;

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "entity_id")
    private String entityId;

    // JSONB stored as text; cast explicitly so Postgres accepts varchar → jsonb
    @Column(name = "detail", columnDefinition = "text")
    private String detail;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
