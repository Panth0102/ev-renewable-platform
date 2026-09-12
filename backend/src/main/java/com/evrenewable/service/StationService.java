package com.evrenewable.service;

import com.evrenewable.dto.request.CreateChargerRequest;
import com.evrenewable.dto.request.CreateStationRequest;
import com.evrenewable.dto.response.ChargerResponse;
import com.evrenewable.dto.response.StationResponse;
import com.evrenewable.exception.ResourceNotFoundException;
import com.evrenewable.model.Charger;
import com.evrenewable.model.Station;
import com.evrenewable.repository.ChargerRepository;
import com.evrenewable.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StationService {

    private final StationRepository stationRepository;
    private final ChargerRepository chargerRepository;

    // ── Stations ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<StationResponse> getAllStations() {
        return stationRepository.findByStatusWithChargers(Station.StationStatus.ACTIVE)
                .stream().map(StationResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StationResponse getStation(UUID id) {
        return StationResponse.from(findStation(id));
    }

    @Transactional
    public StationResponse createStation(CreateStationRequest req) {
        Station station = Station.builder()
                .name(req.getName())
                .city(req.getCity())
                .state(req.getState())
                .address(req.getAddress())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .status(Station.StationStatus.ACTIVE)
                .totalCapacityKw(BigDecimal.ZERO)
                .timezone(req.getTimezone() != null ? req.getTimezone() : "Asia/Kolkata")
                .notes(req.getNotes())
                .build();
        station = stationRepository.save(station);
        log.info("Created station: {}", station.getName());
        return StationResponse.from(station);
    }

    @Transactional
    public StationResponse updateStatus(UUID id, Station.StationStatus status) {
        Station station = findStation(id);
        station.setStatus(status);
        return StationResponse.from(stationRepository.save(station));
    }

    // ── Chargers ─────────────────────────────────────────────
    @Transactional
    public ChargerResponse addCharger(UUID stationId, CreateChargerRequest req) {
        Station station = findStation(stationId);
        Charger charger = Charger.builder()
                .station(station)
                .chargerCode(req.getChargerCode())
                .chargerType(req.getChargerType())
                .powerKw(req.getPowerKw())
                .status(Charger.ChargerStatus.AVAILABLE)
                .connectorType(req.getConnectorType())
                .isSmart(req.isSmart())
                .build();
        charger = chargerRepository.save(charger);

        // Update station total capacity
        BigDecimal total = chargerRepository.findByStationId(stationId)
                .stream()
                .map(Charger::getPowerKw)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        station.setTotalCapacityKw(total);
        stationRepository.save(station);

        log.info("Added charger {} to station {}", charger.getChargerCode(), station.getName());
        return ChargerResponse.from(charger);
    }

    @Transactional
    public ChargerResponse updateChargerStatus(UUID chargerId, Charger.ChargerStatus status) {
        Charger charger = chargerRepository.findById(chargerId)
                .orElseThrow(() -> new ResourceNotFoundException("Charger", "id", chargerId));
        charger.setStatus(status);
        return ChargerResponse.from(chargerRepository.save(charger));
    }

    @Transactional(readOnly = true)
    public List<ChargerResponse> getChargersForStation(UUID stationId) {
        return chargerRepository.findByStationId(stationId)
                .stream().map(ChargerResponse::from).collect(Collectors.toList());
    }

    // ── Internal helper ──────────────────────────────────────
    Station findStation(UUID id) {
        return stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Station", "id", id));
    }
}
