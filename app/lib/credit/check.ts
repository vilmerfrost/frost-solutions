/**
 * Pre-project credit check — risk scoring for clients.
 *
 * Stub implementation using Allabolag.se public data.
 * Replace with a proper credit bureau API (e.g. UC, Bisnode) in production.
 */

export interface CreditCheckResult {
  orgNumber: string
  companyName: string
  riskScore: number // 0-100
  riskLevel: 'GREEN' | 'YELLOW' | 'RED'
  recommendation: string
  checkedAt: string
  source: string
}

export function calculateRiskLevel(score: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (score > 70) return 'GREEN'
  if (score >= 40) return 'YELLOW'
  return 'RED'
}

export function getRiskRecommendation(level: 'GREEN' | 'YELLOW' | 'RED'): string {
  switch (level) {
    case 'GREEN':
      return 'Normala villkor \u2014 standard betalningsplan'
    case 'YELLOW':
      return 'Forhojd risk \u2014 krav 50% forskottsbetalning'
    case 'RED':
      return 'Hog risk \u2014 krav full forskottsbetalning eller avboj'
  }
}

/**
 * Perform a credit check by fetching public company info from Allabolag.se.
 *
 * This is a stub: it scrapes basic company data and assigns a heuristic score.
 * In production, integrate with UC AB or Bisnode for real credit data.
 */
export async function performCreditCheck(orgNumber: string): Promise<CreditCheckResult> {
  const cleanOrg = orgNumber.replace(/\D/g, '')

  // Attempt to fetch public data from Allabolag
  let companyName = 'Okant foretag'
  let riskScore = 50 // default mid-range when we can't fetch real data

  try {
    const res = await fetch(`https://www.allabolag.se/${cleanOrg}`, {
      headers: { 'User-Agent': 'FrostSolutions/1.0 (credit-check-stub)' },
      signal: AbortSignal.timeout(5000),
    })

    if (res.ok) {
      const html = await res.text()

      // Extract company name from page title (heuristic)
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
      if (titleMatch) {
        // Title format is typically "Foretaget AB - Org.nummer ... - Allabolag"
        const parts = titleMatch[1].split(' - ')
        if (parts.length > 0) {
          companyName = parts[0].trim()
        }
      }

      // Heuristic scoring based on presence of key indicators
      // Active company indicators increase score
      if (html.includes('Aktivt')) riskScore += 20
      if (html.includes('F-skatt')) riskScore += 10

      // Negative indicators decrease score
      if (html.includes('Vilande') || html.includes('Avregistrerad')) riskScore -= 30
      if (html.includes('Konkurs') || html.includes('Likvidation')) riskScore -= 50

      // Clamp to 0-100
      riskScore = Math.max(0, Math.min(100, riskScore))
    }
  } catch {
    // If fetch fails, use default score — this is a stub
  }

  const riskLevel = calculateRiskLevel(riskScore)

  return {
    orgNumber: cleanOrg,
    companyName,
    riskScore,
    riskLevel,
    recommendation: getRiskRecommendation(riskLevel),
    checkedAt: new Date().toISOString(),
    source: 'allabolag.se (stub)',
  }
}
