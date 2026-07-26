# ✨ TeamPilot

**Manage teams. Track budgets. Deliver results.**

[![Build Status](https://img.shields.io/badge/Maven-CI-green/badge.svg)](https://github.com/davidnicolini/TeamPilot/actions)
[![Java Version](https://img.shields.io/badge/Java-25-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.7-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![License](https://img.shields.io/badge/Apache_2.0-LICENSE-orange.svg)](https://github.com/davidnicolini/TeamPilot/blob/main/LICENSE)

A modern, robust RESTful API built with **Java 25** and **Spring Boot 4** designed to centralize the management of quotes, sales targets, and client portfolios for teams of Independent Commercial Representatives (RCAs) — replacing fragmented, manual Excel spreadsheets with a reliable enterprise web platform.


---

## 📋 Table of Contents

- [Overview & Motivation](#-overview--motivation)
- [Key Features & Business Rules](#-key-features--business-rules)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Package Structure](#-package-structure)
- [Running locally](#-running-locally)
- [Running Tests](#-running-tests)
- [API Documentation & Swagger](#-api-documentation--swagger)
- [Continuous Integration (CI/CD)](#-continuous-integration-cicd)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 💡 Overview & Motivation

In early 2025, during a career transition, I worked as a sales estimator at Grupo Mundial in a department operating without CRM software — leaving sales reps with no structured way to track quotes or identify key opportunities. During that period, I observed three different managers independently building custom Excel spreadsheets to solve the exact same pain points: tracking budgets, analyzing lost sales reasons, and negotiating backed by real data.

I refined my own version of that spreadsheet and studied how other sales representatives organized their pipeline in the field.

**TeamPilot** is the next step in that evolution: transforming fragmented, manual tracking — which already covers loss reasons, direct competitors, active prospecting, and regional minimum freight rules — into a scalable, resilient web system featuring robust concurrency handling, relational database persistence, and fine-grained Role-Based Access Control (RBAC) between sales reps and supervisors.

---

## ✨ Key Features & Business Rules

### 🎯 Implemented Domain Rules
- 🔄 **Quote Lifecycle Management:**
  - State Machine: `IN_NEGOTIATION` → `WON` or `LOST`.
  - Encapsulated Domain Validation: A quote can only transition to `LOST` if a specific reason (e.g., price, lead time, competition, out of stock, other) is provided — enforced directly within the `Orcamento` domain entity.
- 🔍 **Competitor Loss Mapping:**
  - When a loss is attributed to price or competition, the system records the exact competitor who won the deal (e.g., Condor, Objetiva, Opção Atacadista).
- 📊 **Dynamic Sales Target Calculation:**
  - Target achievement percentage is computed dynamically by summing all `WON` quotes for an RCA in a given reference month divided by their assigned target.
- 🛡️ **Role-Based Access Control (RBAC):**
  - `ROLE_RCA`: Isolated access restricted exclusively to their own quotes and clients.
  - `ROLE_SUPERVISOR`: Unrestricted access to all team records, analytical endpoints, and performance reports.
- 📈 **Analytical Reports:**
  - Conversion rates (`WON` vs. `LOST`) per representative over custom timeframes.
  - Average ticket size grouped by product line.

---

## 🛠️ Tech Stack

- **Language:** Java 25
- **Core Framework:** Spring Boot 4.0.7
  - Spring Web (RESTful APIs)
  - Spring Data JPA (Hibernate ORM)
  - Spring Security + Stateless JWT Authentication
  - Spring Boot Docker Compose Integration
- **Database:**
  - PostgreSQL (managed via Docker Compose, auto-started by Spring Boot during development)
  - H2 Database (In-memory database for isolated automated testing)
- **API Documentation:** springdoc-openapi (Swagger UI at `/swagger-ui.html`)
- **Productivity & Validation:** Lombok, Jakarta Bean Validation
- **Testing:** JUnit 5, Mockito, AssertJ
- **Build Tool:** Apache Maven
- **CI/CD:** GitHub Actions

---

## 🔧 Prerequisites

Ensure you have the following installed in your local environment before getting started:

  -  **JDK 25** installed and configured in your environment (JAVA_HOME).

  - **Docker & Docker Compose** running (for automatic PostgreSQL container orchestration).

  - **Git** for version control.

---

## 📁 Package Structure

The application follows a clean, domain-driven package organization ensuring high cohesion and loose coupling:

```text
io.github.davidnicolini.teampilot
├── domain.
    ├── model   → Rca, Cliente, Orcamento, LinhaProduto, Usuario (JPA Entities)
    └── dto.    → Data Transfer Objects isolating domain entities
        ├── request   → Request Data Transfer Objects 
        └── response  → Response Data Transfer Objects 
├── infrastructure.
    ├── repository    → Spring Data JPA Interfaces + Custom JPQL Report Queries
    ├── service       → Core Business Logic (Target Calculations, Status Transitions, Access Control)
    └── security      → JWT Utility, UserDetailsService, SecurityFilterChain Configuration
├──application.
    └── controller  → REST Controllers & API Endpoints

└── exception   → Custom Domain Exceptions + Global Exception Handler (@ControllerAdvice)
```

---

## 📋 Running locally

Requirements: Java 25, Docker (for the local PostgreSQL container).

1. Start the app:
   ```bash
   ./mvnw spring-boot:run
   ```
   Spring Boot automatically starts the PostgreSQL container defined in `compose.yaml`
   (database `teampilot`, matching `application.yml`) — no manual setup needed.
2. Optionally set `JWT_SECRET` as an environment variable (a dev default is used
   otherwise).
3. Swagger UI: http://localhost:8080/swagger-ui.html

On first run, `DevDataSeeder` creates test users (local/dev only):

| Login | Password | Role |
|---|---|---|
| `supervisor` | `123456` | `ROLE_SUPERVISOR` |
| `joao.rca` | `123456` | `ROLE_RCA` |

`POST /api/auth/login` returns a JWT — send it as `Authorization: Bearer <token>` on
subsequent requests.

---

## 📖 API Documentation & Swagger

Once the application is running, interact with the live API documentation via Swagger UI:

 -  Swagger UI: http://localhost:8080/swagger-ui.html

 -  OpenAPI Spec: http://localhost:8080/v3/api-docs

---

## 🔄 Continuous Integration (CI/CD)

The repository uses GitHub Actions for automated build and test pipelines. On every push or pull_request to main:

  - The Java 25 JDK environment is set up.

  - The project build is executed (mvn clean install).

  - All automated unit and integration tests are verified.

---

## 📋 Running tests

```bash
./mvnw test
```

---

## 📋 Roadmap

Mapped from the spreadsheet controls I actually use in the field, not yet implemented:

- **Active prospecting:** potential clients by CNPJ, last purchase date, assigned rep.
- **Brand cross-reference:** equivalence table between own brand and competitors to handle
  objections when a client asks for a specific brand.
- **Minimum freight load rule:** minimum order value by region and delivery weekday.
- **Legacy data import:** file upload endpoint with Spring Batch + Apache POI to
  migrate the existing spreadsheets.
- **BI integration:** analytics endpoints for Power BI or a custom dashboard.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to report bugs, request features, or submit pull requests:

 1  - Fork the repository.

 2  - Create a feature Branch. ``` git checkout -b feature/AmazingFeature ```

 3  - Commit your changes. ``` git commit -m 'feat: Add AmazingFeature' ```

 4  - Push to the branch. ``` git push origin feature/AmazingFeature ```

 5  - Open a Pull Request.

---

## 📄 License

This project is licensed under the Apache 2.0 - see the LICENSE file for details.

---

## 🧑‍💻 Author

Developed by David Nicolini

Systems Analyst & Java Specialist

-   GitHub: [@davidnicolini](https://github.com/davidnicolini)
    
-    LinkedIn: [David Nicolini](https://linkedin.com/in/davidnicolini)

---    
