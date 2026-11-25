package io.github.davidnicolini.teampilot.application.controller;

import io.github.davidnicolini.teampilot.domain.model.MotivoPerda;
import io.github.davidnicolini.teampilot.domain.dto.request.OrcamentoRequest;
import io.github.davidnicolini.teampilot.domain.dto.response.OrcamentoResponse;
import io.github.davidnicolini.teampilot.infrastructure.service.OrcamentoService;
import io.github.davidnicolini.teampilot.infrastructure.service.PlanilhaImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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

    @PatchMapping("/{id}/observacao")
    public OrcamentoResponse atualizarObservacao(@PathVariable Long id,
                                                 @RequestBody Map<String, String> payload) {
        return orcamentoService.atualizarObservacao(id, payload.get("observacao"));
    }

    @PostMapping("/importar")
    public Object importarPlanilha(@RequestParam("file") MultipartFile file) throws Exception {
        return planilhaImportService.importar(file);
    }

    @DeleteMapping("/limpar")
    public Object limparBase() {
        long removidos = orcamentoService.limparBase();
        return Map.of("mensagem", removidos + " orçamentos removidos da base.", "removidos", removidos);
    }
}
