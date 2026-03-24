/**
 * Conversation Binding Audit — emits audit events when conversation
 * bindings are approved or denied, using the openclaw 2026.3.23+
 * onConversationBindingResolved API.
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { getEnterpriseModules } from "../../bootstrap.ts";
import type { AuditEvent } from "./audit-event.ts";

export function registerBindingAuditHandler(api: OpenClawPluginApi): void {
  api.onConversationBindingResolved((event) => {
    const modules = getEnterpriseModules();
    if (!modules?.audit) return;

    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      version: "1.0",
      tenantId: event.request.conversation.accountId || "system",
      actor: {
        type: "user",
        id: event.request.requestedBySenderId ?? "unknown",
      },
      action: `conversation.binding.${event.status}`,
      category: "authorization",
      outcome: event.status === "approved" ? "success" : "denied",
      resource: {
        type: "conversation_binding",
        id: event.binding?.bindingId,
        name: event.request.summary,
        tenantId: event.request.conversation.accountId || "system",
      },
      source: {
        service: "enterprise",
        requestId: event.binding?.bindingId ?? crypto.randomUUID(),
      },
      details: {
        channel: event.request.conversation.channel,
        conversationId: event.request.conversation.conversationId,
        decision: event.decision,
        parentConversationId: event.request.conversation.parentConversationId,
        threadId: event.request.conversation.threadId,
      },
    };

    modules.audit.pipeline.emit(auditEvent);
  });
}
