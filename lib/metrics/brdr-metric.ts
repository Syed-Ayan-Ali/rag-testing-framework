/**
 * BRDR-specific metric calculator for banking regulation documents
 * This metric is designed specifically for the BRDR dataset and schema
 */

export interface BRDRMetricConfig {
  weights: {
    semanticSimilarity: number;
    documentRelevance: number;
    conceptAccuracy: number;
    topicAlignment: number;
    keywordPresence: number;
    regulatoryCompliance: number;
    contextualCoherence: number;
  };
}

export interface BRDRAnalysis {
  documentTypes: string[];
  regulatoryTopics: string[];
  concepts: string[];
  keywords: string[];
  complianceTerms: string[];
  riskFactors: string[];
  documentReferences: string[];
  semanticClass: 'regulatory' | 'procedural' | 'informational' | 'technical' | 'mixed';
}

export interface BRDRMetricResult {
  overallScore: number;
  breakdown: {
    semanticSimilarityScore: number;
    documentRelevanceScore: number;
    conceptAccuracyScore: number;
    topicAlignmentScore: number;
    keywordPresenceScore: number;
    regulatoryComplianceScore: number;
    contextualCoherenceScore: number;
  };
  analysis: {
    expected: BRDRAnalysis;
    actual: BRDRAnalysis;
  };
  details: {
    missingConcepts: string[];
    extraConcepts: string[];
    missingTopics: string[];
    extraTopics: string[];
    missingKeywords: string[];
    extraKeywords: string[];
    semanticClassMatch: boolean;
    regulatoryTermsAlignment: number;
  };
}

export class BRDRMetricCalculator {
  private config: BRDRMetricConfig;
  
  // BRDR-specific terminology and patterns
  private readonly regulatoryTerms = [
    'supervision', 'compliance', 'regulation', 'guideline', 'policy', 'framework',
    'oversight', 'monitoring', 'assessment', 'evaluation', 'audit', 'review',
    'standard', 'requirement', 'procedure', 'process', 'control', 'governance'
  ];

  private readonly riskTerms = [
    'risk', 'exposure', 'mitigation', 'management', 'control', 'assessment',
    'monitoring', 'reporting', 'measurement', 'analysis', 'evaluation', 'treatment'
  ];

  private readonly complianceTerms = [
    'adherence', 'conformity', 'compliance', 'violation', 'breach', 'exception',
    'deviation', 'non-compliance', 'remediation', 'corrective', 'preventive'
  ];

  private readonly documentTypes = [
    'regulation', 'guideline', 'circular', 'directive', 'notice', 'instruction',
    'manual', 'handbook', 'standard', 'procedure', 'policy', 'framework'
  ];

  constructor(config?: Partial<BRDRMetricConfig>) {
    this.config = {
      weights: {
        semanticSimilarity: 0.20,
        documentRelevance: 0.15,
        conceptAccuracy: 0.15,
        topicAlignment: 0.15,
        keywordPresence: 0.10,
        regulatoryCompliance: 0.15,
        contextualCoherence: 0.10,
        ...config?.weights
      }
    };
  }

  private extractBRDRFeatures(text: string, metadata?: any): BRDRAnalysis {
    const normalizedText = text.toLowerCase();
    
    // Extract document types
    const documentTypes = this.documentTypes.filter(type =>
      new RegExp(`\\b${type}\\b`, 'i').test(text)
    );

    // Extract regulatory topics using pattern matching
    const regulatoryTopics = this.extractRegulatoryTopics(normalizedText);
    
    // Extract concepts (banking/finance specific)
    const concepts = this.extractBankingConcepts(normalizedText);
    
    // Extract keywords using frequency and domain relevance
    const keywords = this.extractDomainKeywords(normalizedText);
    
    // Extract compliance terms
    const complianceTerms = this.complianceTerms.filter(term =>
      new RegExp(`\\b${term}\\b`, 'i').test(text)
    );

    // Extract risk factors
    const riskFactors = this.riskTerms.filter(term =>
      new RegExp(`\\b${term}\\b`, 'i').test(text)
    );

    // Extract document references (simplified pattern matching)
    const documentReferences = this.extractDocumentReferences(text);

    // Classify semantic class
    const semanticClass = this.classifySemanticType(normalizedText);

    return {
      documentTypes,
      regulatoryTopics,
      concepts,
      keywords,
      complianceTerms,
      riskFactors,
      documentReferences,
      semanticClass
    };
  }

  private extractRegulatoryTopics(text: string): string[] {
    const topicPatterns = [
      // Banking specific topics
      /\b(capital\s+adequacy|capital\s+requirements?)\b/gi,
      /\b(liquidity\s+management|liquidity\s+risk)\b/gi,
      /\b(credit\s+risk|operational\s+risk|market\s+risk)\b/gi,
      /\b(basel\s+[i\d]+|basel\s+accord)\b/gi,
      /\b(stress\s+test(?:ing)?|scenario\s+analysis)\b/gi,
      /\b(anti[\-\s]money\s+laundering|aml)\b/gi,
      /\b(know\s+your\s+customer|kyc)\b/gi,
      /\b(corporate\s+governance)\b/gi,
      /\b(internal\s+controls?)\b/gi,
      /\b(risk\s+management)\b/gi,
      /\b(prudential\s+regulation)\b/gi,
      /\b(financial\s+reporting)\b/gi,
      /\b(consumer\s+protection)\b/gi,
      /\b(data\s+protection|privacy)\b/gi,
      /\b(cybersecurity|information\s+security)\b/gi
    ];

    const topics: string[] = [];
    topicPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        topics.push(...matches.map(match => match.toLowerCase().trim()));
      }
    });

    return [...new Set(topics)];
  }

  private extractBankingConcepts(text: string): string[] {
    const conceptPatterns = [
      // Financial concepts
      /\b(tier\s+\d+\s+capital|regulatory\s+capital)\b/gi,
      /\b(risk[\-\s]weighted\s+assets?|rwa)\b/gi,
      /\b(leverage\s+ratio|capital\s+ratio)\b/gi,
      /\b(provision(?:ing)?|impairment)\b/gi,
      /\b(derivative|swap|option|future)\b/gi,
      /\b(collateral|security|guarantee)\b/gi,
      /\b(exposure|counterparty|concentration)\b/gi,
      /\b(valuation|fair\s+value|mark[\-\s]to[\-\s]market)\b/gi,
      /\b(hedge|hedging|netting)\b/gi,
      /\b(maturity|duration|tenor)\b/gi
    ];

    const concepts: string[] = [];
    conceptPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        concepts.push(...matches.map(match => match.toLowerCase().trim()));
      }
    });

    return [...new Set(concepts)];
  }

  private extractDomainKeywords(text: string): string[] {
    // Extract words that are significant in banking/regulatory context
    const words = text.match(/\b\w{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};
    
    // Count frequency
    words.forEach(word => {
      const normalized = word.toLowerCase();
      if (!this.isStopWord(normalized)) {
        frequency[normalized] = (frequency[normalized] || 0) + 1;
      }
    });

    // Get top keywords with domain weighting
    const domainKeywords = Object.entries(frequency)
      .map(([word, freq]) => ({
        word,
        score: freq * this.getDomainWeight(word)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(item => item.word);

    return domainKeywords;
  }

  private extractDocumentReferences(text: string): string[] {
    const referencePatterns = [
      /\b[A-Z]{2,5}[\-\s]?\d{1,4}[\-\s]?\d{0,4}\b/g, // Document codes like BRDR-123, ABC-45-67
      /\b(?:section|clause|paragraph|article)\s+\d+(?:\.\d+)*\b/gi,
      /\b(?:appendix|annex|schedule)\s+[A-Z\d]+\b/gi
    ];

    const references: string[] = [];
    referencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        references.push(...matches.map(match => match.trim()));
      }
    });

    return [...new Set(references)];
  }

  private classifySemanticType(text: string): BRDRAnalysis['semanticClass'] {
    const regulatoryScore = this.regulatoryTerms.reduce((score, term) => 
      score + (new RegExp(`\\b${term}\\b`, 'i').test(text) ? 1 : 0), 0
    );

    const proceduralTerms = ['step', 'process', 'procedure', 'method', 'approach', 'methodology'];
    const proceduralScore = proceduralTerms.reduce((score, term) => 
      score + (new RegExp(`\\b${term}\\b`, 'i').test(text) ? 1 : 0), 0
    );

    const technicalTerms = ['system', 'model', 'calculation', 'formula', 'algorithm', 'methodology'];
    const technicalScore = technicalTerms.reduce((score, term) => 
      score + (new RegExp(`\\b${term}\\b`, 'i').test(text) ? 1 : 0), 0
    );

    if (regulatoryScore >= 3) return 'regulatory';
    if (proceduralScore >= 2) return 'procedural';
    if (technicalScore >= 2) return 'technical';
    if (regulatoryScore > 0 || proceduralScore > 0 || technicalScore > 0) return 'mixed';
    return 'informational';
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'can', 'shall', 'must', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word);
  }

  private getDomainWeight(word: string): number {
    if (this.regulatoryTerms.includes(word)) return 3;
    if (this.riskTerms.includes(word)) return 2.5;
    if (this.complianceTerms.includes(word)) return 2.5;
    if (this.documentTypes.includes(word)) return 2;
    
    // Banking-specific terms get higher weight
    const bankingTerms = [
      'bank', 'banking', 'financial', 'institution', 'credit', 'loan', 'deposit',
      'capital', 'asset', 'liability', 'equity', 'revenue', 'income', 'profit'
    ];
    if (bankingTerms.includes(word)) return 2;
    
    return 1;
  }

  private calculateArraySimilarity(expected: string[], actual: string[]): {
    score: number;
    missing: string[];
    extra: string[];
  } {
    const expectedSet = new Set(expected.map(item => item.toLowerCase()));
    const actualSet = new Set(actual.map(item => item.toLowerCase()));
    
    const intersection = new Set([...expectedSet].filter(x => actualSet.has(x)));
    const missing = [...expectedSet].filter(x => !actualSet.has(x));
    const extra = [...actualSet].filter(x => !expectedSet.has(x));
    
    const union = new Set([...expectedSet, ...actualSet]);
    const score = union.size === 0 ? 1 : intersection.size / union.size;
    
    return { score, missing, extra };
  }

  private calculateSemanticSimilarity(expected: BRDRAnalysis, actual: BRDRAnalysis): number {
    // Combine multiple features for semantic similarity
    const conceptSim = this.calculateArraySimilarity(expected.concepts, actual.concepts).score;
    const topicSim = this.calculateArraySimilarity(expected.regulatoryTopics, actual.regulatoryTopics).score;
    const keywordSim = this.calculateArraySimilarity(expected.keywords, actual.keywords).score;
    
    return (conceptSim * 0.4 + topicSim * 0.4 + keywordSim * 0.2);
  }

  calculate(expectedText: string, actualText: string, metadata?: any): BRDRMetricResult {
    const expectedAnalysis = this.extractBRDRFeatures(expectedText, metadata);
    const actualAnalysis = this.extractBRDRFeatures(actualText, metadata);

    // Calculate individual scores
    const semanticSimilarityScore = this.calculateSemanticSimilarity(expectedAnalysis, actualAnalysis);
    
    const documentRelevanceScore = this.calculateArraySimilarity(
      expectedAnalysis.documentTypes, 
      actualAnalysis.documentTypes
    ).score;

    const conceptComparison = this.calculateArraySimilarity(
      expectedAnalysis.concepts, 
      actualAnalysis.concepts
    );

    const topicComparison = this.calculateArraySimilarity(
      expectedAnalysis.regulatoryTopics, 
      actualAnalysis.regulatoryTopics
    );

    const keywordComparison = this.calculateArraySimilarity(
      expectedAnalysis.keywords, 
      actualAnalysis.keywords
    );

    const regulatoryComplianceScore = this.calculateArraySimilarity(
      [...expectedAnalysis.complianceTerms, ...expectedAnalysis.riskFactors],
      [...actualAnalysis.complianceTerms, ...actualAnalysis.riskFactors]
    ).score;

    const semanticClassMatch = expectedAnalysis.semanticClass === actualAnalysis.semanticClass;
    const contextualCoherenceScore = semanticClassMatch ? 1 : 0.5;

    // Calculate regulatory terms alignment
    const expectedRegTerms = [...expectedAnalysis.complianceTerms, ...expectedAnalysis.riskFactors];
    const actualRegTerms = [...actualAnalysis.complianceTerms, ...actualAnalysis.riskFactors];
    const regulatoryTermsAlignment = expectedRegTerms.length === 0 ? 1 : 
      actualRegTerms.filter(term => expectedRegTerms.includes(term)).length / expectedRegTerms.length;

    // Calculate weighted overall score
    const breakdown = {
      semanticSimilarityScore,
      documentRelevanceScore,
      conceptAccuracyScore: conceptComparison.score,
      topicAlignmentScore: topicComparison.score,
      keywordPresenceScore: keywordComparison.score,
      regulatoryComplianceScore,
      contextualCoherenceScore
    };

    const overallScore = 
      breakdown.semanticSimilarityScore * this.config.weights.semanticSimilarity +
      breakdown.documentRelevanceScore * this.config.weights.documentRelevance +
      breakdown.conceptAccuracyScore * this.config.weights.conceptAccuracy +
      breakdown.topicAlignmentScore * this.config.weights.topicAlignment +
      breakdown.keywordPresenceScore * this.config.weights.keywordPresence +
      breakdown.regulatoryComplianceScore * this.config.weights.regulatoryCompliance +
      breakdown.contextualCoherenceScore * this.config.weights.contextualCoherence;

    return {
      overallScore: Math.max(0, Math.min(1, overallScore)),
      breakdown,
      analysis: {
        expected: expectedAnalysis,
        actual: actualAnalysis
      },
      details: {
        missingConcepts: conceptComparison.missing,
        extraConcepts: conceptComparison.extra,
        missingTopics: topicComparison.missing,
        extraTopics: topicComparison.extra,
        missingKeywords: keywordComparison.missing,
        extraKeywords: keywordComparison.extra,
        semanticClassMatch,
        regulatoryTermsAlignment
      }
    };
  }

  updateWeights(newWeights: Partial<BRDRMetricConfig['weights']>): void {
    this.config.weights = { ...this.config.weights, ...newWeights };
  }

  getConfig(): BRDRMetricConfig {
    return { ...this.config };
  }
}
