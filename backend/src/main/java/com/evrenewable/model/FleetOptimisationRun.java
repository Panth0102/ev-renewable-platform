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
@Table(name = "fleet_optimisation_runs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FleetOptimisationRun {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fleet_id")
    private Fleet fleet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OptimisationRequest.OptStatus status = OptimisationRequest.OptStatus.PENDING;

    @Column(name = "station_cap_kw", nullable = false, precision = 8, scale = 2)
    private BigDecimal stationCapKw;

    @Column(name = "peak_naive_kw", precision = 8, scale = 2)
    private BigDecimal peakNaiveKw;

    @Column(name = "peak_opt_kw", precision = 8, scale = 2)
    private BigDecimal peakOptKw;

    @Column(name = "renewable_naive_pct", precision = 5, scale = 2)
    private BigDecimal renewableNaivePct;

    @Column(name = "renewable_opt_pct", precision = 5, scale = 2)
    private BigDecimal renewableOptPct;

    @Column(name = "vehicles_count")
    private Short vehiclesCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FleetVehicleSchedule> vehicleSchedules = new ArrayList<>();
}
