package io.github.davidnicolini.teampilot.application.controller;


import io.github.davidnicolini.teampilot.domain.model.MotivoPerda;
import io.github.davidnicolini.teampilot.domain.dto.request.OrcamentoRequest;
import io.github.davidnicolini.teampilot.domain.dto.response.OrcamentoResponse;
import io.github.davidnicolini.teampilot.infrastructure.service.OrcamentoService;
import io.github.davidnicolini.teampilot.infrastructure.service.PlanilhaImportService;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orcamentos")
@RequiredArgsConstructor
public class OrcamentoController {

    private final OrcamentoService orcamentoService;
    private final PlanilhaImportService planilhaImportService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrcamentoResponse criar(@Valid @RequestBody OrcamentoRequest request) {
        return orcamentoService.criar(request);
    }

    @GetMapping
    public List<OrcamentoResponse> listar() {
        return orcamentoService.listar();
    }

    @GetMapping("/{id}")
    public OrcamentoResponse buscarPorId(@PathVariable Long id) {
        return orcamentoService.buscarPorId(id);
    }

    @PatchMapping("/{id}/fechar")
    public OrcamentoResponse fechar(@PathVariable Long id) {
        return orcamentoService.fechar(id);
    }

    @PatchMapping("/{id}/perder")
    public OrcamentoResponse marcarComoPerdido(@PathVariable Long id,
                                                @RequestParam MotivoPerda motivo,
                                                @RequestParam(required = false) String concorrente) {
        return orcamentoService.marcarComoPerdido(id, motivo, concorrente);
    }

    @PostMapping("/importar")
    public Object importarPlanilha(@RequestParam("file") MultipartFile file) throws Exception {
        return planilhaImportService.importar(file);
    }
}
