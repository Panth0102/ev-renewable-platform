package com.evrenewable.model;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "energy_signals",
       uniqueConstraints = @UniqueConstraint(columnNames = {"signal_time", "source"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EnergySignal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "signal_time", nullable = false)
    private Instant signalTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private EnergySource source = EnergySource.MIXED;

    @Column(name = "renewable_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal renewablePct = BigDecimal.ZERO;

    @Column(name = "carbon_intensity_gco2_kwh", precision = 8, scale = 2)
    private BigDecimal carbonIntensityGco2Kwh;

    @Column(name = "electricity_price_per_kwh", precision = 8, scale = 4)
    private BigDecimal electricityPricePerKwh;

    @Column(name = "grid_load_pct", precision = 5, scale = 2)
    private BigDecimal gridLoadPct;

    @Column(name = "solar_forecast_kw", precision = 10, scale = 2)
    private BigDecimal solarForecastKw;

    @Column(name = "wind_forecast_kw", precision = 10, scale = 2)
    private BigDecimal windForecastKw;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt = Instant.now();

    public enum EnergySource {
        SOLAR, WIND, HYDRO, GRID, BATTERY, MIXED
    }
}
