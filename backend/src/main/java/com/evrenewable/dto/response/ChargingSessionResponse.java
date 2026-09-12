package com.evrenewable.dto.response;

import com.evrenewable.model.ChargingSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChargingSessionResponse {
    private UUID                         id;
    private UUID                         vehicleId;
    private String                       vehicleName;
    private UUID                         chargerId;
    private String                       chargerCode;
    private UUID                         stationId;
    private String                       stationName;
    private ChargingSession.SessionStatus status;
    private BigDecimal                   socStart;
    private BigDecimal                   socEnd;
    private BigDecimal                   energyDeliveredKwh;
    private BigDecimal                   renewablePct;
    private BigDecimal                   costInr;
    private BigDecimal                   co2SavedKg;
    private Short                        greenScore;
    private Instant                      startedAt;
    private Instant                      endedAt;
    private Instant                      createdAt;

    public static ChargingSessionResponse from(ChargingSession s) {
        return ChargingSessionResponse.builder()
                .id(s.getId())
                .vehicleId(s.getVehicle().getId())
                .vehicleName(s.getVehicle().getDisplayName())
                .chargerId(s.getCharger().getId())
                .chargerCode(s.getCharger().getChargerCode())
                .stationId(s.getStation().getId())
                .stationName(s.getStation().getName())
                .status(s.getStatus())
                .socStart(s.getSocStart())
                .socEnd(s.getSocEnd())
                .energyDeliveredKwh(s.getEnergyDeliveredKwh())
                .renewablePct(s.getRenewablePct())
                .costInr(s.getCostInr())
                .co2SavedKg(s.getCo2SavedKg())
                .greenScore(s.getGreenScore())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
