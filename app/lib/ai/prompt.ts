// app/lib/ai/prompt.ts
import { SYSTEM_PROMPT } from './prompts';

/**
 * Business context interface for AI assistant
 */
export interface BusinessContext {
  user: { name: string; role: string };
  activeProjects: Array<{ id: string; name: string; status: string; budget: number | null }>;
  recentTimeEntries: { totalHours: number; thisWeek: number; pendingApproval: number };
  invoices: { unpaidCount: number; totalUnpaid: number };
  workOrders: { pendingCount: number; assignedToMe: number };
}

/**
 * Build AI prompt messages with proper system prompt and business context
 */
export function buildPrompt(
  pageContext: string, 
  pageData: Record<string, unknown>, 
  userQuery: string,
  businessContext?: BusinessContext
) {
  // Build context section
  let contextSection = '';
  
  if (businessContext) {
    contextSection = `
AKTUELL ANVÄNDARKONTEXT:
- Användare: ${businessContext.user.name} (${businessContext.user.role})

AKTIVA PROJEKT (${businessContext.activeProjects.length}):
${businessContext.activeProjects.map(p => `- ${p.name} (${p.status})${p.budget ? ` - Budget: ${p.budget.toLocaleString('sv-SE')} kr` : ''}`).join('\n') || '- Inga aktiva projekt'}

TIDSRAPPORTER (senaste 7 dagarna):
- Totalt: ${businessContext.recentTimeEntries.totalHours.toFixed(1)}h
- Denna vecka: ${businessContext.recentTimeEntries.thisWeek.toFixed(1)}h
- Väntar på godkännande: ${businessContext.recentTimeEntries.pendingApproval} st

FAKTUROR:
- Obetalda: ${businessContext.invoices.unpaidCount} st (${businessContext.invoices.totalUnpaid.toLocaleString('sv-SE')} kr)

ARBETSORDER:
- Väntande: ${businessContext.workOrders.pendingCount} st
- Tilldelade mig: ${businessContext.workOrders.assignedToMe} st
`;
  }

  // Add page-specific context if provided
  if (pageContext) {
    contextSection += `\nAKTUELL SIDA: ${pageContext}`;
  }

  // Add page data if provided (limited to avoid token overflow)
  if (pageData && Object.keys(pageData).length > 0) {
    const pageDataStr = JSON.stringify(pageData, null, 2).slice(0, 2000);
    contextSection += `\n\nSIDDATA:\n${pageDataStr}`;
  }

  const fullSystemPrompt = contextSection 
    ? `${SYSTEM_PROMPT}\n\n---\n${contextSection}`
    : SYSTEM_PROMPT;

  return [
    { 
      role: 'system', 
      content: fullSystemPrompt
    },
    { 
      role: 'user', 
      content: userQuery
    }
  ] as const;
}

/**
 * Build minimal prompt without business context (for fallback)
 */
export function buildMinimalPrompt(userQuery: string) {
  return [
    { 
      role: 'system', 
      content: SYSTEM_PROMPT
    },
    { 
      role: 'user', 
      content: userQuery
    }
  ] as const;
}
