/**
 * @module @w3lshdog/hyper-agent
 * TypeScript declarations for HyperAgent-SDK public API.
 */

// ─── Manifest schema types (mirrors hyper-agent-spec.json) ───────────────────

/** Runtime environment for an agent. */
export type AgentRuntime = 'python' | 'node' | 'deno';

/** Memory backend available to an agent. */
export type AgentMemory = 'none' | 'redis' | 'postgres';

/** EVM chain an agent's Web3 block targets. */
export type Web3Chain = 'base' | 'base-sepolia' | 'ethereum' | 'ethereum-sepolia';

/** Token standard of a Web3 contract. */
export type TokenStandard = 'ERC-721' | 'ERC-1155' | 'ERC-20';

/** A single on-chain action an agent can perform. */
export type Web3Capability =
  | 'mint'
  | 'evolve'
  | 'transfer'
  | 'burn'
  | 'read-metadata'
  | 'read-balance';

/**
 * Optional Web3/dNFT capability block (spec v0.4.0+).
 *
 * Present when an agent reads or writes on-chain state — minting,
 * evolving, or reading dynamic NFTs (the BROskiPets dNFT pet model).
 */
export interface AgentWeb3 {
  /** Target EVM chain. `base-sepolia` is the BROskiPets testnet default. */
  chain: Web3Chain;
  /** Token standard of the contract. Defaults to "ERC-721". */
  token_standard?: TokenStandard;
  /**
   * True when the token is a dynamic NFT — on-chain metadata mutates
   * over the token lifecycle (the BROskiPets pet-evolve model).
   */
  dnft?: boolean;
  /** EVM contract address — `0x` followed by 40 hex chars. */
  contract_address?: string;
  /**
   * On-chain actions the agent performs. At least one required.
   * `mint` + `evolve` together = full dNFT lifecycle.
   */
  capabilities: [Web3Capability, ...Web3Capability[]];
  /**
   * Name of the env var holding the signer/RPC credential — the NAME only.
   * Keys live in Docker secrets, never in the manifest.
   */
  signer_env_var?: string;
}

/** A single tool exposed by an agent. */
export interface AgentTool {
  /** snake_case, 3–64 chars. */
  name: string;
  /** Human-readable purpose, max 300 chars. */
  description: string;
  /** JSON Schema object describing the tool's input. */
  input_schema: Record<string, unknown>;
  /** JSON Schema object describing the tool's output (optional). */
  output_schema?: Record<string, unknown>;
}

/**
 * The full HyperAgent manifest — the shared contract between
 * Hyper-Vibe-Coding-Course, HyperCode V2.4, and the agent registry.
 *
 * Validated by AJV against `hyper-agent-spec.json`.
 */
export interface HyperAgentManifest {
  /** kebab-case, 3–50 chars, unique within a deployment. */
  name: string;
  /** Semver string, e.g. "0.1.0". */
  version: string;
  /** Optional human-readable name, max 80 chars. */
  display_name?: string;
  /** Optional description, max 500 chars. */
  description?: string;
  /** Author (usually a Discord username or GitHub handle). */
  author?: string;
  /** Runtime environment. */
  runtime: AgentRuntime;
  /** Path to the entrypoint file relative to the agent directory. */
  entrypoint: string;
  /** At least one tool must be declared. */
  tools: [AgentTool, ...AgentTool[]];
  /**
   * Whether the agent implements the MCP protocol.
   * When `true`, `port` is required.
   */
  mcp_compatible: boolean;
  /** Memory backend. Defaults to "none". */
  memory?: AgentMemory;
  /** Environment variable names the agent expects at runtime. */
  env_vars?: string[];
  /**
   * MCP port. Required when `mcp_compatible` is true.
   * Range 3100–3999 per HyperAgent port convention:
   * 3100-3199 writing, 3200-3299 code, 3300-3399 data,
   * 3400-3499 discord, 3500-3599 automation.
   */
  port?: number;
  /** HTTP path used to health-check the agent (e.g. "/health"). */
  health_check?: string;
  /** Freeform tags for registry search. */
  tags?: string[];
  /**
   * Course level gate. 1=HyperNewbie, 2=Vibe Coder,
   * 3=Agent Builder, 4=HyperCoder, 5=BROski Elite.
   */
  course_level?: 1 | 2 | 3 | 4 | 5;
  /**
   * Author-declared badges (e.g. "featured", "community-pick", "experimental").
   * Registry auto-computes: verified, mcp-ready, memory-enabled,
   * multi-tool, elite, hyper-coder, env-declared, health-checked,
   * web3-enabled, dnft.
   */
  badges?: string[];
  /**
   * Optional Web3/dNFT capability block (spec v0.4.0+).
   * Declares on-chain interaction — chain, contract, and capabilities.
   * Omit entirely for non-Web3 agents.
   */
  web3?: AgentWeb3;
}

// ─── validateAgent return type ────────────────────────────────────────────────

/** Result returned by `validateAgent`. */
export interface ValidationResult {
  /** Whether the manifest passed AJV schema validation. */
  passed: boolean;
  /** Number of strict-mode errors (0 when `--strict` is not used). */
  strictErrors: number;
  /** Parsed manifest — only present when `passed` is true. */
  manifest?: HyperAgentManifest;
}

/** Options for `validateAgent`. */
export interface ValidateOptions {
  /**
   * Enable strict mode: checks entrypoint file exists on disk,
   * runtime file present, env vars set, MCP port conflicts.
   */
  strict?: boolean;
  /**
   * Shared port-conflict map. Pass the same Map across multiple
   * `validateAgent` calls to detect port conflicts between agents.
   */
  seenPorts?: Map<number, string>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate a single agent directory against the HyperAgent spec.
 *
 * @param agentDir - Absolute or relative path to the agent directory
 *   (must contain `manifest.json`).
 * @param options - Validation options.
 * @returns Validation result with pass/fail status, strict error count,
 *   and the parsed manifest when valid.
 *
 * @example
 * ```js
 * const { validateAgent } = require('@w3lshdog/hyper-agent');
 * const result = validateAgent('./my-agent', { strict: true });
 * if (result.passed) console.log('Agent valid:', result.manifest.name);
 * ```
 */
export function validateAgent(
  agentDir: string,
  options?: ValidateOptions
): ValidationResult;

/**
 * CLI entry point — runs the `validate` command with the given argv-style
 * arguments (everything after `hyper-agent validate`).
 *
 * @param args - Array of CLI arguments, e.g. `['./my-agent', '--strict']`.
 */
export function run(args: string[]): void;

// ─── awardFromCourse client (subpath: "@w3lshdog/hyper-agent/client") ─────────
//
// These types describe `cli/client.js`. Import via:
//   import { awardFromCourse } from '@w3lshdog/hyper-agent/client';
//
// SECURITY: COURSE_SYNC_SECRET is server-only — never call from a browser bundle.

/** Input to {@link awardFromCourse}. */
export interface AwardFromCourseInput {
  /** Idempotency key (e.g. token_transactions.id). Max 128 chars. */
  sourceId: string;
  /** Discord snowflake. Max 32 chars. */
  discordId: string;
  /** Integer 1..10000. */
  tokens: number;
  /** Optional human-readable reason. Max 255 chars. Defaults to "Course reward". */
  reason?: string;
}

/** Options passed alongside {@link AwardFromCourseInput}. */
export interface AwardFromCourseOptions {
  /** V2.4 base URL. Defaults to `process.env.HYPERCODE_API_URL` or `http://localhost:8000`. */
  baseUrl?: string;
  /** Shared secret. Defaults to `process.env.COURSE_SYNC_SECRET`. Server-only. */
  secret?: string;
  /** Request timeout in ms. Default 5000. */
  timeoutMs?: number;
  /** Custom fetch implementation (used by tests). Defaults to global `fetch`. */
  fetch?: typeof fetch;
}

/** Result returned by {@link awardFromCourse}. Always includes `source_id`. */
export interface AwardFromCourseResult {
  /** The idempotency key. Always present. */
  source_id: string;
  /** True when the server returned 409 (already processed). */
  duplicate?: boolean;
  /** Whether the award was applied (200 only). */
  awarded?: boolean;
  coins_balance?: number;
  xp_balance?: number;
  level?: number;
  /** Server-supplied detail/message on 409. */
  detail?: string;
  [key: string]: unknown;
}

/** Error thrown by {@link awardFromCourse} for validation, network, or non-2xx/409 responses. */
export class AwardFromCourseError extends Error {
  name: 'AwardFromCourseError';
  /** HTTP status when the failure came from a response. */
  status?: number;
  /**
   * Stable failure code for programmatic handling.
   * One of: `INVALID_INPUT`, `INVALID_SOURCE_ID`, `INVALID_DISCORD_ID`,
   * `INVALID_TOKENS`, `INVALID_REASON`, `MISSING_SECRET`, `NO_FETCH`,
   * `BROWSER_FORBIDDEN`, `TIMEOUT`, `NETWORK`, `BAD_STATUS`.
   */
  code?: string;
  cause?: unknown;
}

/**
 * Award BROski$ tokens from the Course repo to a HyperCode V2.4 user.
 *
 * - **Server-only** — refuses to run in a browser environment.
 * - **Idempotent** via `sourceId`: replaying returns `{ source_id, duplicate: true }`.
 * - **Times out** via `AbortController` (default 5000 ms).
 *
 * @example
 * ```ts
 * import { awardFromCourse } from '@w3lshdog/hyper-agent/client';
 *
 * const result = await awardFromCourse({
 *   sourceId: txn.id,
 *   discordId: user.discord_id,
 *   tokens: 50,
 *   reason: 'Course module complete',
 * });
 * console.log(result.source_id, result.duplicate);
 * ```
 */
export function awardFromCourse(
  input: AwardFromCourseInput,
  options?: AwardFromCourseOptions,
): Promise<AwardFromCourseResult>;
