package io.github.davidnicolini.teampilot.infrastructure.service;

import io.github.davidnicolini.teampilot.domain.model.*;
import io.github.davidnicolini.teampilot.infrastructure.repository.*;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PlanilhaImportService {

    private final RcaRepository rcaRepository;
    private final ClienteRepository clienteRepository;
    private final OrcamentoRepository orcamentoRepository;

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional
    public Map<String, Object> importar(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        List<List<String>> rows = filename.endsWith(".xlsx") || filename.endsWith(".xls")
                ? parseExcel(file)
                : parseCsv(file);

        int headerIdx = -1;
        for (int i = 0; i < Math.min(rows.size(), 10); i++) {
            String joined = String.join(" ", rows.get(i)).toUpperCase();
            if (joined.contains("RAZÃO SOCIAL") || joined.contains("RAZAO SOCIAL") || joined.contains("VALOR")) {
                headerIdx = i;
                break;
            }
        }

        if (headerIdx == -1) {
            throw new IllegalArgumentException("Cabeçalho padrão da planilha de orçamentos não encontrado.");
        }

        int importados = 0;
        int ignorados = 0;

        for (int i = headerIdx + 1; i < rows.size(); i++) {
            List<String> cols = rows.get(i);
            if (cols.size() < 14) {
                ignorados++;
                continue;
            }

            String dataStr = getCol(cols, 2);
            String codCliente = getCol(cols, 3);
            String razaoSocial = getCol(cols, 4);
            String telefone = getCol(cols, 5);
            String codRca = getCol(cols, 6);
            String nomeRca = getCol(cols, 7);
            String valorStr = getCol(cols, 13);
            String lucroStr = getCol(cols, 14);
            String pedidoGerado = getCol(cols, 15);
            String nfCupom = getCol(cols, 16);
            String statusStr = getCol(cols, 17);
            String motivoStr = getCol(cols, 18);
            String concorrenteStr = getCol(cols, 19);

            if (razaoSocial.isBlank() || valorStr.isBlank() || dataStr.isBlank()) {
                ignorados++;
                continue;
            }

            LocalDate dataOrcamento;
            try {
                dataOrcamento = LocalDate.parse(dataStr.trim(), BR_DATE);
            } catch (Exception e) {
                ignorados++;
                continue;
            }

            BigDecimal valorTotal = parseMoney(valorStr);
            if (valorTotal.compareTo(BigDecimal.ZERO) <= 0) {
                ignorados++;
                continue;
            }

            String rcaCode = codRca.isBlank() ? "0000" : codRca.trim();
            Rca rca = rcaRepository.findByCodigo(rcaCode).orElseGet(() -> {
                Rca novo = new Rca();
                novo.setCodigo(rcaCode);
                novo.setNome(nomeRca.isBlank() ? "RCA " + rcaCode : nomeRca.trim());
                novo.setMetaMensal(new BigDecimal("250000.00"));
                return rcaRepository.save(novo);
            });

            String docCliente = codCliente.isBlank() ? "CLI-" + Math.abs(razaoSocial.hashCode()) : codCliente.trim();
            Cliente cliente = clienteRepository.findByCnpjCpf(docCliente).orElseGet(() -> {
                Cliente novo = new Cliente();
                novo.setCnpjCpf(docCliente);
                novo.setRazaoSocial(razaoSocial.trim());
                novo.setTelefone(telefone.trim());
                novo.setRca(rca);
                return clienteRepository.save(novo);
            });

            Orcamento orc = new Orcamento();
            orc.setDataOrcamento(dataOrcamento);
            orc.setCliente(cliente);
            orc.setRca(rca);
            orc.setValorTotal(valorTotal);
            orc.setMargemLucro(parsePercent(lucroStr));
            orc.setNumeroPedido(pedidoGerado.isBlank() ? getCol(cols, 0) : pedidoGerado.trim());
            orc.setNumeroNf(nfCupom.isBlank() ? null : nfCupom.trim());
            orc.setVendaCasada(false);

            StatusOrcamento status = parseStatus(statusStr, pedidoGerado);
            orc.setStatus(status);
            if (status == StatusOrcamento.PERDIDO) {
                orc.setMotivoPerda(parseMotivo(motivoStr));
                orc.setConcorrente(concorrenteStr.isBlank() ? null : concorrenteStr.trim());
            }

            orcamentoRepository.save(orc);
            importados++;
        }

        return Map.of(
                "importados", importados,
                "ignorados", ignorados,
                "mensagem", importados + " orçamentos importados com sucesso."
        );
    }

    private List<List<String>> parseCsv(MultipartFile file) throws Exception {
        List<List<String>> result = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                result.add(splitCsvLine(line));
            }
        }
        return result;
    }

    private List<String> splitCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString());
        return tokens;
    }

    private List<List<String>> parseExcel(MultipartFile file) throws Exception {
        List<List<String>> result = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (Row row : sheet) {
                List<String> cols = new ArrayList<>();
                int lastCol = Math.max(row.getLastCellNum(), 20);
                for (int c = 0; c < lastCol; c++) {
                    Cell cell = row.getCell(c);
                    cols.add(cell == null ? "" : formatter.formatCellValue(cell));
                }
                result.add(cols);
            }
        }
        return result;
    }

    private String getCol(List<String> cols, int index) {
        return index < cols.size() && cols.get(index) != null ? cols.get(index).trim() : "";
    }

    private BigDecimal parseMoney(String raw) {
        try {
            String cleaned = raw.replace("$", "").replace("R$", "").replace(",", "").trim();
            return new BigDecimal(cleaned);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal parsePercent(String raw) {
        try {
            String cleaned = raw.replace("%", "").replace(",", ".").trim();
            return cleaned.isBlank() ? BigDecimal.ZERO : new BigDecimal(cleaned);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private StatusOrcamento parseStatus(String status, String pedido) {
        String s = status.toUpperCase();
        if (s.contains("FECHAD") || s.contains("FATURAD") || s.contains("GANH") || !pedido.isBlank()) {
            return StatusOrcamento.FECHADO;
        }
        if (s.contains("PERDID") || s.contains("CANCEL")) {
            return StatusOrcamento.PERDIDO;
        }
        return StatusOrcamento.EM_NEGOCIACAO;
    }

    private MotivoPerda parseMotivo(String motivo) {
        String m = motivo.toUpperCase();
        if (m.contains("CONCORR")) return MotivoPerda.CONCORRENCIA;
        if (m.contains("PRAZO")) return MotivoPerda.PRAZO;
        if (m.contains("ESTOQUE")) return MotivoPerda.FALTA_DE_ESTOQUE;
        if (m.contains("PRECO") || m.contains("PREÇO")) return MotivoPerda.PRECO;
        return MotivoPerda.OUTRO;
    }
}
