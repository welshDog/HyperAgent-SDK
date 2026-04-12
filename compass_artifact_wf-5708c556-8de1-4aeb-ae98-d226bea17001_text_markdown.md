# Terminal tool analysis: Starship, fzf, and Claude Code

Three essential terminal tools — Starship prompt, fzf fuzzy finder, and Claude Code CLI — have matured significantly through 2025–2026, each offering robust Windows/WSL2 support and increasingly sophisticated integration points. **Starship sits at v1.24.2 with ~55k GitHub stars, fzf remains at 0.71.0 with no v2 planned, and Claude Code has evolved into a full MCP client-server with official SDKs.** This analysis provides version-pinned, install-ready data for each tool across Windows, PowerShell, and WSL2 environments.

---

## 1. Starship prompt evolved quietly from v0.58 to v1.24

The last v0.x release was **v0.58.0** (September 21, 2021). Starship **v1.0.0** shipped on November 9, 2021, primarily as a SemVer commitment — no breaking changes, just a promise of stability. The current release is **v1.24.2** (December 30, 2025), with **~55,700 GitHub stars** and ~2,400 forks.

Key features added across the v1.x lifecycle include **user-defined color palettes** (v1.11.0), **transient prompt support** for Cmd, PowerShell, and Fish (v1.10.0 and v1.24.2), **Windows binary codesigning** (v1.21.0), **parallelized child modules** for env_var and custom modules (v1.23.0), and modules for Bun, Solidity, Gleam, Meson, and Pulumi. The replacement of git2 with git-repository in v1.10.0 improved performance, and v1.24.2 added Git Reftable compatibility.

**Windows/PowerShell works natively.** Add one line to your PowerShell profile (`$PROFILE`):

```powershell
Invoke-Expression (&starship init powershell)
```

The most common Windows issue is **Windows Defender slowdown** — real-time protection scanning `starship.exe` and `pwsh.exe` on each prompt render causes 1–2 second delays. Fix this by adding exclusions for both binaries. Other known issues: execution policy may need `Set-ExecutionPolicy RemoteSigned`, and git operations can be slow in large repos due to Windows filesystem differences.

**WSL2 is fully supported** with no special configuration. Install inside WSL with `curl -sS https://starship.rs/install.sh | sh`, then add `eval "$(starship init bash)"` to `~/.bashrc`. A popular pattern is symlinking `starship.toml` from the Windows side (`/mnt/c/Users/<user>/.config/starship.toml`) to share configuration between PowerShell and WSL2. Nerd Fonts must be installed on the **Windows host**, not inside WSL.

**Install commands for Windows:**

| Method | Command |
|--------|---------|
| winget | `winget install --id Starship.Starship` |
| Scoop | `scoop install starship` |
| Chocolatey | `choco install starship` |
| Cargo | `cargo install starship --locked` |
| MSI | Download from GitHub releases (x86_64, i686, aarch64) |

Scoop is the smoothest option — no admin rights required and PATH is handled automatically.

---

## 2. fzf at 0.71.0 keeps gaining features with no v2 on the horizon

The current release is **fzf 0.71.0** (April 4, 2026). Despite never reaching 1.0, fzf has shipped 12+ releases in the past year with substantial features: a **styling system** (0.63.0), **Zellij floating pane support** (0.71.0, via the renamed `--popup` flag), **86x reduction in cache memory footprint**, and search performance that now **scales linearly with CPU cores**. There is no announced "fzf v2" — the existing `--algo=v2` flag refers to the matching algorithm, not the tool version.

**Windows install is straightforward** across three package managers:

| Method | Command |
|--------|---------|
| winget | `winget install fzf` |
| Scoop | `scoop install fzf` |
| Chocolatey | `choco install fzf` |

PowerShell 7+ is recommended over 5.1. PS 5.1 buffers all upstream output before piping to external programs, which breaks the streaming experience fzf depends on.

**WSL2 install — use the git clone method**, not apt. Ubuntu/Debian repos ship severely outdated versions (sometimes 0.44.x when current is 0.71.0). The recommended approach:

```bash
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install
```

Then add `eval "$(fzf --bash)"` to `~/.bashrc` (requires fzf 0.48.0+). This enables **Ctrl+R** (history search), **Ctrl+T** (file search), and **Alt+C** (directory jump).

**PowerShell integration uses the PSFzf module** by kelleyma49. Install and configure in your `$PROFILE`:

```powershell
Install-Module PSFzf -Scope CurrentUser
Import-Module PSReadLine
Import-Module PSFzf
Set-PsFzfOption -PSReadlineChordProvider 'Ctrl+t' -PSReadlineChordReverseHistory 'Ctrl+r'
```

PSFzf provides helper functions like `Invoke-FuzzyEdit`, `Invoke-FuzzyHistory`, `Invoke-FuzzyKillProcess`, and `Invoke-FuzzyGitStatus`. It also supports `**<TAB>` wildcard completion for git branches, services, and processes.

**Alternatives worth knowing about:** **skim** (`sk`) is a Rust-based drop-in replacement with native interactive mode (`-c` flag) and library support as a Rust crate — latest version 0.20.5, install via `cargo install skim` or `scoop install skim`. **telescope.nvim** (~19.2k stars) is Neovim-specific and written in Lua, though LazyVim 14+ switched its default to **fzf-lua** citing better performance. **nucleo** is a pure Rust fuzzy-matching library used by the Helix editor, claiming ~6x faster matching than skim — it's a library, not a CLI tool. **zoxide** complements fzf as a frecency-based directory jumper, integrating with fzf for interactive mode via `zi`.

---

## 3. Claude Code is a full MCP client and server with SDK access

Claude Code has evolved from a simple CLI assistant into a comprehensive agentic coding platform. The npm package (`@anthropic-ai/claude-code`) sits at **version ~2.1.87** with **10.8M+ downloads**. It's built on Bun runtime with ~512,000 lines of TypeScript and contains **40+ internal tool modules**.

**Built-in tools exposed internally:** Bash, Read, Write, Edit, LS, GrepTool (ripgrep-backed), GlobTool, Replace, WebSearch, WebFetch, Skill, and Task (background agents). Interactive slash commands include `/compact`, `/mcp`, `/plan`, `/fast`, `/schedule`, `/batch`, and custom commands from `.claude/commands/`.

**MCP support is dual-mode — Claude Code operates as both client and server.** As a client, it connects to external MCP servers via HTTP, SSE, or stdio transports with OAuth 2.0 support. Configure with `claude mcp add --transport http <name> <url>` or via `.mcp.json` at project root. Its **MCP Tool Search** feature reduces context usage by ~85% through on-demand tool loading. As a server, running `claude mcp serve` exposes Bash, Read, Write, Edit, LS, GrepTool, GlobTool, and Replace over stdio transport (JSON-RPC 2.0). Each client connection gets a fresh instance — no shared state. Both modes operate simultaneously.

**HyperAgent wrapping is feasible but requires an adapter.** Research reveals no single "HyperAgent manifest.json" standard — the name maps to Hyperbrowser's browser automation SDK, which is unrelated. However, several emerging agent protocol standards exist (ACP at agentcommunicationprotocol.dev, agent.json at agent-json.org, JSON Agents/PAM at jsonagents.org). Claude Code's programmatic surface makes wrapping straightforward: the `-p` flag enables non-interactive execution, `--output-format json` provides structured output with `--json-schema` validation, and the official **Claude Agent SDK** (Python: `pip install claude-agent-sdk`; TypeScript: `npm install @anthropic-ai/claude-agent-sdk`) offers full library-level control with streaming, custom tools, hooks, and session management.

**Current install methods:**

```bash
# Native installer (recommended, zero dependencies)
curl -fsSL https://claude.ai/install.sh | bash         # macOS/Linux/WSL
irm https://claude.ai/install.ps1 | iex                # Windows PowerShell

# Homebrew
brew install --cask claude-code

# WinGet
winget install Anthropic.ClaudeCode

# npm (deprecated but functional, requires Node 18+)
npm install -g @anthropic-ai/claude-code
```

**The programmatic interface is rich.** Non-interactive mode with `claude -p "prompt"` supports three output formats: `text`, `json` (structured with session ID and metadata), and `stream-json` (newline-delimited for real-time streaming). Full Unix piping works — `cat logs.txt | claude -p "explain"` or `git diff | claude -p "review"`. Key flags for scripting include `--allowedTools`, `--max-turns`, `--max-budget-usd`, `--permission-mode`, `--model`, `--system-prompt`, and `--no-session-persistence`. The Agent SDK provides async iterators over message streams in both Python and TypeScript, with support for custom tools, MCP connections, subagents, and structured output validation via JSON Schema, Zod, or Pydantic.

---

## Conclusion: three tools at different maturity inflection points

Starship has settled into stable SemVer maintenance with codesigned Windows binaries and broad shell coverage — the main Windows friction (Defender slowdown) is well-documented with a simple fix. fzf continues aggressive feature development without a major version bump, and its ecosystem (PSFzf, fzf-lua, zoxide integration) makes it the dominant fuzzy finder with no credible challenger in sight. Claude Code has undergone the most dramatic evolution, transforming from a CLI wrapper into a dual-mode MCP node with official SDKs — its `claude mcp serve` capability and JSON-schema-validated output make it immediately scriptable into agent orchestration workflows, even without native support for any emerging agent manifest standard. For Windows/WSL2 environments, all three tools now install cleanly via winget or scoop, and all three support shared configurations across Windows and WSL2 boundaries.