package io.github.davidnicolini.teampilot.infrastructure.repository;

import io.github.davidnicolini.teampilot.domain.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByLogin(String login);
}
