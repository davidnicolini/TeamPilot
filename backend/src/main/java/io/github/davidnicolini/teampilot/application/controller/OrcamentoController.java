package io.github.davidnicolini.teampilot.application.controller;

import io.github.davidnicolini.teampilot.domain.dto.request.OrcamentoRequest;
import io.github.davidnicolini.teampilot.domain.dto.response.OrcamentoResponse;
import io.github.davidnicolini.teampilot.domain.model.MotivoPerda;
import io.github.davidnicolini.teampilot.infrastructure.service.OrcamentoService;
import io.github.davidnicolini.teampilot.infrastructure.service.PlanilhaImportService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/orcamentos")
@RequiredArgsConstructor
public class OrcamentoController {

    private final OrcamentoService orcamentoService;
    private final PlanilhaImportService planilhaImportService;

    @PostMapping
    public ResponseEntity<OrcamentoResponse> create(@RequestBody @Valid OrcamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orcamentoService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<OrcamentoResponse>> list(Authentication authentication) {
        return ResponseEntity.ok(orcamentoService.listByAuthenticatedUser(authentication));
    }

    @PatchMapping("/{id}/fechar")
    public ResponseEntity<OrcamentoResponse> closeQuote(@PathVariable Long id) {
        return ResponseEntity.ok(orcamentoService.closeQuote(id));
    }

    @PatchMapping("/{id}/perder")
    public ResponseEntity<OrcamentoResponse> markAsLost(
            @PathVariable Long id,
            @RequestParam MotivoPerda motivo,
            @RequestParam(required = false) String concorrente
    ) {
        return ResponseEntity.ok(orcamentoService.markAsLost(id, motivo, concorrente));
    }

    @PostMapping("/importar")
    public ResponseEntity> importarPlanilha(@RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(planilhaImportService.importar(file));
    }
}
