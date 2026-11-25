package io.github.davidnicolini.teampilot;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import io.github.davidnicolini.teampilot.domain.model.Rca;
import io.github.davidnicolini.teampilot.domain.model.Role;
import io.github.davidnicolini.teampilot.domain.model.Usuario;
import io.github.davidnicolini.teampilot.infrastructure.repository.RcaRepository;
import io.github.davidnicolini.teampilot.infrastructure.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;

/**
 * Cria um supervisor e um RCA de exemplo em ambiente local, apenas para
 * facilitar testar a API manualmente sem precisar
 * inserir dados na mao. Nao roda em producao.
 *
 * Login supervisor: supervisor / 123456
 * Login rca:        joao.rca  / 123456
 */
@Component
@Profile("!prod")
@RequiredArgsConstructor
public class DevDataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RcaRepository rcaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            return; 
        }

        Rca rca = rcaRepository.save(Rca.builder()
                .codigo("RCA001")
                .nome("Joao da Silva")
                .telefone("(61) 99999-0000")
                .metaMensal(new BigDecimal("100000.00"))
                .build());

        usuarioRepository.save(Usuario.builder()
                .login("supervisor")
                .senha(passwordEncoder.encode("123456"))
                .role(Role.ROLE_SUPERVISOR)
                .build());

        usuarioRepository.save(Usuario.builder()
                .login("joao.rca")
                .senha(passwordEncoder.encode("123456"))
                .role(Role.ROLE_RCA)
                .rca(rca)
                .build());
    }
}

