# Contributing to QBiz Gateway

Thank you for your interest in contributing to QBiz! We welcome contributions from developers of all skill levels to help improve this self-hosted dynamic QRIS gateway hub.

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Table of Contents

1. [How Can I Contribute?](#how-can-i-contribute)
    - [Reporting Bugs](#reporting-bugs)
    - [Suggesting Enhancements](#suggesting-enhancements)
    - [Pull Requests](#pull-requests)
2. [Local Development Setup](#local-development-setup)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running the App](#running-the-app)
    - [Running Tests](#running-tests)
3. [Style Guide & Conventions](#style-guide--conventions)
    - [TypeScript & Formatting](#typescript--formatting)
    - [Database Migrations](#database-migrations)
    - [Git Commit Messages](#git-commit-messages)
4. [Contact Support](#contact-support)

---

## How Can I Contribute?

### Reporting Bugs

If you encounter a bug or unexpected behavior:
1. Search the existing issues to see if the bug has already been reported.
2. If it is a **security vulnerability**, please **do not** file a public GitHub issue. Instead, report it privately to **inisaya@ardianryan.com** following our [Security Policy](SECURITY.md).
3. Otherwise, open a new issue with a clear description, steps to reproduce, expected behavior, and screenshots if applicable.

### Suggesting Enhancements

We are always looking for ways to make QBiz better! If you have ideas for new features or improvements:
1. Check the open issues and discussions to see if the feature has been proposed.
2. Open a new issue or discussion explaining:
    - What problem this enhancement solves.
    - How you picture it working.
    - Any alternative solutions considered.

### Pull Requests

Ready to submit code changes?
1. Fork the repository and create your branch from `main` (e.g., `feature/your-feature-name` or `bugfix/issue-id`).
2. Implement your changes, ensuring code matches existing formatting and style guidelines.
3. Write/update unit tests under `src/` (e.g. `*.test.ts`) to cover your changes.
4. Run Deno tests (`deno task test`) locally to verify that everything works correctly.
5. Commit your changes using clear, detailed, and professional commit messages.
6. Push your branch to GitHub and open a Pull Request (PR) against the `main` branch.

---

## Local Development Setup

### Prerequisites

QBiz is built on top of the **Deno** runtime environment:
- Install Deno (version 1.40.0 or later recommended):
  ```bash
  # macOS / Linux
  curl -fsSL https://deno.land/x/install/install.sh | sh
  ```

### Installation

1. Clone your fork of the repository:
   ```bash
   git clone https://github.com/your-username/qbiz-qrisdinamis.git
   cd qbiz-qrisdinamis
   ```
2. Copy the example environment template and customize your secrets:
   ```bash
   cp .env.example .env # Set your local environment variables
   ```

### Running the App

Start the Hono development server with auto-reload:
```bash
deno task dev
```

The server will run on `http://localhost:8000`.

### Running Tests

Ensure all unit and integration tests pass before submitting your PR:
```bash
deno task test
```

---

## Style Guide & Conventions

- **Code Formatting**: QBiz uses standard TypeScript syntax. Please ensure code is clean, readable, and well-commented.
- **Drizzle ORM**: Database interactions must go through the Drizzle schema files located under `db/schema.ts`.
- **API Spec**: If your changes add or modify API routes, ensure you update the OpenAPI specification file at `static/openapi.json` to keep the interactive Scalar documentation `/docs` in sync.
- **Commit Format**: We prefer professional, descriptive commit messages describing the *why* and *what* of the change (e.g., `feat: implement AES-256-GCM session storage` or `fix: resolve responsive scaling for QRIS SVG container`).

---

## Contact Support

If you have any questions, need assistance with your local environment setup, or want to discuss integration workflows, please reach out to the project maintainer at **inisaya@ardianryan.com**.
