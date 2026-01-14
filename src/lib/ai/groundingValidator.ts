/**
 * AI Grounding Validator
 * 
 * Validates AI responses against retrieved sources to detect potential hallucinations.
 * Compares response claims vs retrieved dataset sources.
 */

export interface GroundingResult {
    isGrounded: boolean;
    groundedClaims: string[];
    ungroundedClaims: string[];
    sourceReferences: SourceReference[];
    groundingScore: number; // 0.0 – 1.0
}

export interface SourceReference {
    sourceId: string;
    content: string;
    similarity: number;
    metadata?: Record<string, any>;
    columnsReferenced: string[];
}

export interface GroundingInput {
    response: string;
    sources: Array<{
        id?: string;
        content: string;
        similarity: number;
        metadata?: Record<string, any>;
    }>;
    datasetColumns?: string[];
}

/**
 * Validate AI response against retrieved sources
 */
export function validateGrounding(input: GroundingInput): GroundingResult {
    const { response, sources, datasetColumns = [] } = input;

    // No sources = not grounded
    if (!sources || sources.length === 0) {
        return {
            isGrounded: false,
            groundedClaims: [],
            ungroundedClaims: ['Response generated without dataset evidence'],
            sourceReferences: [],
            groundingScore: 0,
        };
    }

    // Extract source references with column detection
    const sourceReferences: SourceReference[] = sources.map((source, idx) => {
        const columnsReferenced = detectColumnsInContent(source.content, datasetColumns);
        return {
            sourceId: source.id || `source-${idx + 1}`,
            content: source.content,
            similarity: source.similarity,
            metadata: source.metadata,
            columnsReferenced,
        };
    });

    // Calculate grounding score based on source quality
    const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length;
    const hasHighQualitySources = sources.some(s => s.similarity > 0.7);
    const sourceCount = sources.length;

    let groundingScore = avgSimilarity;

    // Boost score for multiple high-quality sources
    if (hasHighQualitySources) {
        groundingScore += 0.1;
    }
    if (sourceCount >= 3) {
        groundingScore += 0.1;
    }

    // Clamp to valid range
    groundingScore = Math.max(0, Math.min(1, groundingScore));

    // Extract claims from response (simplified claim detection)
    const claims = extractClaims(response);

    // Check which claims can be matched to sources
    const groundedClaims: string[] = [];
    const ungroundedClaims: string[] = [];

    for (const claim of claims) {
        const isSupported = checkClaimSupport(claim, sources);
        if (isSupported) {
            groundedClaims.push(claim);
        } else {
            ungroundedClaims.push(claim);
        }
    }

    // Response is grounded if most claims are supported
    const groundedRatio = claims.length > 0
        ? groundedClaims.length / claims.length
        : (sources.length > 0 ? 1 : 0);

    return {
        isGrounded: groundedRatio >= 0.5 && sources.length > 0,
        groundedClaims,
        ungroundedClaims,
        sourceReferences,
        groundingScore,
    };
}

/**
 * Extract column references from content
 */
function detectColumnsInContent(content: string, columns: string[]): string[] {
    const found: string[] = [];

    for (const column of columns) {
        // Case-insensitive match
        const regex = new RegExp(`\\b${escapeRegex(column)}\\b`, 'i');
        if (regex.test(content)) {
            found.push(column);
        }
    }

    return found;
}

/**
 * Extract claims from AI response (simplified)
 */
function extractClaims(response: string): string[] {
    // Split into sentences and filter out short/non-claim sentences
    const sentences = response
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && !isDisclaimer(s));

    return sentences.slice(0, 10); // Limit to first 10 claims
}

/**
 * Check if a claim is supported by any source
 */
function checkClaimSupport(claim: string, sources: Array<{ content: string }>): boolean {
    const claimWords = extractKeywords(claim);

    if (claimWords.length === 0) return true; // Empty claim = no issue

    // Check if any source contains significant overlap
    for (const source of sources) {
        const sourceWords = extractKeywords(source.content);
        const overlap = claimWords.filter(w => sourceWords.includes(w));

        // At least 30% keyword overlap suggests support
        if (overlap.length / claimWords.length >= 0.3) {
            return true;
        }
    }

    return false;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
        'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
        'during', 'before', 'after', 'above', 'below', 'between', 'under',
        'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
        'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
        'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
        'too', 'very', 's', 't', 'just', 'don', 'now', 'and', 'but', 'or',
        'if', 'because', 'until', 'while', 'about', 'against', 'this', 'that',
        'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
        'which', 'who', 'whom', 'your', 'yours', 'its', 'their', 'my', 'our',
    ]);

    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Check if text is a disclaimer/qualification
 */
function isDisclaimer(text: string): boolean {
    const disclaimerPatterns = [
        /^(please note|note that|i('m| am) not sure|i don't know|based on|according to)/i,
        /^(however|although|but|yet|nevertheless)/i,
        /(may|might|could|possibly|potentially|probably)/i,
    ];

    return disclaimerPatterns.some(pattern => pattern.test(text));
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate grounding status message for UI
 */
export function getGroundingStatusMessage(result: GroundingResult): string {
    if (!result.isGrounded) {
        return 'Based on limited dataset evidence';
    }

    if (result.groundingScore >= 0.7) {
        return `Supported by ${result.sourceReferences.length} relevant sources`;
    }

    return `Partially supported by ${result.sourceReferences.length} source(s)`;
}
