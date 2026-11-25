# TeamPilot

Sistema web full-stack para gestão de orçamentos comerciais, acompanhamento de metas e análise de perdas para equipes de Representantes Comerciais Autônomos (RCAs).

[![CI](https://github.com/davidnicolini/TeamPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/davidnicolini/TeamPilot/actions)
[![Java](https://img.shields.io/badge/Java-25-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## Contexto e Problema Resolvido

Durante minha atuação na área comercial como orçamentista, identifiquei um gargalo operacional comum em equipes de vendas externas sem CRM: três supervisores mantinham planilhas paralelas em Excel com colunas e critérios diferentes para tentar responder às mesmas perguntas:

- Qual o percentual real de atingimento da meta mensal por representante?
- Por que estamos perdendo cotações (preço, prazo, ruptura de estoque)?
- Para quais concorrentes específicos estamos perdendo vendas em cada região?

O **TeamPilot** substitui esse controle fragmentado por uma aplicação centralizada com persistência relacional, regras de domínio encapsuladas e isolamento de acesso entre vendedores (`ROLE_RCA`) e supervisão (`ROLE_SUPERVISOR`).

---

## Arquitetura e Decisões Técnicas

O repositório está estruturado como monorepo dividindo API e cliente web:

    TeamPilot/
    ├── backend/                  # API RESTful em Java 25 + Spring Boot 4
    │   └── src/main/java/io/github/davidnicolini/teampilot/
    │       ├── application/      # Controllers REST e contratos HTTP
    │       ├── domain/           # Entidades JPA, invariantes de negócio e DTOs (Records)
    │       ├── infrastructure/   # Services, Repositories (JPQL) e Spring Security (JWT)
    │       └── exception/        # Tratamento global de exceções (@RestControllerAdvice)
    └── frontend/                 # Aplicação SPA em Angular + TypeScript

### Destaques de Implementação

- **Encapsulamento no Domínio:** A transição de estado de um orçamento (`EM_NEGOCIACAO` -> `FECHADO` ou `PERDIDO`) é protegida na própria entidade `Orcamento`. Não é possível marcar uma cotação como perdida sem informar o `MotivoPerda`, garantindo consistência independentemente da origem da chamada.
- **Segurança em Duas Camadas (RBAC + Ownership):** Além da proteção de rotas via Spring Security com JWT *stateless*, a camada de serviço valida a propriedade do registro (`validarAcesso()`), impedindo que um `ROLE_RCA` consulte ou altere orçamentos de outro vendedor (retornando `HTTP 403`).
- **Precisão Financeira:** Cálculos de meta mensal e faturamento utilizam `BigDecimal` com `RoundingMode.HALF_UP`, tratando cenários de meta nula ou zerada sem risco de `ArithmeticException`.
- **Consultas Analíticas em JPQL:** Agregações de taxa de conversão por RCA e ticket médio por linha de produto executadas diretamente no banco via queries JPQL tipadas.

---

## Stack Tecnológica

**Backend**
- Java 25, Spring Boot 4.0.7
- Spring Security (JWT *stateless* + BCrypt)
- Spring Data JPA / Hibernate
- PostgreSQL 18 (Docker Compose) e H2 (testes automatizados)
- SpringDoc OpenAPI (Swagger UI)
- JUnit 5, Mockito e AssertJ

**Frontend**
- Angular (Standalone Components, Signals, Reactive Forms)
- TypeScript, RxJS, HttpClient Interceptors (injeção automática de JWT)

---

## Executando Localmente

### Pré-requisitos
- JDK 25
- Docker & Docker Compose
- Node.js 22+ e Angular CLI (para o frontend)

### 1. Subir o Backend e o Banco de Dados

O Spring Boot gerencia automaticamente o ciclo de vida do container PostgreSQL definido em `backend/compose.yaml`:

    cd backend
    ./mvnw spring-boot:run

A API estará disponível em `http://localhost:8080` e a documentação interativa em `http://localhost:8080/swagger-ui.html`.

#### Credenciais de Desenvolvimento (`DevDataSeeder`)

| Perfil | Login | Senha | Escopo de Acesso |
| :--- | :--- | :--- | :--- |
| Supervisor | `supervisor` | `123456` | Visão global de orçamentos, RCAs e relatórios |
| Vendedor (RCA) | `joao.rca` | `123456` | Apenas clientes e orçamentos da própria carteira |

### 2. Executar os Testes Automatizados

    cd backend
    ./mvnw test

### 3. Subir o Frontend Angular

    cd frontend
    npm install
    ng serve

Acesse `http://localhost:4200`.

---

## Próximas Evoluções

- [ ] **Prospecção Ativa:** Cadastro de leads por CNPJ com controle de última compra e carteira atribuída.
- [ ] **Tabela de Equivalência de Marcas:** De-para entre marcas próprias e concorrentes para apoio durante a negociação.
- [ ] **Regra de Frete Mínimo:** Validação automática de pedido mínimo por praça e dia de entrega.
- [ ] **Importação de Planilhas Legadas:** Processamento em lote via Spring Batch + Apache POI.

---

## Autor

**David Nicolini** — Desenvolvedor Backend Java & Arquitetura de Software  
[Portfolio](https://davidnicolini.com.br) · [LinkedIn](https://www.linkedin.com/in/davidnicolini) · [GitHub](https://github.com/davidnicolini)
