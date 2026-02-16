// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * AI Confidence Scoring Utility
 * 
 * Calculates confidence scores for AI responses based on:
 * - Number of retrieved chunks
 * - Average similarity scores
 * - Query ambiguity indicators
 * - Source coverage
 */

export interface ConfidenceScore {
    score: number;              // 0.0 – 1.0
    level: 'high' | 'medium' | 'low';
    reasons: string[];
}

export interface ConfidenceInput {
    retrievedChunks: number;
    averageSimilarity: number;
    similarityScores: number[];
    queryLength: number;
    hasDatasetContext: boolean;
}

// Thresholds for confidence levels
const THRESHOLDS = {
    HIGH_CONFIDENCE: 0.7,
    MEDIUM_CONFIDENCE: 0.4,
    MIN_CHUNKS_HIGH: 3,
    MIN_CHUNKS_MEDIUM: 1,
    HIGH_SIMILARITY: 0.7,
    MEDIUM_SIMILARITY: 0.5,
    MIN_QUERY_LENGTH: 10,
};

/**
 * Calculate confidence score based on retrieval metrics
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceScore {
    const reasons: string[] = [];
    let score = 0.5; // Start at neutral

    // 1. Check if dataset context is being used
    if (!input.hasDatasetContext) {
        reasons.push('No dataset selected for context');
        return {
            score: 0.3,
            level: 'low',
            reasons: ['Response is based on general knowledge, not your data'],
        };
    }

    // 2. Check number of retrieved chunks
    if (input.retrievedChunks === 0) {
        reasons.push('No relevant data chunks found in dataset');
        return {
            score: 0.2,
            level: 'low',
            reasons: ['No matching data found in your dataset'],
        };
    }

    // Add points for number of chunks
    if (input.retrievedChunks >= THRESHOLDS.MIN_CHUNKS_HIGH) {
        score += 0.25;
        reasons.push(`Strong evidence: ${input.retrievedChunks} relevant sources found`);
    } else if (input.retrievedChunks >= THRESHOLDS.MIN_CHUNKS_MEDIUM) {
        score += 0.1;
        reasons.push(`Limited evidence: ${input.retrievedChunks} source(s) found`);
    } else {
        score -= 0.1;
        reasons.push('Very few data points to support answer');
    }

    // 3. Check average similarity score
    if (input.averageSimilarity >= THRESHOLDS.HIGH_SIMILARITY) {
        score += 0.25;
        reasons.push('High relevance match to your query');
    } else if (input.averageSimilarity >= THRESHOLDS.MEDIUM_SIMILARITY) {
        score += 0.1;
        reasons.push('Moderate relevance match');
    } else {
        score -= 0.15;
        reasons.push('Low relevance match to query');
    }

    // 4. Check similarity variance (consistency)
    if (input.similarityScores.length > 1) {
        const variance = calculateVariance(input.similarityScores);
        if (variance < 0.05) {
            score += 0.05;
            reasons.push('Consistent source quality');
        } else if (variance > 0.15) {
            score -= 0.05;
            reasons.push('Inconsistent source quality');
        }
    }

    // 5. Check query specificity
    if (input.queryLength < THRESHOLDS.MIN_QUERY_LENGTH) {
        score -= 0.05;
        reasons.push('Query may be too brief for precise answers');
    }

    // Clamp score to valid range
    score = Math.max(0, Math.min(1, score));

    // Determine level
    let level: 'high' | 'medium' | 'low';
    if (score >= THRESHOLDS.HIGH_CONFIDENCE) {
        level = 'high';
    } else if (score >= THRESHOLDS.MEDIUM_CONFIDENCE) {
        level = 'medium';
    } else {
        level = 'low';
    }

    return { score, level, reasons };
}

/**
 * Quick confidence calculation from search results
 */
export function calculateConfidenceFromResults(
    searchResults: { similarity: number }[],
    query: string,
    hasDatasetContext: boolean
): ConfidenceScore {
    const similarityScores = searchResults.map(r => r.similarity);
    const averageSimilarity = similarityScores.length > 0
        ? similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length
        : 0;

    return calculateConfidence({
        retrievedChunks: searchResults.length,
        averageSimilarity,
        similarityScores,
        queryLength: query.length,
        hasDatasetContext,
    });
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Generate human-readable confidence summary
 */
export function getConfidenceSummary(confidence: ConfidenceScore): string {
    switch (confidence.level) {
        case 'high':
            return 'This response is well-supported by your dataset.';
        case 'medium':
            return 'This response has partial support from your data.';
        case 'low':
            return 'This response may not be fully supported by your dataset.';
    }
}
