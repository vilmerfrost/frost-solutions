// app/lib/ocr/matching/fuzzyMatcher.ts

/**
 * Optimized Fuzzy Matching Algorithm
 * Based on Deepseek implementation with multi-stage matching
 */

import type { ProjectMatchResult } from '@/types/ocr';

/**
 * Optimized Levenshtein distance with early termination
 * Time Complexity: O(min(n,m)*k) where k is maxDistance
 */
export class OptimizedFuzzyMatcher {
  private static readonly MAX_DISTANCE_CACHE = new Map<string, number>();
  private static readonly NORMALIZATION_CACHE = new Map<string, string>();

  /**
   * Calculate Levenshtein distance with early termination
   */
  static levenshteinDistance(
    a: string,
    b: string,
    maxDistance: number = 5
  ): number {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > maxDistance) return Infinity;

    // Ensure a is shorter to minimize space
    if (a.length > b.length) [a, b] = [b, a];

    const cacheKey = `${a}|${b}|${maxDistance}`;
    if (this.MAX_DISTANCE_CACHE.has(cacheKey)) {
      return this.MAX_DISTANCE_CACHE.get(cacheKey)!;
    }

    let previousRow = Array.from({ length: a.length + 1 }, (_, i) => i);
    let currentRow = new Array(a.length + 1);

    for (let j = 1; j <= b.length; j++) {
      currentRow[0] = j;
      let minInRow = j;

      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        currentRow[i] = Math.min(
          previousRow[i] + 1,     // deletion
          currentRow[i - 1] + 1,  // insertion
          previousRow[i - 1] + cost // substitution
        );
        minInRow = Math.min(minInRow, currentRow[i]);
      }

      // Early termination
      if (minInRow > maxDistance) {
        this.MAX_DISTANCE_CACHE.set(cacheKey, Infinity);
        return Infinity;
      }

      [previousRow, currentRow] = [currentRow, previousRow];
    }

    const result = previousRow[a.length];
    this.MAX_DISTANCE_CACHE.set(cacheKey, result);
    return result;
  }

  /**
   * Normalize string with caching
   */
  static normalizeString(str: string): string {
    if (this.NORMALIZATION_CACHE.has(str)) {
      return this.NORMALIZATION_CACHE.get(str)!;
    }

    const normalized = str
      .toLowerCase()
      .trim()
      .replace(/[^\w\såäö]/gi, '')
      .replace(/\s+/g, ' ');

    this.NORMALIZATION_CACHE.set(str, normalized);
    return normalized;
  }

  /**
   * Calculate similarity score (0-1)
   */
  static similarityScore(a: string, b: string): number {
    const distance = this.levenshteinDistance(a, b, 10);
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }
}

/**
 * Multi-stage project matcher
 * Uses optimized matching pipeline
 */
export class MultiStageProjectMatcher {
  private projectCache = new Map<string, any[]>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  /**
   * Find best project match using multi-stage approach
   */
  async findBestMatch(
    ocrData: {
      projectReference?: string;
      supplierName: string;
      invoiceDate?: string;
      totalAmount?: number;
    },
    tenantId: string,
    projects: Array<{
      id: string;
      name: string;
      project_number?: string;
      external_reference?: string;
      start_date?: string;
      end_date?: string;
      customer_id?: string;
    }>
  ): Promise<ProjectMatchResult | null> {
    if (!projects || projects.length === 0) {
      return null;
    }

    // Stage 1: Exact project number match (O(1) with Map)
    if (ocrData.projectReference) {
      const projectNumberMap = this.buildProjectNumberMap(projects);
      const exactMatch = projectNumberMap.get(
        OptimizedFuzzyMatcher.normalizeString(ocrData.projectReference)
      );
      if (exactMatch) {
        return {
          projectId: exactMatch.id,
          projectName: exactMatch.name,
          projectNumber: exactMatch.project_number,
          confidence: 95,
          matchReason: 'Exact project reference match',
          stage: 1,
        };
      }
    }

    // Stage 2: Fuzzy project number match
    if (ocrData.projectReference) {
      const fuzzyMatch = await this.fuzzyProjectNumberMatch(
        ocrData.projectReference,
        projects
      );
      if (fuzzyMatch && fuzzyMatch.confidence > 85) {
        return { ...fuzzyMatch, stage: 2 };
      }
    }

    // Stage 3: Fuzzy project name match
    const fuzzyNameMatch = await this.fuzzyProjectNameMatch(
      ocrData.supplierName,
      projects
    );
    if (fuzzyNameMatch && fuzzyNameMatch.confidence > 80) {
      return { ...fuzzyNameMatch, stage: 3 };
    }

    // Stage 4: Date range matching
    if (ocrData.invoiceDate) {
      const dateMatch = await this.dateRangeMatch(
        ocrData.invoiceDate,
        projects
      );
      if (dateMatch && dateMatch.confidence > 75) {
        return { ...dateMatch, stage: 4 };
      }
    }

    // Stage 5: Supplier history matching (would need supplier data)
    // This is handled in the database function

    return null;
  }

  private buildProjectNumberMap(projects: any[]): Map<string, any> {
    const map = new Map<string, any>();
    for (const project of projects) {
      const normalized = OptimizedFuzzyMatcher.normalizeString(
        project.project_number || ''
      );
      map.set(normalized, project);
      // Also add variations
      map.set(normalized.replace(/\s+/g, ''), project);
      map.set(normalized.replace(/[^a-zA-Z0-9]/g, ''), project);
    }
    return map;
  }

  private async fuzzyProjectNumberMatch(
    searchNumber: string,
    projects: any[]
  ): Promise<ProjectMatchResult | null> {
    const normalizedSearch = OptimizedFuzzyMatcher.normalizeString(searchNumber);
    let bestMatch: any = null;
    let bestScore = 0;

    // Only check projects with similar length first
    const candidates = projects.filter(
      (p) =>
        Math.abs(
          (p.project_number || '').length - normalizedSearch.length
        ) <= 2
    );

    for (const project of candidates) {
      const normalizedProject = OptimizedFuzzyMatcher.normalizeString(
        project.project_number || ''
      );
      const score = OptimizedFuzzyMatcher.similarityScore(
        normalizedSearch,
        normalizedProject
      );

      if (score > bestScore && score > 0.85) {
        bestScore = score;
        bestMatch = project;

        // Early exit if very good match
        if (score > 0.95) break;
      }
    }

    if (bestMatch && bestScore > 0.85) {
      return {
        projectId: bestMatch.id,
        projectName: bestMatch.name,
        projectNumber: bestMatch.project_number,
        confidence: Math.round(bestScore * 100),
        matchReason: `Fuzzy project number match (${Math.round(bestScore * 100)}%)`,
        stage: 2,
      };
    }

    return null;
  }

  private async fuzzyProjectNameMatch(
    searchName: string,
    projects: any[]
  ): Promise<ProjectMatchResult | null> {
    const normalizedSearch = OptimizedFuzzyMatcher.normalizeString(searchName);
    let bestMatch: any = null;
    let bestScore = 0;

    for (const project of projects) {
      const normalizedProject = OptimizedFuzzyMatcher.normalizeString(
        project.name || ''
      );
      const score = OptimizedFuzzyMatcher.similarityScore(
        normalizedSearch,
        normalizedProject
      );

      if (score > bestScore && score > 0.80) {
        bestScore = score;
        bestMatch = project;
      }
    }

    if (bestMatch && bestScore > 0.80) {
      return {
        projectId: bestMatch.id,
        projectName: bestMatch.name,
        projectNumber: bestMatch.project_number,
        confidence: Math.round(bestScore * 100),
        matchReason: `Fuzzy project name match (${Math.round(bestScore * 100)}%)`,
        stage: 3,
      };
    }

    return null;
  }

  private async dateRangeMatch(
    invoiceDate: string,
    projects: any[]
  ): Promise<ProjectMatchResult | null> {
    const date = new Date(invoiceDate);
    let bestMatch: any = null;
    let bestScore = 0;

    for (const project of projects) {
      if (!project.start_date) continue;

      const startDate = new Date(project.start_date);
      const endDate = project.end_date ? new Date(project.end_date) : new Date();

      let score = 0;
      if (date >= startDate && date <= endDate) {
        score = 0.75; // Within project period
      } else if (date > endDate) {
        // Recent projects might still be relevant
        const daysSinceEnd = Math.floor(
          (date.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceEnd <= 30) {
          score = 0.60 - daysSinceEnd / 100; // Decreasing score
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = project;
      }
    }

    if (bestMatch && bestScore > 0.60) {
      return {
        projectId: bestMatch.id,
        projectName: bestMatch.name,
        projectNumber: bestMatch.project_number,
        confidence: Math.round(bestScore * 100),
        matchReason: 'Invoice date within project period',
        stage: 4,
      };
    }

    return null;
  }
}

