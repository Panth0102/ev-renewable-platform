package com.evrenewable.service;

import com.evrenewable.model.AuditLog;
import com.evrenewable.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Writes immutable audit records asynchronously so that a log-write failure
 * never rolls back the business transaction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Record an audit event.
     *
     * @param actorId    UUID of the user who triggered the action (may be null for system events)
     * @param action     Short action label, e.g. "USER_REGISTER", "SESSION_START"
     * @param entityType Entity class name, e.g. "User", "ChargingSession"
     * @param entityId   String representation of the entity PK
     * @param detail     Optional JSON string with extra context
     * @param ipAddress  Originating IP (may be null)
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UUID actorId, String action, String entityType,
                       String entityId, String detail, String ipAddress) {
        try {
            AuditLog entry = AuditLog.builder()
                    .actorId(actorId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .detail(detail)
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Audit failure must never break the caller
            log.error("Failed to write audit log [action={}]: {}", action, e.getMessage());
        }
    }

    /** Convenience overload without IP address. */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UUID actorId, String action, String entityType,
                       String entityId, String detail) {
        record(actorId, action, entityType, entityId, detail, null);
    }
}
