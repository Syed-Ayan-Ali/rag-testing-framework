import { parse } from 'sql-parser-cst';

export interface SQLMetricConfig {
  weights: {
    tables: number;
    columns: number;
    joins: number;
    syntax: number;
    keywords: number;
    differences: number;
  };
}

export interface SQLAnalysis {
  tables: string[];
  columns: string[];
  joins: string[];
  keywords: string[];
  isValid: boolean;
  syntaxErrors: string[];
}

export interface SQLMetricResult {
  overallScore: number;
  breakdown: {
    tablesScore: number;
    columnsScore: number;
    joinsScore: number;
    syntaxScore: number;
    keywordsScore: number;
    differencesScore: number;
  };
  analysis: {
    expected: SQLAnalysis;
    actual: SQLAnalysis;
  };
  details: {
    missingTables: string[];
    extraTables: string[];
    missingColumns: string[];
    extraColumns: string[];
    missingJoins: string[];
    extraJoins: string[];
    missingKeywords: string[];
    extraKeywords: string[];
  };
}

export class SQLMetricCalculator {
  private config: SQLMetricConfig;

  constructor(config?: Partial<SQLMetricConfig>) {
    this.config = {
      weights: {
        tables: 0.25,
        columns: 0.25,
        joins: 0.20,
        syntax: 0.15,
        keywords: 0.10,
        differences: 0.05,
        ...config?.weights
      }
    };
  }

  private extractSQL(query: string): string {
    // Clean and normalize the SQL query
    return query
      .replace(/\s+/g, ' ')
      .replace(/;$/, '')
      .trim()
      .toLowerCase();
  }

  private analyzeSQL(query: string): SQLAnalysis {
    const analysis: SQLAnalysis = {
      tables: [],
      columns: [],
      joins: [],
      keywords: [],
      isValid: true,
      syntaxErrors: []
    };

    try {
      const cleanQuery = this.extractSQL(query);
      
      // Try to parse with sql-parser-cst
      try {
        const ast = parse(cleanQuery);
        analysis.isValid = true;
        
        // Extract information from AST
        this.extractFromAST(ast, analysis);
      } catch (parseError) {
        analysis.isValid = false;
        analysis.syntaxErrors.push(parseError instanceof Error ? parseError.message : 'Unknown parse error');
        
        // Fallback to regex-based extraction
        this.extractWithRegex(cleanQuery, analysis);
      }

      // Extract SQL keywords
      analysis.keywords = this.extractKeywords(cleanQuery);

    } catch (error) {
      analysis.isValid = false;
      analysis.syntaxErrors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return analysis;
  }

  private extractFromAST(ast: any, analysis: SQLAnalysis): void {
    // This is a simplified AST traversal
    // In a real implementation, you'd need more sophisticated AST walking
    const astString = JSON.stringify(ast).toLowerCase();
    
    // Extract table names (simplified)
    const tableMatches = astString.match(/"([a-zA-Z_][a-zA-Z0-9_]*)"(?=.*"table")/g);
    if (tableMatches) {
      analysis.tables = [...new Set(tableMatches.map(m => m.replace(/"/g, '')))];
    }

    // Extract column names (simplified)
    const columnMatches = astString.match(/"([a-zA-Z_][a-zA-Z0-9_]*)"(?=.*"column")/g);
    if (columnMatches) {
      analysis.columns = [...new Set(columnMatches.map(m => m.replace(/"/g, '')))];
    }
  }

  private extractWithRegex(query: string, analysis: SQLAnalysis): void {
    // Extract tables using regex patterns
    const fromPattern = /from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    const joinPattern = /join\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    const updatePattern = /update\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    const insertPattern = /into\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;

    const tables = new Set<string>();
    
    let match;
    while ((match = fromPattern.exec(query)) !== null) {
      tables.add(match[1].toLowerCase());
    }
    while ((match = joinPattern.exec(query)) !== null) {
      tables.add(match[1].toLowerCase());
    }
    while ((match = updatePattern.exec(query)) !== null) {
      tables.add(match[1].toLowerCase());
    }
    while ((match = insertPattern.exec(query)) !== null) {
      tables.add(match[1].toLowerCase());
    }

    analysis.tables = Array.from(tables);

    // Extract joins
    const joinTypes = ['inner join', 'left join', 'right join', 'full join', 'cross join', 'join'];
    analysis.joins = joinTypes.filter(joinType => 
      query.includes(joinType)
    );

    // Extract columns (simplified - this would need more sophisticated parsing)
    const selectPattern = /select\s+(.*?)\s+from/gi;
    const selectMatch = selectPattern.exec(query);
    if (selectMatch) {
      const columnsPart = selectMatch[1];
      if (columnsPart !== '*') {
        analysis.columns = columnsPart
          .split(',')
          .map(col => col.trim().replace(/.*\./, '').replace(/\s+as\s+.*/, ''))
          .filter(col => col && col !== '*');
      }
    }
  }

  private extractKeywords(query: string): string[] {
    const sqlKeywords = [
      'select', 'from', 'where', 'join', 'inner', 'left', 'right', 'full', 'cross',
      'on', 'group', 'by', 'having', 'order', 'limit', 'offset', 'union', 'except',
      'intersect', 'insert', 'update', 'delete', 'create', 'drop', 'alter', 'index',
      'view', 'distinct', 'count', 'sum', 'avg', 'min', 'max', 'case', 'when', 'then',
      'else', 'end', 'and', 'or', 'not', 'in', 'exists', 'like', 'between', 'is', 'null'
    ];

    return sqlKeywords.filter(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(query)
    );
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

  calculate(expectedSQL: string, actualSQL: string): SQLMetricResult {
    const expectedAnalysis = this.analyzeSQL(expectedSQL);
    const actualAnalysis = this.analyzeSQL(actualSQL);

    // Calculate individual scores
    const tablesComparison = this.calculateArraySimilarity(
      expectedAnalysis.tables, 
      actualAnalysis.tables
    );
    const columnsComparison = this.calculateArraySimilarity(
      expectedAnalysis.columns, 
      actualAnalysis.columns
    );
    const joinsComparison = this.calculateArraySimilarity(
      expectedAnalysis.joins, 
      actualAnalysis.joins
    );
    const keywordsComparison = this.calculateArraySimilarity(
      expectedAnalysis.keywords, 
      actualAnalysis.keywords
    );

    // Syntax score
    const syntaxScore = actualAnalysis.isValid ? 1 : 0;

    // Differences score (lower differences = higher score)
    const totalDifferences = 
      tablesComparison.missing.length + tablesComparison.extra.length +
      columnsComparison.missing.length + columnsComparison.extra.length +
      joinsComparison.missing.length + joinsComparison.extra.length +
      keywordsComparison.missing.length + keywordsComparison.extra.length;
    
    const differencesScore = Math.max(0, 1 - (totalDifferences * 0.1));

    // Calculate weighted overall score
    const breakdown = {
      tablesScore: tablesComparison.score,
      columnsScore: columnsComparison.score,
      joinsScore: joinsComparison.score,
      syntaxScore,
      keywordsScore: keywordsComparison.score,
      differencesScore
    };

    const overallScore = 
      breakdown.tablesScore * this.config.weights.tables +
      breakdown.columnsScore * this.config.weights.columns +
      breakdown.joinsScore * this.config.weights.joins +
      breakdown.syntaxScore * this.config.weights.syntax +
      breakdown.keywordsScore * this.config.weights.keywords +
      breakdown.differencesScore * this.config.weights.differences;

    return {
      overallScore: Math.max(0, Math.min(1, overallScore)),
      breakdown,
      analysis: {
        expected: expectedAnalysis,
        actual: actualAnalysis
      },
      details: {
        missingTables: tablesComparison.missing,
        extraTables: tablesComparison.extra,
        missingColumns: columnsComparison.missing,
        extraColumns: columnsComparison.extra,
        missingJoins: joinsComparison.missing,
        extraJoins: joinsComparison.extra,
        missingKeywords: keywordsComparison.missing,
        extraKeywords: keywordsComparison.extra
      }
    };
  }

  updateWeights(newWeights: Partial<SQLMetricConfig['weights']>): void {
    this.config.weights = { ...this.config.weights, ...newWeights };
  }

  getConfig(): SQLMetricConfig {
    return { ...this.config };
  }
}
