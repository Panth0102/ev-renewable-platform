package com.evrenewable.model;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chargers")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Charger {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @Column(name = "charger_code", nullable = false, unique = true, length = 40)
    private String chargerCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "charger_type", nullable = false, length = 20)
    private ChargerType chargerType = ChargerType.AC_FAST;

    @Column(name = "power_kw", nullable = false, precision = 8, scale = 2)
    private BigDecimal powerKw;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ChargerStatus status = ChargerStatus.AVAILABLE;

    @Column(name = "connector_type", length = 30)
    private String connectorType;

    @Column(name = "ocpp_id", length = 80)
    private String ocppId;

    @Column(name = "is_smart", nullable = false)
    private boolean isSmart = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum ChargerType {
        AC_SLOW, AC_FAST, DC_FAST, DC_ULTRA
    }

    public enum ChargerStatus {
        AVAILABLE, OCCUPIED, FAULTED, OFFLINE
    }
}
