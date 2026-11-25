package io.github.davidnicolini.teampilot.infrastructure.service;

import io.github.davidnicolini.teampilot.domain.model.*;
import io.github.davidnicolini.teampilot.domain.dto.request.OrcamentoRequest;
import io.github.davidnicolini.teampilot.domain.dto.response.OrcamentoResponse;
import io.github.davidnicolini.teampilot.exception.AcessoNegadoException;
import io.github.davidnicolini.teampilot.exception.ResourceNotFoundException;
import io.github.davidnicolini.teampilot.infrastructure.repository.ClienteRepository;
import io.github.davidnicolini.teampilot.infrastructure.repository.LinhaProdutoRepository;
import io.github.davidnicolini.teampilot.infrastructure.repository.OrcamentoRepository;
import io.github.davidnicolini.teampilot.infrastructure.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrcamentoService {

    private final OrcamentoRepository orcamentoRepository;
    private final ClienteRepository clienteRepository;
    private final LinhaProdutoRepository linhaProdutoRepository;
    private final UsuarioRepository usuarioRepository;

    public OrcamentoResponse criar(OrcamentoRequest request) {
        Usuario usuarioLogado = usuarioLogado();
        Rca rca = rcaDoUsuarioOuErro(usuarioLogado);

        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nao encontrado: " + request.clienteId()));

        LinhaProduto linhaProduto = request.linhaProdutoId() != null
                ? linhaProdutoRepository.findById(request.linhaProdutoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Linha de produto nao encontrada: " + request.linhaProdutoId()))
                : null;

        Orcamento orcamento = Orcamento.builder()
                .numeroPedido(request.numeroPedido())
                .valorTotal(request.valorTotal())
                .margemLucro(request.margemLucro())
                .status(StatusOrcamento.EM_NEGOCIACAO)
                .dataOrcamento(request.dataOrcamento())
                .vendaCasada(request.vendaCasada())
                .rca(rca)
                .cliente(cliente)
                .linhaProduto(linhaProduto)
                .build();

        return OrcamentoResponse.fromEntity(orcamentoRepository.save(orcamento));
    }

    public List<OrcamentoResponse> listar() {
        Usuario usuarioLogado = usuarioLogado();

        List<Orcamento> orcamentos = usuarioLogado.getRole() == Role.ROLE_SUPERVISOR
                ? orcamentoRepository.findAll()
                : orcamentoRepository.findByRcaId(rcaDoUsuarioOuErro(usuarioLogado).getId());

        return orcamentos.stream().map(OrcamentoResponse::fromEntity).toList();
    }

    public OrcamentoResponse buscarPorId(Long id) {
        Orcamento orcamento = buscarOrcamentoOuErro(id);
        validarAcesso(orcamento);
        return OrcamentoResponse.fromEntity(orcamento);
    }

    public OrcamentoResponse fechar(Long id) {
        Orcamento orcamento = buscarOrcamentoOuErro(id);
        validarAcesso(orcamento);
        orcamento.marcarComoFechado();
        return OrcamentoResponse.fromEntity(orcamentoRepository.save(orcamento));
    }

    public OrcamentoResponse marcarComoPerdido(Long id, MotivoPerda motivo, String concorrente) {
        Orcamento orcamento = buscarOrcamentoOuErro(id);
        validarAcesso(orcamento);
        orcamento.marcarComoPerdido(motivo, concorrente);
        return OrcamentoResponse.fromEntity(orcamentoRepository.save(orcamento));
    }

    // --- Controle de acesso: RCA so enxerga/edita os proprios orcamentos ---

    private void validarAcesso(Orcamento orcamento) {
        Usuario usuarioLogado = usuarioLogado();

        if (usuarioLogado.getRole() == Role.ROLE_SUPERVISOR) {
            return; // supervisor tem acesso irrestrito de leitura/gestao
        }

        Rca rcaDoUsuario = rcaDoUsuarioOuErro(usuarioLogado);
        if (!orcamento.getRca().getId().equals(rcaDoUsuario.getId())) {
            throw new AcessoNegadoException("Voce nao tem permissao para acessar este orcamento.");
        }
    }

    private Rca rcaDoUsuarioOuErro(Usuario usuario) {
        if (usuario.getRca() == null) {
            throw new AcessoNegadoException("Usuario nao esta vinculado a nenhum RCA.");
        }
        return usuario.getRca();
    }

    private Orcamento buscarOrcamentoOuErro(Long id) {
        return orcamentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orcamento nao encontrado: " + id));
    }

    private Usuario usuarioLogado() {
        String login = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario logado nao encontrado: " + login));
    }
}

