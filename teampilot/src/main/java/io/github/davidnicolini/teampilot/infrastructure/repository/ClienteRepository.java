package io.github.davidnicolini.teampilot.infrastructure.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import io.github.davidnicolini.teampilot.domain.model.Cliente;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByRcaId(Long rcaId);
}
