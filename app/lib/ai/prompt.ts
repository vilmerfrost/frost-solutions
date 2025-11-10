// app/lib/ai/prompt.ts
export function buildPrompt(pageContext: string, pageData: Record<string, unknown>, userQuery: string) {
  return [
    { 
      role: 'system', 
      content: `Du är en assistent för Frost Solutions. Kontext: ${pageContext}` 
    },
    { 
      role: 'user', 
      content: `Data: ${JSON.stringify(pageData).slice(0, 4000)}; Fråga: ${userQuery}` 
    }
  ] as const;
}

