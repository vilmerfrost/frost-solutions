/**
 * Intent Detection for AI Assistant
 * Classifies user queries to determine appropriate response strategy
 */

export type IntentType = 
  | 'invoice' 
  | 'kma' 
  | 'work_order' 
  | 'time' 
  | 'material' 
  | 'budget' 
  | 'general';

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities?: Record<string, string>;
}

/**
 * Simple keyword-based intent detection (fallback)
 * In production, this would use Claude or a fine-tuned model
 */
export function detectIntentSimple(query: string): IntentResult {
  const lower = query.toLowerCase().trim();
  
  // Invoice keywords
  if (lower.match(/\b(faktura|invoice|fakturera|fakturer|betalning|moms|rabatt)\b/)) {
    return { intent: 'invoice', confidence: 0.8 };
  }
  
  // KMA keywords
  if (lower.match(/\b(kma|checklista|säkerhet|risk|foto|bild|photo)\b/)) {
    return { intent: 'kma', confidence: 0.8 };
  }
  
  // Work order keywords
  if (lower.match(/\b(arbetsorder|uppgift|task|job|order)\b/)) {
    return { intent: 'work_order', confidence: 0.8 };
  }
  
  // Time keywords
  if (lower.match(/\b(tid|tim|rapport|schema|pass|stämpla|klocka)\b/)) {
    return { intent: 'time', confidence: 0.8 };
  }
  
  // Material keywords
  if (lower.match(/\b(material|artikel|vara|produkt|identifiera|foto|bild)\b/)) {
    return { intent: 'material', confidence: 0.8 };
  }
  
  // Budget keywords
  if (lower.match(/\b(budget|kostnad|pris|ekonomi|prognos|spend)\b/)) {
    return { intent: 'budget', confidence: 0.8 };
  }
  
  // Default to general
  return { intent: 'general', confidence: 0.5 };
}

/**
 * Extract entities from query (project IDs, dates, etc.)
 */
export function extractEntities(query: string): Record<string, string> {
  const entities: Record<string, string> = {};
  
  // Extract UUIDs (project IDs, invoice IDs, etc.)
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const uuids = query.match(uuidRegex);
  if (uuids && uuids.length > 0) {
    entities.project_id = uuids[0];
  }
  
  // Extract dates
  const dateRegex = /\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/g;
  const dates = query.match(dateRegex);
  if (dates && dates.length > 0) {
    entities.date = dates[0];
  }
  
  return entities;
}

