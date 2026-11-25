package io.github.davidnicolini.teampilot.application.controller;


import io.github.davidnicolini.teampilot.domain.model.Rca;
import io.github.davidnicolini.teampilot.domain.dto.response.MetaResponse;
import io.github.davidnicolini.teampilot.infrastructure.repository.RcaRepository;
import io.github.davidnicolini.teampilot.infrastructure.service.MetaService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/rcas")
@RequiredArgsConstructor
public class RcaController {

    private final RcaRepository rcaRepository;
    private final MetaService metaService;

    public record RcaRequest(@NotBlank String codigo, @NotBlank String nome,
                              String telefone, BigDecimal metaMensal) {
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Rca criar(@org.springframework.web.bind.annotation.RequestBody RcaRequest request) {
        Rca rca = Rca.builder()
                .codigo(request.codigo())
                .nome(request.nome())
                .telefone(request.telefone())
                .metaMensal(request.metaMensal())
                .build();
        return rcaRepository.save(rca);
    }

    @GetMapping
    public List<Rca> listar() {
        return rcaRepository.findAll();
    }

    @GetMapping("/{id}/meta")
    public MetaResponse consultarMeta(@PathVariable Long id,
                                       @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth mes) {
        return metaService.calcularPercentualMeta(id, mes);
    }
}

