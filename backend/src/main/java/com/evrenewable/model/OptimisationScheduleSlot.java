package com.evrenewable.model;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "optimisation_schedule_slots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OptimisationScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private OptimisationRequest request;

    @Column(name = "slot_start", nullable = false)
    private Instant slotStart;

    @Column(name = "slot_end", nullable = false)
    private Instant slotEnd;

    @Column(name = "power_kw", nullable = false, precision = 7, scale = 2)
    private BigDecimal powerKw = BigDecimal.ZERO;

    @Column(name = "renewable_pct", precision = 5, scale = 2)
    private BigDecimal renewablePct;

    @Column(name = "slot_order", nullable = false)
    private Short slotOrder;
}
