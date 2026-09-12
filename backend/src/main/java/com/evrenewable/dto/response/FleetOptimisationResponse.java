package com.evrenewable.dto.response;

import com.evrenewable.model.FleetOptimisationRun;
import com.evrenewable.model.FleetVehicleSchedule;
import com.evrenewable.model.OptimisationRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FleetOptimisationResponse {

    private UUID                        id;
    private UUID                        fleetId;
    private OptimisationRequest.OptStatus status;
    private Short                       vehiclesCount;
    private BigDecimal                  stationCapKw;
    private BigDecimal                  peakNaiveKw;
    private BigDecimal                  peakOptKw;
    private BigDecimal                  renewableNaivePct;
    private BigDecimal                  renewableOptPct;
    private Instant                     createdAt;
    private Instant                     completedAt;
    private List<VehicleSlotResponse>   vehicleSchedules;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VehicleSlotResponse {
        private UUID       vehicleId;
        private String     vehicleCode;
        private Instant    slotStart;
        private Instant    slotEnd;
        private BigDecimal powerKw;
        private BigDecimal renewablePct;
        private short      slotOrder;
    }

    public static FleetOptimisationResponse from(FleetOptimisationRun run) {
        List<VehicleSlotResponse> schedules = run.getVehicleSchedules() == null
                ? List.of()
                : run.getVehicleSchedules().stream()
                        .map(s -> VehicleSlotResponse.builder()
                                .vehicleId(s.getVehicle().getId())
                                .vehicleCode(s.getVehicle().getVehicleCode())
                                .slotStart(s.getSlotStart())
                                .slotEnd(s.getSlotEnd())
                                .powerKw(s.getPowerKw())
                                .renewablePct(s.getRenewablePct())
                                .slotOrder(s.getSlotOrder())
                                .build())
                        .collect(Collectors.toList());

        return FleetOptimisationResponse.builder()
                .id(run.getId())
                .fleetId(run.getFleet() != null ? run.getFleet().getId() : null)
                .status(run.getStatus())
                .vehiclesCount(run.getVehiclesCount())
                .stationCapKw(run.getStationCapKw())
                .peakNaiveKw(run.getPeakNaiveKw())
                .peakOptKw(run.getPeakOptKw())
                .renewableNaivePct(run.getRenewableNaivePct())
                .renewableOptPct(run.getRenewableOptPct())
                .createdAt(run.getCreatedAt())
                .completedAt(run.getCompletedAt())
                .vehicleSchedules(schedules)
                .build();
    }
}
