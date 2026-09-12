package com.evrenewable.dto.response;

import com.evrenewable.model.Station;
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
public class StationResponse {
    private UUID                  id;
    private String                name;
    private String                city;
    private String                state;
    private String                address;
    private BigDecimal            latitude;
    private BigDecimal            longitude;
    private Station.StationStatus status;
    private BigDecimal            totalCapacityKw;
    private String                timezone;
    private String                notes;
    private Instant               createdAt;
    private List<ChargerResponse> chargers;

    public static StationResponse from(Station s) {
        return StationResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .city(s.getCity())
                .state(s.getState())
                .address(s.getAddress())
                .latitude(s.getLatitude())
                .longitude(s.getLongitude())
                .status(s.getStatus())
                .totalCapacityKw(s.getTotalCapacityKw())
                .timezone(s.getTimezone())
                .notes(s.getNotes())
                .createdAt(s.getCreatedAt())
                .chargers(s.getChargers() == null ? List.of()
                        : s.getChargers().stream()
                              .map(ChargerResponse::from)
                              .collect(Collectors.toList()))
                .build();
    }
}
