package io.github.davidnicolini.teampilot.application.controller;


import io.github.davidnicolini.teampilot.infrastructure.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService relatorioService;

    @GetMapping("/taxa-conversao")
    public List<Map<String, Object>> taxaConversaoPorRca(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return relatorioService.taxaConversaoPorRca(inicio, fim);
    }

    @GetMapping("/ticket-medio-por-linha")
    public List<Map<String, Object>> ticketMedioPorLinhaProduto() {
        return relatorioService.ticketMedioPorLinhaProduto();
    }
}

