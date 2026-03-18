<div align="center">

# ClawDeckX

**Complexity within, simplicity without.**<br>
**繁于内，简于形。**

[![Release](https://img.shields.io/github/v/release/ClawDeckX/ClawDeckX?style=for-the-badge&logo=rocket)](https://github.com/ClawDeckX/ClawDeckX/releases)
[![Build](https://img.shields.io/badge/Build-Passing-success?style=for-the-badge&logo=github-actions)](https://github.com/ClawDeckX/ClawDeckX/actions)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

**ClawDeckX** is an open-source web visual management platform built for [OpenClaw](https://github.com/openclaw/openclaw). It is designed to lower the barrier to entry, making installation, configuration, monitoring, and optimization simpler and more efficient, while providing a more accessible onboarding experience for users worldwide, especially beginners.

**ClawDeckX** 是专为 [OpenClaw](https://github.com/openclaw/openclaw) 打造的开源 Web 可视化管理平台，专注于降低使用门槛，让安装、配置、观测与优化更加简单高效，为全球用户，尤其是新手用户，提供更友好的上手体验。

</div>

> [!CAUTION]
> **Beta Preview** — This is an early preview release. It has not undergone comprehensive testing. **Do not use in production environments.**
>
> **Beta 预览版** — 当前为初始预览版本，尚未进行深度完整的覆盖测试，**请勿用于生产环境。**

<br>

## 📸 Screenshots | 界面预览

<div align="center">
  <img src="assets/screenshots/dashboard.png" width="800" alt="Dashboard Overview" />
  <p><sub>Dashboard Overview | 仪表盘总览</sub></p>
</div>

<br>

<div align="center">
  <img src="assets/screenshots/scenarios.png" width="390" alt="Scenario Templates" />
  &nbsp;
  <img src="assets/screenshots/multi-agent.png" width="390" alt="Multi-Agent Workflow" />
  <p><sub>Scenario Templates &amp; Multi-Agent Workflow | 场景模板列表 &amp; 多智能体工作流</sub></p>
</div>

<br>

<div align="center">
  <img src="assets/screenshots/config.png" width="390" alt="Configuration Center" />
  &nbsp;
  <img src="assets/screenshots/skills.png" width="390" alt="Skills Center" />
  <p><sub>Configuration Center &amp; Skills Center | 配置中心 &amp; 技能中心</sub></p>
</div>

<br>

## ✨ Why ClawDeckX?

### macOS-Grade Visual Experience | macOS 级视觉体验

The interface faithfully recreates the macOS design language — refined glassmorphism, rounded cards, and smooth animation transitions. Managing AI agents feels as natural as using a native desktop app.

界面高度还原 macOS 设计语言，采用精致的毛玻璃效果、圆角卡片和细腻的动画过渡，让管理 AI 智能体像操作原生桌面应用一样流畅自然。

### Beginner-Friendly Setup | 新用户极友好

Guided wizards and pre-built templates let you complete OpenClaw's initial configuration and model setup without memorizing a single command.

图形化引导和预设模板，让你无需记忆复杂命令，即可快速完成 OpenClaw 的初始配置与模型接入。

### Deep Configuration | 深度配置能力

Fine-tune every OpenClaw parameter — model switching, memory management, plugin loading, channel routing — all through a beautiful visual editor.

支持对 OpenClaw 底层参数进行精细调控，包括模型切换、记忆管理、插件加载、频道路由等，满足高级用户的定制化需求。

### Real-Time Observability | 全景观测系统

Built-in monitoring dashboard with live execution status, resource consumption, and task history — full visibility into every agent's behavior.

内置实时监控仪表盘，直观展示 AI 的执行状态、资源消耗和任务历史，让你对智能体的运行了如指掌。

### Cross-Platform | 全平台支持

Single binary, zero dependencies. Runs natively on Windows, macOS (Intel & Apple Silicon), and Linux (amd64 & arm64). Download and run — that's it.

单文件零依赖，原生支持 Windows、macOS（Intel 与 Apple Silicon）和 Linux（amd64 与 arm64）。下载即用，开箱即跑。

### Responsive & Mobile-Ready | 屏幕自适应与移动端适配

Fully responsive layout that adapts seamlessly from large desktop monitors to tablets and mobile phones. Manage your AI agents on the go — no compromise on functionality.

完整的响应式布局，从大屏桌面到平板和手机无缝适配。随时随地管理你的 AI 智能体，功能体验零妥协。

### Multilingual Support | 多语言支持

Full i18n architecture with 13 built-in languages. Adding a new language requires only a translated JSON folder and a two-line code change.

完整的国际化架构，内置 13 种语言支持。新增语言只需提供翻译的 JSON 文件夹，并修改两行代码即可完成接入。

### Local & Remote Gateway | 本地与远程网关

Seamlessly manage both local and remote OpenClaw gateways. Switch between gateway profiles with one click — perfect for multi-environment setups like dev, staging, and production.

同时支持本地网关与远程网关管理。一键切换网关配置档案，轻松应对开发、测试、生产等多环境部署场景。

## 🚀 Quick Start

### Deployment Options | 部署方案

Choose the deployment method that best fits your needs:

根据你的使用场景选择合适的部署方案：

#### 1️⃣ Local Deployment (Recommended) | 本地部署（推荐）

Install ClawDeckX on the same server as OpenClaw for full feature access and direct command execution.

在 OpenClaw 所在的服务器上安装 ClawDeckX，享受完整功能支持和直接命令执行能力。

**✅ Advantages | 优势：**
- Full feature support including direct OpenClaw command execution
- Lower latency and faster response times
- No network dependency between ClawDeckX and OpenClaw

**✅ 优势：**
- 完整功能支持，包括直接执行 OpenClaw 命令
- 更低延迟，响应更快
- ClawDeckX 与 OpenClaw 之间无网络依赖

#### 2️⃣ Remote Gateway | 远程网关

Install ClawDeckX on your local machine and connect to remote OpenClaw instances via WebSocket.

在本机安装 ClawDeckX，通过 WebSocket 连接远程 OpenClaw 实例。

**⚠️ Limitations | 限制：**
- Some features requiring direct OpenClaw command execution are unavailable
- Depends on stable network connection between ClawDeckX and OpenClaw Gateway
- Slightly higher latency for operations

**⚠️ 限制：**
- 部分需要直接调用 OpenClaw 命令的功能不可用
- 依赖 ClawDeckX 与 OpenClaw Gateway 之间的稳定网络连接
- 操作延迟略高

---

### One-Click Install & Maintain | 一键安装 卸载 维护

**macOS / Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/ClawDeckX/ClawDeckX/main/install.sh | bash
```

**Windows (PowerShell)**

```powershell
irm https://raw.githubusercontent.com/ClawDeckX/ClawDeckX/main/install.ps1 | iex
```

### Manual Download | 手动下载

Download the binary from [Releases](https://github.com/ClawDeckX/ClawDeckX/releases). No dependencies. Just run.

从 [Releases](https://github.com/ClawDeckX/ClawDeckX/releases) 下载二进制文件，零依赖，直接运行。

```bash
# Run with default settings / 使用默认配置启动 (localhost:18791)
./ClawDeckX

# Specify port and bind address / 指定端口和绑定地址
./ClawDeckX --port 18791 --bind 0.0.0.0

# Create initial admin user on first run / 首次运行时创建管理员账户
./ClawDeckX --user admin --pass your_password

# All options combined / 组合使用所有参数
./ClawDeckX --bind 0.0.0.0 --port 18791 --user admin --pass your_password
```

| Flag | Short | Description | 说明 |
| :--- | :---: | :--- | :--- |
| `--port` | `-p` | Server port (default: `18791`) | 服务端口（默认 `18791`） |
| `--bind` | `-b` | Bind address (default: `127.0.0.1`) | 绑定地址（默认 `127.0.0.1`） |
| `--user` | `-u` | Initial admin username (first run only) | 初始管理员用户名（仅首次） |
| `--pass` | | Initial admin password (min 6 chars) | 初始管理员密码（至少 6 位） |
| `--debug` | | Enable debug logging | 启用调试日志 |

### CLI Commands | 命令行工具

| Command | Usage | Description | 说明 |
| :--- | :--- | :--- | :--- |
| `reset-password` | `ClawDeckX reset-password <user> <pass>` | Reset a user's password | 重置用户密码 |
| `reset-username` | `ClawDeckX reset-username <old> <new>` | Change a user's username | 修改用户名 |
| `list-users` | `ClawDeckX list-users` | List all registered users | 列出所有已注册用户 |
| `unlock` | `ClawDeckX unlock <user>` | Unlock a locked user account | 解锁被锁定的用户账户 |

> [!TIP]
> **Forgot your credentials?** Run `ClawDeckX list-users` to find your username, then `ClawDeckX reset-password <username> <new_password>` to reset your password.
>
> **忘记登录凭据？** 运行 `ClawDeckX list-users` 查看用户名，然后 `ClawDeckX reset-password <用户名> <新密码>` 重置密码。

> [!IMPORTANT]
> **Security Reminder:** On first run, if no `--user` and `--pass` are provided, the auto-generated admin credentials will be printed to the console. Please change your username and password in the settings page immediately after logging in.
>
> **安全提示：** 首次运行时，若未指定 `--user` 和 `--pass`，系统会自动生成管理员账户，凭据将打印到控制台。请在登录后立即前往系统设置/账户安全页面修改用户名和密码。

<br>

### Docker Install | Docker 一键安装

```bash
# Download and start / 下载并启动
curl -fsSL https://raw.githubusercontent.com/ClawDeckX/ClawDeckX/main/docker-compose.yml -o docker-compose.yml
docker compose up -d
```

Open your browser at `http://localhost:18791`. The first run will auto-generate an admin account — credentials will be shown in the container logs.

浏览器打开 `http://localhost:18791`，首次启动会自动生成管理员账户，凭据将显示在容器日志中。

ClawDeckX and OpenClaw run in the same container. OpenClaw is **preinstalled** in the official Docker image with version-pinned compatibility. On startup, the container entrypoint auto-starts the OpenClaw Gateway if a configuration file exists. If OpenClaw is not yet configured, complete the Setup Wizard in the web UI — no manual installation is needed.

ClawDeckX 与 OpenClaw 运行在同一个容器中。官方 Docker 镜像已**预装 OpenClaw**，版本与兼容性已锁定。容器启动时，入口脚本会在配置文件存在时自动启动 OpenClaw Gateway。如果尚未配置，请在 Web 界面中完成安装向导即可，无需手动安装。

The official Docker image also preinstalls common skill/runtime dependencies including `go`, `python3`, `uv`, `ffmpeg`, `jq`, `ripgrep`, `wget`, and `make`, so many OpenClaw skills can run out of the box without extra system package installation.

官方 Docker 镜像还预装了常见技能/运行时依赖，包括 `go`、`python3`、`uv`、`ffmpeg`、`jq`、`ripgrep`、`wget` 与 `make`，因此许多 OpenClaw 技能在首次启动后即可直接使用，无需额外安装系统包。

By default, the bundled ClawDeckX service connects to the local in-container Gateway at `127.0.0.1:18789`. If you need to use a host or external Gateway instead, override `OCD_OPENCLAW_GATEWAY_HOST` and `OCD_OPENCLAW_GATEWAY_PORT` in `docker-compose.yml`.

默认情况下，镜像内的 ClawDeckX 服务会连接容器内本地 Gateway：`127.0.0.1:18789`。如果你需要改为连接宿主机或外部 Gateway，请在 `docker-compose.yml` 中覆盖 `OCD_OPENCLAW_GATEWAY_HOST` 与 `OCD_OPENCLAW_GATEWAY_PORT`。

```bash
# View credentials / 查看初始凭据
docker logs clawdeckx
```

#### Docker Configuration | Docker 配置说明

**Ports | 端口映射：**

| Port | Service | Description | 说明 |
| :--- | :--- | :--- | :--- |
| `18791` | ClawDeckX Web UI | Main dashboard (mapped by default) | 主界面（默认已映射） |
| `18789` | OpenClaw Gateway | Optional: expose for external debugging | 可选：映射后可从容器外调试 Gateway |

To expose the Gateway port, add `- "18789:18789"` under `ports` in `docker-compose.yml`.

如需从容器外访问 Gateway，在 `docker-compose.yml` 的 `ports` 中添加 `- "18789:18789"`。

**Environment Variables | 环境变量：**

| Variable | Default | Description | 说明 |
| :--- | :--- | :--- | :--- |
| `OPENCLAW_HOME` | `/data/openclaw/home` | OpenClaw home root override | OpenClaw home 根目录覆盖 |
| `OPENCLAW_STATE_DIR` | `/data/openclaw/state` | OpenClaw state directory | OpenClaw 状态目录 |
| `OPENCLAW_CONFIG_PATH` | `/data/openclaw/state/openclaw.json` | OpenClaw config file path | OpenClaw 配置文件路径 |
| `NPM_CONFIG_PREFIX` | `/data/openclaw/npm` | Persistent npm prefix for user-installed upgrades | 持久化 npm 前缀（用于用户自行升级安装） |
| `OCD_DB_SQLITE_PATH` | `/data/clawdeckx/ClawDeckX.db` | ClawDeckX SQLite database path | ClawDeckX SQLite 数据库路径 |
| `OCD_LOG_FILE` | `/data/clawdeckx/ClawDeckX.log` | ClawDeckX server log path | ClawDeckX 服务日志路径 |
| `OCD_GATEWAY_LOG` | `/data/openclaw/logs/gateway.log` | Persistent OpenClaw Gateway log | 持久化 OpenClaw Gateway 日志 |
| `OCD_SETUP_INSTALL_LOG` | `/data/openclaw/logs/install.log` | Setup/install log path | 安装向导日志路径 |
| `OCD_SETUP_DOCTOR_LOG` | `/data/openclaw/logs/doctor.log` | Doctor/diagnostic log path | 诊断日志路径 |
| `OCD_OPENCLAW_GATEWAY_HOST` | `127.0.0.1` | Gateway host address | Gateway 地址 |
| `OCD_OPENCLAW_GATEWAY_PORT` | `18789` | Gateway port | Gateway 端口 |
| `OCD_OPENCLAW_GATEWAY_TOKEN` | *(empty)* | Gateway auth token | Gateway 认证令牌 |
| `OCD_PORT` | `18791` | ClawDeckX listen port | ClawDeckX 监听端口 |
| `OCD_BIND` | `0.0.0.0` | ClawDeckX bind address | ClawDeckX 绑定地址 |
| `TZ` | `UTC` | Container timezone (e.g. `Asia/Shanghai`) | 容器时区（如 `Asia/Shanghai`） |

**Preinstalled Runtime Tools | 预装运行时工具：**

- **`go`**
- **`python3`**
- **`uv`**
- **`ffmpeg`**
- **`jq`**
- **`ripgrep`**
- **`wget`**
- **`make`**

> [!NOTE]
> The Docker image is larger than a minimal runtime because it includes the full runtime toolchain for OpenClaw skills. This ensures many skills can run out of the box without requiring you to install system packages inside the container.
>
> Docker 镜像体积大于最小化运行时，因为它包含了 OpenClaw 技能的完整运行时工具链。这样可以确保许多技能开箱即用，无需在容器内额外安装系统包。

**Volumes | 数据卷：**

| Volume | Mount Point | Description | 说明 |
| :--- | :--- | :--- | :--- |
| `clawdeckx-data` | `/data/clawdeckx` | ClawDeckX database and app logs | ClawDeckX 数据库与应用日志 |
| `clawdeckx-openclaw-data` | `/data/openclaw` | OpenClaw config, state, logs, and user-installed upgrades | OpenClaw 配置、状态、日志与用户升级安装数据 |

> [!TIP]
> OpenClaw is bundled in the image and its configuration is persisted via Docker volumes. After `docker pull` and recreate, OpenClaw remains available and your configuration is preserved.
>
> OpenClaw 已内置在镜像中，配置通过 Docker 卷持久化。执行 `docker pull` 重建容器后，OpenClaw 仍然可用，配置也会保留。

**Persistent Paths | 持久化路径：**

| Path | Purpose | 说明 |
| :--- | :--- | :--- |
| `/data/openclaw/npm` | User-installed npm packages (upgrades) | 用户安装的 npm 包（升级用） |
| `/data/openclaw/state` | OpenClaw state directory | OpenClaw 状态目录 |
| `/data/openclaw/state/openclaw.json` | OpenClaw config file | OpenClaw 配置文件 |
| `/data/openclaw/logs/gateway.log` | Gateway startup/runtime log | Gateway 启动与运行日志 |
| `/data/openclaw/logs/install.log` | Setup/install log | 安装向导日志 |
| `/data/openclaw/logs/doctor.log` | Doctor/diagnostic log | 诊断日志 |
| `/data/openclaw/bootstrap/gateway-bootstrap.json` | Entrypoint bootstrap status | 入口脚本启动状态文件 |

OpenClaw is preinstalled in the Docker image. If it is not yet configured, ClawDeckX will guide you through the Setup Wizard to complete the initial configuration.

OpenClaw 已预装在 Docker 镜像中。如果尚未配置，ClawDeckX 会引导你通过安装向导完成初始配置。

The container health check uses `/api/v1/health` for liveness. For diagnostics, you can call `/api/v1/health?detailed=true` to inspect ClawDeckX, OpenClaw, Gateway, and bootstrap state together.

容器健康检查使用 `/api/v1/health` 作为存活探测。排障时可调用 `/api/v1/health?detailed=true`，同时查看 ClawDeckX、OpenClaw、Gateway 与启动状态文件的信息。

**Resource Limits | 资源限制：**

The default `docker-compose.yml` sets memory limit to 2 GB and CPU limit to 2 cores. Adjust `deploy.resources.limits` as needed.

默认 `docker-compose.yml` 限制内存 2 GB、CPU 2 核，可根据需要调整 `deploy.resources.limits`。

<br>

## ✨ Features

| | Feature | Description | 说明 |
| :---: | :--- | :--- | :--- |
| 💎 | **Pixel-Perfect UI** | Native macOS feel with glassmorphism, smooth animations, dark/light themes | macOS 级视觉体验，毛玻璃效果、流畅动画、明暗主题 |
| 🎛️ | **Gateway Control** | Start, stop, restart your Gateway instantly with real-time health monitoring | 一键启停网关，实时健康监控 |
| 🖼 | **Visual Config Editor** | Edit configurations and agent profiles without touching JSON/YAML | 可视化配置编辑器，告别手写 JSON/YAML |
| 🧙 | **Setup Wizard** | Step-by-step guided setup for first-time users | 新手引导向导，逐步完成配置 |
| 🧩 | **Template Center** | Deploy new agent personas in seconds with built-in templates | 模板中心，秒级部署新代理人设 |
| 📊 | **Live Dashboard** | Real-time metrics, session tracking, and activity monitoring | 实时仪表盘，会话追踪与活动监控 |
| 🛡️ | **Security Built-in** | JWT auth, HttpOnly cookies, and alert system from day one | 内置安全体系：JWT 认证、HttpOnly Cookie、告警系统 |
| 🌍 | **i18n Ready** | 13 built-in languages, easily extensible | 内置 13 种语言，轻松扩展 |
| 📱 | **Responsive Design** | Works seamlessly on desktop and mobile | 响应式设计，桌面与移动端无缝适配 |

<br>

## 🛠️ Tech Stack | 技术栈

| Layer | Technology | 说明 |
| :--- | :--- | :--- |
| **Backend** | Go (Golang) | 单文件编译，零外部依赖 |
| **Frontend** | React + TailwindCSS | 响应式、主题感知 UI |
| **Database** | SQLite / PostgreSQL | 默认 SQLite，可选 PostgreSQL |
| **Real-time** | WebSocket + SSE | 实时双向通信 |
| **Deployment** | Single binary, cross-platform | 单文件跨平台（Windows / macOS / Linux） |
| **Container** | Docker / Docker Compose | 一键 Docker 部署，支持 amd64 & arm64 |

<br>

## 🤝 Contributing | 参与贡献

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

欢迎参与贡献！无论是修复 Bug、添加功能还是改进文档，我们都非常感谢。

<br>

## 💬 A Note from the Author | 作者寄语

This is my first open-source project, and I hope it will continue to improve with the help of the community. If you run into any issues or have ideas for improvement, feel free to open an [Issue](https://github.com/ClawDeckX/ClawDeckX/issues) or submit a [Pull Request](https://github.com/ClawDeckX/ClawDeckX/pulls). Thank you for your support. Every piece of feedback helps this project grow.

这是我的第一个开源项目，也希望它能在大家的参与下变得越来越好。如果你发现问题，或有任何改进想法，欢迎提交 [Issue](https://github.com/ClawDeckX/ClawDeckX/issues) 或 [Pull Request](https://github.com/ClawDeckX/ClawDeckX/pulls)。感谢你的关注和支持，每一次反馈，都是这个项目成长的一部分。

> *An AI predicted this project would go viral. But as we all know, AIs do hallucinate sometimes 😅*
>
> *某 AI 曾预言本项目会大火——不过众所周知，AI 这东西，是会产生幻觉的😅。*

<br>

## 📄 License | 开源协议

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute for both personal and commercial purposes.

本项目基于 [MIT 协议](LICENSE) 开源 — 可自由使用、修改和分发，适用于个人及商业用途。

<br>

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ClawDeckX/ClawDeckX&type=Date)](https://star-history.com/#ClawDeckX/ClawDeckX&Date)

<br>

<div align="center">
  <sub>Designed with ❤️ by ClawDeckX</sub>
</div>
