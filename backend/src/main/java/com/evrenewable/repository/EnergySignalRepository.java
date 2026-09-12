package com.evrenewable.repository;

import com.evrenewable.model.EnergySignal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnergySignalRepository extends JpaRepository<EnergySignal, Long> {

    // Signals from a point in time forward — used by the optimizer
    @Query("SELECT e FROM EnergySignal e WHERE e.signalTime >= :from ORDER BY e.signalTime ASC")
    List<EnergySignal> findFromTime(Instant from);

    // Signals within a window — used by the greedy solver
    List<EnergySignal> findBySignalTimeBetweenOrderBySignalTimeAsc(Instant start, Instant end);

    // Latest signal available — Spring Data derived method (no JPQL LIMIT needed)
    Optional<EnergySignal> findFirstByOrderBySignalTimeDesc();
}
