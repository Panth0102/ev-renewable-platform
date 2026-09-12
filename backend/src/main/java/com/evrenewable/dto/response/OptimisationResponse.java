package com.evrenewable.dto.response;

import com.evrenewable.model.OptimisationRequest;
import com.evrenewable.model.OptimisationScheduleSlot;
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
public class OptimisationResponse {
    private UUID                            id;
    private UUID                            vehicleId;
    private OptimisationRequest.OptStatus   status;
    private Short                           greenScore;
    private BigDecimal                      renewableAlignmentPct;
    private BigDecimal                      estimatedCostInr;
    private BigDecimal                      estimatedCo2Kg;
    private BigDecimal                      totalEnergyKwh;
    private Instant                         bestWindowStart;
    private Instant                         bestWindowEnd;
    private Instant                         departureTime;
    private String                          errorMessage;
    private Instant                         createdAt;
    private Instant                         completedAt;
    private List<ScheduleSlotResponse>      slots;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ScheduleSlotResponse {
        private Instant    slotStart;
        private Instant    slotEnd;
        private BigDecimal powerKw;
        private BigDecimal renewablePct;
        private short      slotOrder;
    }

    public static OptimisationResponse from(OptimisationRequest r) {
        List<ScheduleSlotResponse> slots = r.getSlots() == null ? List.of()
                : r.getSlots().stream().map(s -> ScheduleSlotResponse.builder()
                        .slotStart(s.getSlotStart())
                        .slotEnd(s.getSlotEnd())
                        .powerKw(s.getPowerKw())
                        .renewablePct(s.getRenewablePct())
                        .slotOrder(s.getSlotOrder())
                        .build())
                        .collect(Collectors.toList());

        return OptimisationResponse.builder()
                .id(r.getId())
                .vehicleId(r.getVehicle().getId())
                .status(r.getStatus())
                .greenScore(r.getGreenScore())
                .renewableAlignmentPct(r.getRenewableAlignmentPct())
                .estimatedCostInr(r.getEstimatedCostInr())
                .estimatedCo2Kg(r.getEstimatedCo2Kg())
                .totalEnergyKwh(r.getTotalEnergyKwh())
                .bestWindowStart(r.getBestWindowStart())
                .bestWindowEnd(r.getBestWindowEnd())
                .departureTime(r.getDepartureTime())
                .errorMessage(r.getErrorMessage())
                .createdAt(r.getCreatedAt())
                .completedAt(r.getCompletedAt())
                .slots(slots)
                .build();
    }
}
