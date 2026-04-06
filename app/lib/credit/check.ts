/**
 * Credit check — multi-tier risk scoring for clients.
 *
 * Tier 1: Public data from Bolagsverket/Skatteverket (free, always available)
 * Tier 2: Creditsafe API (when CREDITSAFE_API_KEY is configured)
 *
 * Falls back gracefully: Tier 2 → Tier 1 → minimal data.
 */

export interface CreditCheckResult {
  orgNumber: string
  companyName: string
  riskScore: number // 0-100
  riskLevel: 'GREEN' | 'YELLOW' | 'RED'
  riskAssessment: 'low' | 'medium' | 'high'
  recommendation: string
  checkedAt: string
  source: string
  details?: {
    hasFSkatt?: boolean
    hasVat?: boolean
    isActive?: boolean
    registrationDate?: string
    companyAge?: number // years
  }
}

export function calculateRiskLevel(score: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (score > 70) return 'GREEN'
  if (score >= 40) return 'YELLOW'
  return 'RED'
}

export function getRiskAssessment(level: 'GREEN' | 'YELLOW' | 'RED'): 'low' | 'medium' | 'high' {
  switch (level) {
    case 'GREEN': return 'low'
    case 'YELLOW': return 'medium'
    case 'RED': return 'high'
  }
}

export function getRiskRecommendation(level: 'GREEN' | 'YELLOW' | 'RED'): string {
  switch (level) {
    case 'GREEN':
      return 'Normala villkor — standard betalningsplan'
    case 'YELLOW':
      return 'Förhöjd risk — kräv 50% förskottsbetalning'
    case 'RED':
      return 'Hög risk — kräv full förskottsbetalning eller avböj'
  }
}

// ---------------------------------------------------------------------------
// Tier 2 — Creditsafe API
// ---------------------------------------------------------------------------

interface CreditsafeCompany {
  companyName: string
  creditScore: number // Creditsafe scores 0-100
  status: string
  registrationDate?: string
}

/**
 * Authenticate with Creditsafe Connect API.
 * The API key is a username:password pair, exchanged for a Bearer token.
 */
async function getCreditsafeToken(apiKey: string): Promise<string | null> {
  try {
    const [username, password] = apiKey.split(':')
    if (!username || !password) {
      console.warn('[credit-check] CREDITSAFE_API_KEY must be in format "username:password"')
      return null
    }

    const res = await fetch('https://connect.creditsafe.com/v1/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.warn(`[credit-check] Creditsafe auth failed: ${res.status}`)
      return null
    }

    const data = await res.json()
    return data?.token ?? null
  } catch (err) {
    console.warn('[credit-check] Creditsafe auth error:', err)
    return null
  }
}

async function fetchCreditsafe(orgNumber: string): Promise<CreditsafeCompany | null> {
  const apiKey = process.env.CREDITSAFE_API_KEY
  if (!apiKey) return null

  try {
    console.log(`[credit-check] Tier 2: Authenticating with Creditsafe for ${orgNumber}`)

    const token = await getCreditsafeToken(apiKey)
    if (!token) return null

    // Creditsafe uses country code + org number format
    const connectId = `SE-${orgNumber}`

    const res = await fetch(
      `https://connect.creditsafe.com/v1/companies/${encodeURIComponent(connectId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) {
      console.warn(`[credit-check] Creditsafe returned ${res.status} for ${orgNumber}`)
      return null
    }

    const data = await res.json()
    const report = data?.report ?? data

    return {
      companyName: report?.companySummary?.businessName ?? report?.companyName ?? 'Okänt företag',
      creditScore: report?.creditScore?.currentCreditRating?.value ?? 50,
      status: report?.companySummary?.companyStatus?.status ?? 'Unknown',
      registrationDate: report?.companySummary?.companyRegistrationDate ?? undefined,
    }
  } catch (err) {
    console.warn('[credit-check] Creditsafe request failed, falling back to Tier 1:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Tier 1 — Bolagsverket / Skatteverket public data
// ---------------------------------------------------------------------------

interface PublicCompanyData {
  companyName: string
  hasFSkatt: boolean
  hasVat: boolean
  isActive: boolean
  registrationDate: string | null
}

/**
 * Verify F-skatt status via Skatteverket.
 *
 * NOTE: Skatteverket does not offer a public API for F-skatt verification.
 * Their lookup requires an organizational certificate (e-legitimation).
 * This function attempts a best-effort check via their web form, but results
 * may be unreliable. For production use, integrate with a credit bureau
 * (Creditsafe, UC, Bisnode) that provides verified F-skatt data.
 */
async function checkFSkattStatus(orgNumber: string): Promise<boolean> {
  try {
    // Attempt Skatteverket's public web lookup (best-effort, may not return structured data)
    const res = await fetch(
      `https://www.skatteverket.se/swi/fix/LookupServlet?orgNr=${orgNumber}`,
      {
        headers: { Accept: 'text/html, application/xml' },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!res.ok) return false

    const text = await res.text()
    // Look for positive F-skatt indicators in the response
    const hasPositive = /[Gg]odk.{1,4}nd\s+(f.r\s+)?F-skatt/i.test(text)
    const hasNegative = /ej\s+godk.{1,4}nd/i.test(text)
    return hasPositive && !hasNegative
  } catch {
    return false
  }
}

/**
 * Gather publicly available company data.
 *
 * NOTE: Bolagsverket does not offer a free public JSON API for company lookups.
 * Their web service (Näringslivsregistret) requires a subscription or e-legitimation.
 * We fall back to basic org number validation and F-skatt check.
 * For complete company data, use Creditsafe (Tier 2) or subscribe to
 * Bolagsverket's API (https://bolagsverket.se/om/oss/e-tjanster).
 */
async function fetchBolagsverketData(orgNumber: string): Promise<PublicCompanyData> {
  const result: PublicCompanyData = {
    companyName: 'Okänt företag',
    hasFSkatt: false,
    hasVat: false,
    isActive: false,
    registrationDate: null,
  }

  try {
    console.log(`[credit-check] Tier 1: Checking public data for ${orgNumber}`)

    // Check F-skatt status (best-effort)
    result.hasFSkatt = await checkFSkattStatus(orgNumber)

    // Basic org number validation: Swedish org numbers are 10 digits, first digit 1-9
    const isValidFormat = /^[1-9]\d{9}$/.test(orgNumber)
    if (isValidFormat) {
      // Assume active if format is valid (we can't verify without a subscription)
      result.isActive = true
    }
  } catch (err) {
    console.warn('[credit-check] Public data fetch failed:', err)
  }

  return result
}

// ---------------------------------------------------------------------------
// Tier 1 scoring heuristic
// ---------------------------------------------------------------------------

function calculateTier1Score(data: PublicCompanyData): { score: number; details: CreditCheckResult['details'] } {
  let score = 0

  // F-skatt: +30 points
  if (data.hasFSkatt) score += 30

  // VAT registration: +20 points
  if (data.hasVat) score += 20

  // Active status: +20 points
  if (data.isActive) score += 20

  // Company age: up to +30 points
  let companyAge: number | undefined
  if (data.registrationDate) {
    const regDate = new Date(data.registrationDate)
    const now = new Date()
    companyAge = (now.getTime() - regDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

    if (companyAge >= 10) score += 30
    else if (companyAge >= 5) score += 25
    else if (companyAge >= 3) score += 20
    else if (companyAge >= 1) score += 10
    else score += 5
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    details: {
      hasFSkatt: data.hasFSkatt,
      hasVat: data.hasVat,
      isActive: data.isActive,
      registrationDate: data.registrationDate ?? undefined,
      companyAge: companyAge ? Math.round(companyAge * 10) / 10 : undefined,
    },
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Perform a credit check on a Swedish company by org number.
 *
 * Uses Creditsafe API if CREDITSAFE_API_KEY is configured (Tier 2),
 * otherwise falls back to public Bolagsverket/Skatteverket data (Tier 1).
 */
export async function performCreditCheck(orgNumber: string): Promise<CreditCheckResult> {
  const cleanOrg = orgNumber.replace(/\D/g, '')

  // Try Tier 2 first (Creditsafe)
  const creditsafeResult = await fetchCreditsafe(cleanOrg)

  if (creditsafeResult) {
    console.log(`[credit-check] Using Tier 2 (Creditsafe) result for ${cleanOrg}`)
    const riskLevel = calculateRiskLevel(creditsafeResult.creditScore)

    return {
      orgNumber: cleanOrg,
      companyName: creditsafeResult.companyName,
      riskScore: creditsafeResult.creditScore,
      riskLevel,
      riskAssessment: getRiskAssessment(riskLevel),
      recommendation: getRiskRecommendation(riskLevel),
      checkedAt: new Date().toISOString(),
      source: 'creditsafe',
      details: {
        isActive: creditsafeResult.status !== 'Inactive' && creditsafeResult.status !== 'Dissolved',
        registrationDate: creditsafeResult.registrationDate ?? undefined,
      },
    }
  }

  // Fall back to Tier 1 (public data)
  console.log(`[credit-check] Using Tier 1 (public data) for ${cleanOrg}`)
  const publicData = await fetchBolagsverketData(cleanOrg)
  const { score, details } = calculateTier1Score(publicData)
  const riskLevel = calculateRiskLevel(score)

  return {
    orgNumber: cleanOrg,
    companyName: publicData.companyName,
    riskScore: score,
    riskLevel,
    riskAssessment: getRiskAssessment(riskLevel),
    recommendation: getRiskRecommendation(riskLevel),
    checkedAt: new Date().toISOString(),
    source: publicData.hasFSkatt || publicData.hasVat || publicData.isActive
      ? 'bolagsverket+skatteverket'
      : 'bolagsverket+skatteverket (limited data)',
    details,
  }
}
