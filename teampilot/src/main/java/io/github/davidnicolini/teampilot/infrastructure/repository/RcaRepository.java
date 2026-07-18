package io.github.davidnicolini.teampilot.infrastructure.repository;

import io.github.davidnicolini.teampilot.domain.model.Rca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RcaRepository extends JpaRepository<Rca, Long> {
    Optional<Rca> findByCodigo(String codigo);
}
