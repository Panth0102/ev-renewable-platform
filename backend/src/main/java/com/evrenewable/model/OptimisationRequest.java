package com.evrenewable.model;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "optimisation_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OptimisationRequest {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charger_id")
    private Charger charger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    // ── EV state at request time ─────────────────────────────
    @Column(name = "current_soc", nullable = false, precision = 5, scale = 2)
    private BigDecimal currentSoc;

    @Column(name = "target_soc", nullable = false, precision = 5, scale = 2)
    private BigDecimal targetSoc;

    @Column(name = "battery_capacity_kwh", nullable = false, precision = 7, scale = 2)
    private BigDecimal batteryCapacityKwh;

    @Column(name = "charger_limit_kw", nullable = false, precision = 7, scale = 2)
    private BigDecimal chargerLimitKw;

    @Column(name = "departure_time", nullable = false)
    private Instant departureTime;

    // ── Result ───────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OptStatus status = OptStatus.PENDING;

    @Column(name = "green_score")
    private Short greenScore;

    @Column(name = "renewable_alignment_pct", precision = 5, scale = 2)
    private BigDecimal renewableAlignmentPct;

    @Column(name = "estimated_cost_inr", precision = 10, scale = 2)
    private BigDecimal estimatedCostInr;

    @Column(name = "estimated_co2_kg", precision = 8, scale = 3)
    private BigDecimal estimatedCo2Kg;

    @Column(name = "best_window_start")
    private Instant bestWindowStart;

    @Column(name = "best_window_end")
    private Instant bestWindowEnd;

    @Column(name = "total_energy_kwh", precision = 8, scale = 3)
    private BigDecimal totalEnergyKwh;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OptimisationScheduleSlot> slots = new ArrayList<>();

    public enum OptStatus {
        PENDING, RUNNING, COMPLETED, FAILED
    }
}
