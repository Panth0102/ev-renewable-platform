package com.evrenewable.dto.request;

import lombok.Data;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Future;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class FleetOptimisationRequestDto {

    @NotNull(message = "Fleet ID is required")
    private UUID fleetId;

    /**
     * Maximum aggregate power the station can provide at any one time (kW).
     * Used to prevent peak overload across the fleet.
     */
    @NotNull @DecimalMin("1.0")
    private BigDecimal stationCapKw;

    /**
     * All vehicles in the fleet must be ready by this time.
     */
    @NotNull(message = "Departure time is required")
    @Future(message = "Departure time must be in the future")
    private Instant departureTime;
}
