package io.github.davidnicolini.teampilot.application.controller;

import io.github.davidnicolini.teampilot.domain.dto.request.LoginRequest;
import io.github.davidnicolini.teampilot.domain.dto.request.RegisterRequest;
import io.github.davidnicolini.teampilot.domain.dto.response.LoginResponse;
import io.github.davidnicolini.teampilot.domain.model.Rca;
import io.github.davidnicolini.teampilot.domain.model.Role;
import io.github.davidnicolini.teampilot.domain.model.Usuario;
import io.github.davidnicolini.teampilot.infrastructure.repository.RcaRepository;
import io.github.davidnicolini.teampilot.infrastructure.repository.UsuarioRepository;
import io.github.davidnicolini.teampilot.infrastructure.security.JwtService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final RcaRepository rcaRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.login(), request.senha()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtService.gerarToken(userDetails);

        return new LoginResponse(token);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (usuarioRepository.findByLogin(request.login().trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Este login já está em uso."));
        }

        Rca rca = null;
        if (request.role() == Role.ROLE_RCA) {
            if (request.codigoRca() == null || request.codigoRca().isBlank()
                    || request.nomeRca() == null || request.nomeRca().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Código e nome do RCA são obrigatórios."));
            }

            String codigo = request.codigoRca().trim();
            rca = rcaRepository.findByCodigo(codigo)
                    .orElseGet(() -> rcaRepository.save(
                            Rca.builder()
                                    .codigo(codigo)
                                    .nome(request.nomeRca().trim())
                                    .telefone(request.telefoneRca())
                                    .metaMensal(request.metaMensal())
                                    .build()
                    ));
        }

        Usuario usuario = Usuario.builder()
                .login(request.login().trim())
                .senha(passwordEncoder.encode(request.senha()))
                .role(request.role())
                .rca(rca)
                .build();

        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Usuário cadastrado com sucesso!"));
    }
}
