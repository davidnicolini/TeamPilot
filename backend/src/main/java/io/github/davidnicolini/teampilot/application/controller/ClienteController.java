package io.github.davidnicolini.teampilot.application.controller;


import io.github.davidnicolini.teampilot.domain.model.Cliente;
import io.github.davidnicolini.teampilot.exception.ResourceNotFoundException;
import io.github.davidnicolini.teampilot.infrastructure.repository.ClienteRepository;
import io.github.davidnicolini.teampilot.infrastructure.repository.RcaRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteRepository clienteRepository;
    private final RcaRepository rcaRepository;

    public record ClienteRequest(@NotBlank String cnpjCpf, @NotBlank String razaoSocial,
                                  String telefone, @NotNull Long rcaId) {
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Cliente criar(@org.springframework.web.bind.annotation.RequestBody ClienteRequest request) {
        var rca = rcaRepository.findById(request.rcaId())
                .orElseThrow(() -> new ResourceNotFoundException("RCA nao encontrado: " + request.rcaId()));

        Cliente cliente = Cliente.builder()
                .cnpjCpf(request.cnpjCpf())
                .razaoSocial(request.razaoSocial())
                .telefone(request.telefone())
                .rca(rca)
                .build();

        return clienteRepository.save(cliente);
    }

    @GetMapping
    public List<Cliente> listar() {
        return clienteRepository.findAll();
    }
}

