package com.evrenewable.repository;

import com.evrenewable.model.EnergySignal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EnergySignalRepository extends JpaRepository<EnergySignal, Long> {

    // Last N hours of signals for the optimizer
    @Query("SELECT e FROM EnergySignal e WHERE e.signalTime >= :from ORDER BY e.signalTime ASC")
    List<EnergySignal> findFromTime(Instant from);

    // Signals between a time window — used by scheduler
    List<EnergySignal> findBySignalTimeBetweenOrderBySignalTimeAsc(Instant start, Instant end);

    // Latest signal available
    @Query("SELECT e FROM EnergySignal e ORDER BY e.signalTime DESC LIMIT 1")
    EnergySignal findLatest();
}
