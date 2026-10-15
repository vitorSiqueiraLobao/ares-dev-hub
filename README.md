# ARES Dev HUD // Multi-Agent Dev Mesh & IRIS Automation

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Theme: Cyber-Red](https://img.shields.io/badge/Theme-Cyber--Red-00f0ff.svg)](https://github.com/vitorSiqueiraLobao/dotfiles)
[![Stack: Full--Stack%20TypeScript](https://img.shields.io/badge/Stack-Full--Stack%20TypeScript-ff003c.svg)]()

> Painel de comando e orquestrador de desenvolvimento local para agentes de IA (Claude, Gemini), automação de terminal Telnet para **InterSystems IRIS 2022**, guardião de banco de dados SQL Read-Only, runner Newman e monitor de cotas, com estética **Cyber-Red (ARES)**.

---

## Destaques & Funcionalidades

- **Zero Abstrações de Código**: Os agentes geram arquivos fonte reais e nativos (`queries/*.sql` e `src/*.cls`). Nenhum ORM intermediário ou dialeto proprietário.
- **SQL Read-Only Guard**: Analisador léxico/AST (`node-sql-parser`) que inspeciona consultas antes da execução. Bloqueia sumariamente qualquer tentativa de `INSERT`, `UPDATE`, `DELETE`, `DROP` ou injeções encadeadas, com seletor manual de limite de linhas (incluindo modo irrestrito/sem limite).
- **InterSystems IRIS Automation (Porta 23)**: Conector de terminal Telnet assíncrono para IRIS 2022. Permite executar comandos ObjectScript e compilar classes diretamente via `$system.OBJ.Load(file, "ck /overwrite")`, forçando a sobrescrita sem prompts manuais de interface gráfica.
- **Terminal Virtual Interativo (PTY)**: Engine `node-pty` e `@xterm/xterm` integrada via WebSockets, permitindo rodar shells reais e agentes de linha de comando (`claude`, `antigravity-cli`, `zsh`) direto no HUD.
- **Newman Test Runner**: Execução programática de coleções Postman com extração de asserções e falhas estruturadas em JSON.
- **DAG Mesh Canvas**: Interface gráfica interativa baseada em `@xyflow/react` para definir canais de entrada e saída (I/O) entre agentes e ferramentas.
- **Human Approval Gate**: Ponto de parada interativo (*Breach Protocol*) para você validar e autorizar consultas ou compilações antes do próximo disparo.
- **Telemetria de Cotas & Contexto**: Medidores ASCII e barras de progresso monitorando a ocupação da janela de contexto de modelos como Claude Sonnet e Gemini Flash.
- **Estética Cyber-Red**: Inspirada no ambiente Arch Linux + Hyprland (vermelho estrutura `#FF003C`, ciano dados `#00F0FF`, cantos chanfrados `.ares-cut` e tipografia monospace).

---

## Arquitetura

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [ARES // DEV MESH HUD]                            [CLAUDE: 18% CTX] [GEMINI: 4% CTX]   │
├───────────────┬────────────────────────────────────────────┬───────────────────────────┤
│ GIT & FILES   │ NODE GRAPH (DAG MESH)                      │ TELEMETRY CONTROLLER      │
│ ├─ queries/   │  [Claude Sonnet]                           │  Claude: 18k / 200k ctx   │
│ │  └─ sample  │        │ (sql/cls)                         │  Gemini: 42k / 1M ctx     │
│ ├─ src/       │        ▼                                   ├───────────────────────────┤
│ │  └─ Service │  [SQL Guard (Read-Only)]                   │ HUMAN APPROVAL GATE       │
│ └─ tests/     │        │ (safe query)                      │ [!] Query pending review  │
│               │        ▼                                   │ [ APPROVE ]   [ REJECT ]  │
│ [GIT TREE]    │  [Human Gate] ──► [IRIS Deployer :23]      │                           │
├───────────────┴────────────────────────────────────────────┴───────────────────────────┤
│ TERMINAL DECK: INTERACTIVE PTY / XTERM.JS / WEBSOCKET STREAM                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológica

| Camada | Tecnologia | Propósito |
|---|---|---|
| **Backend API** | Node.js + Fastify 5 | API REST rápida e servidor estático do SPA |
| **WebSockets** | `@fastify/websocket` + `ws` | Streaming bidirecional do PTY e eventos de pipeline |
| **Terminais** | `node-pty` + `@xterm/xterm` | Pseudoterminais virtuais reais (engine do VS Code) |
| **IRIS Telnet** | `telnet-client` | Automação e compilação de código ObjectScript (:23) |
| **SQL Parser** | `node-sql-parser` | Auditoria AST para bloqueio de comandos destrutivos |
| **Postman** | `newman` | Execução programática de testes em memória |
| **Grafo de Nós** | `@xyflow/react` | Canvas de conexões de I/O e orquestração DAG |
| **Frontend** | React 19 + Vite 6 + Tailwind CSS 4 | Interface reativa, modular e de alta densidade |
| **Editor** | `@monaco-editor/react` | Editor Monaco embutido com diff viewer do Git |

---

## Instalação e Execução

### Pré-requisitos
- Node.js ≥ 20
- npm ≥ 10

### 1. Clonar o Repositório
```bash
git clone git@github.com:vitorSiqueiraLobao/ares-dev-hub.git
cd ares-dev-hub
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o template de ambiente:
```bash
cp .env.example .env
```
Ajuste os parâmetros conforme seu ambiente local (host do IRIS, porta, usuário e namespace).

### 4. Executar
```bash
npm run dev
```

Abra o seu navegador em:
👉 **`http://localhost:3000`** (Vite Dev Server) ou **`http://localhost:3001`** (Fastify Server)

---

## Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.
