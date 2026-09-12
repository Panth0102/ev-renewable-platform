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
@Table(name = "charging_sessions")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChargingSession {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "charger_id", nullable = false)
    private Charger charger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opt_request_id")
    private OptimisationRequest optRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status = SessionStatus.PENDING;

    @Column(name = "soc_start", precision = 5, scale = 2)
    private BigDecimal socStart;

    @Column(name = "soc_end", precision = 5, scale = 2)
    private BigDecimal socEnd;

    @Column(name = "energy_delivered_kwh", precision = 10, scale = 3)
    private BigDecimal energyDeliveredKwh;

    @Column(name = "avg_power_kw", precision = 7, scale = 2)
    private BigDecimal avgPowerKw;

    @Column(name = "peak_power_kw", precision = 7, scale = 2)
    private BigDecimal peakPowerKw;

    @Column(name = "renewable_pct", precision = 5, scale = 2)
    private BigDecimal renewablePct;

    @Column(name = "cost_inr", precision = 10, scale = 2)
    private BigDecimal costInr;

    @Column(name = "co2_saved_kg", precision = 8, scale = 3)
    private BigDecimal co2SavedKg;

    @Column(name = "green_score")
    private Short greenScore;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum SessionStatus {
        PENDING, ACTIVE, COMPLETED, CANCELLED, FAULTED
    }
}
