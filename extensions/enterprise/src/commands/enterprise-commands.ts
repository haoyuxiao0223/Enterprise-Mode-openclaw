/**
 * Enterprise chat commands — operator-facing commands registered via
 * the openclaw 2026.3.23+ registerCommand API.
 *
 * These bypass the LLM agent and return structured status/audit info
 * directly in the chat surface.
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { getEnterpriseModules } from "../../bootstrap.ts";

export function registerEnterpriseCommands(api: OpenClawPluginApi): void {
  api.registerCommand({
    name: "enterprise",
    description: "Show enterprise mode status and module health",
    acceptsArgs: true,
    requireAuth: true,
    handler(ctx) {
      const subcommand = ctx.args?.trim().split(/\s+/)[0] ?? "status";

      switch (subcommand) {
        case "status":
          return handleStatus();
        case "audit":
          return handleAuditMetrics();
        case "health":
          return handleHealth();
        case "help":
          return handleHelp();
        default:
          return {
            text: `Unknown subcommand: \`${subcommand}\`\nUse \`/enterprise help\` for available commands.`,
          };
      }
    },
  });
}

function handleStatus(): { text: string } {
  const modules = getEnterpriseModules();
  if (!modules) {
    return { text: "Enterprise mode is **disabled**." };
  }

  const lines: string[] = [
    "**Enterprise Mode** — active",
    "",
    `| Module | Status |`,
    `|--------|--------|`,
    `| Kernel | ${fmtActive(true)} |`,
    `| Governance | ${fmtActive(modules.governance)} |`,
    `| Audit | ${fmtActive(modules.audit)} |`,
    `| Collaboration | ${fmtActive(modules.collaboration)} |`,
    `| Embedding | ${fmtActive(modules.embedding)} |`,
    `| Isolation | ${fmtActive(modules.isolation)} |`,
    `| Reliability | ${fmtActive(modules.reliability)} |`,
  ];

  return { text: lines.join("\n") };
}

function handleAuditMetrics(): { text: string } {
  const modules = getEnterpriseModules();
  if (!modules?.audit) {
    return { text: "Audit pipeline is not active." };
  }

  const metrics = modules.audit.pipeline.getMetrics();
  const lines: string[] = [
    "**Audit Pipeline Metrics**",
    "",
    `- Buffered events: ${metrics.bufferedEvents}`,
    `- Total emitted: ${metrics.totalEmitted}`,
    `- Registered sinks: ${metrics.sinkCount}`,
  ];

  return { text: lines.join("\n") };
}

function handleHealth(): { text: string } {
  const modules = getEnterpriseModules();
  if (!modules) {
    return { text: "Enterprise mode is **disabled**." };
  }

  const checks: string[] = [];

  if (modules.reliability?.healthChecker) {
    checks.push("- Health checker: active");
  }
  if (modules.reliability?.metricsProvider) {
    checks.push("- Metrics provider: active");
  }
  if (modules.reliability?.checkpointManager) {
    checks.push("- Checkpoint manager: active");
  }

  if (checks.length === 0) {
    return { text: "No reliability modules are currently active." };
  }

  return { text: ["**Reliability Health**", "", ...checks].join("\n") };
}

function handleHelp(): { text: string } {
  const lines: string[] = [
    "**Enterprise Commands**",
    "",
    "`/enterprise status` — module overview and activation state",
    "`/enterprise audit` — audit pipeline metrics (buffered events, sinks)",
    "`/enterprise health` — reliability module health checks",
    "`/enterprise help` — this help message",
  ];

  return { text: lines.join("\n") };
}

function fmtActive(module: unknown): string {
  return module ? "active" : "inactive";
}
