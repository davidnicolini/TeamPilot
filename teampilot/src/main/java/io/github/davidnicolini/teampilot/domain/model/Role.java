package io.github.davidnicolini.teampilot.domain.model;

/**
 * Papeis de acesso ao sistema.
 * RCA: enxerga e edita apenas os proprios orcamentos.
 * SUPERVISOR: enxerga o resumo geral e as metas de toda a equipe.
 */
public enum Role {
    ROLE_RCA,
    ROLE_SUPERVISOR
}
