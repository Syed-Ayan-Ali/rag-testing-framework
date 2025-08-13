import { DatabaseConnection, TableInfo } from '../database/connection';
import { EmbeddingGenerator, ColumnCombination, TrainingData, EmbeddingConfig } from '../embeddings/embedding-generator';
import { SQLMetricCalculator, SQLMetricResult } from '../metrics/sql-metric';
import { BRDRMetricCalculator, BRDRMetricResult } from '../metrics/brdr-metric';
import { v4 as uuidv4 } from 'uuid';

export interface TestConfiguration {
  tableId: string;
  tableName: string;
  selectedColumns: string[];
  yColumn: string;
  queryColumn: string;
  answerColumn: string;
  embeddingConfig: EmbeddingConfig;
  metricType: 'sql' | 'brdr';
  trainingRatio: number; // 0.8 for 80/20 split
  testName: string;
}

export interface TestResult {
  id: string;
  testName: string;
  timestamp: Date;
  configuration: TestConfiguration;
  combination: ColumnCombination;
  results: {
    sql?: SQLMetricResult[];
    brdr?: BRDRMetricResult[];
  };
  averageScore: number;
  totalTests: number;
  processingTime: number;
  embeddingStats: {
    trainingEmbeddings: number;
    testQueries: number;
    averageSimilarity: number;
  };
}

export interface TestSummary {
  testId: string;
  combination: ColumnCombination;
  averageScore: number;
  totalTests: number;
  bestResult: any;
  worstResult: any;
}

export interface ExperimentResults {
  experimentId: string;
  testName: string;
  timestamp: Date;
  configuration: TestConfiguration;
  allResults: TestResult[];
  summary: {
    bestCombination: ColumnCombination;
    bestScore: number;
    worstCombination: ColumnCombination;
    worstScore: number;
    averageScore: number;
    totalCombinations: number;
  };
  processingTime: number;
}

export class RAGTestingFramework {
  private db: DatabaseConnection;
  private embeddingGenerator: EmbeddingGenerator;
  private sqlMetricCalculator: SQLMetricCalculator;
  private brdrMetricCalculator: BRDRMetricCalculator;

  constructor(
    dbConnection: DatabaseConnection,
    embeddingConfig: EmbeddingConfig
  ) {
    this.db = dbConnection;
    this.embeddingGenerator = new EmbeddingGenerator(embeddingConfig);
    this.sqlMetricCalculator = new SQLMetricCalculator();
    this.brdrMetricCalculator = new BRDRMetricCalculator();
  }

  async initialize(): Promise<void> {
    await this.embeddingGenerator.initialize();
  }

  async getAvailableTables(): Promise<TableInfo[]> {
    const tableNames = await this.db.getTables();
    const tableInfos: TableInfo[] = [];

    for (const tableName of tableNames) {
      const info = await this.db.getTableInfo(tableName);
      if (info) {
        tableInfos.push(info);
      }
    }

    return tableInfos;
  }

  async runFullExperiment(config: TestConfiguration): Promise<ExperimentResults> {
    const experimentId = uuidv4();
    const startTime = Date.now();

    console.log(`Starting experiment: ${config.testName}`);
    console.log(`Table: ${config.tableName}`);
    console.log(`Columns: ${config.selectedColumns.join(', ')}`);

    // Generate all column combinations
    const combinations = this.embeddingGenerator.generateColumnCombinations(config.selectedColumns);
    console.log(`Generated ${combinations.length} column combinations`);

    const allResults: TestResult[] = [];

    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i];
      console.log(`\nTesting combination ${i + 1}/${combinations.length}: ${combination.name}`);

      try {
        const result = await this.runSingleTest(config, combination);
        allResults.push(result);
        
        console.log(`Combination "${combination.name}" - Average Score: ${result.averageScore.toFixed(3)}`);
      } catch (error) {
        console.error(`Failed to test combination "${combination.name}":`, error);
        continue;
      }
    }

    // Calculate summary statistics
    const scores = allResults.map(r => r.averageScore);
    const bestResult = allResults.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );
    const worstResult = allResults.reduce((worst, current) => 
      current.averageScore < worst.averageScore ? current : worst
    );

    const summary = {
      bestCombination: bestResult.combination,
      bestScore: bestResult.averageScore,
      worstCombination: worstResult.combination,
      worstScore: worstResult.averageScore,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      totalCombinations: allResults.length
    };

    const processingTime = Date.now() - startTime;

    return {
      experimentId,
      testName: config.testName,
      timestamp: new Date(),
      configuration: config,
      allResults,
      summary,
      processingTime
    };
  }

  async runSingleTest(config: TestConfiguration, combination: ColumnCombination): Promise<TestResult> {
    const testId = uuidv4();
    const startTime = Date.now();

    // Fetch data from the table
    const data = await this.db.getTableData(config.tableName);
    
    if (data.length === 0) {
      throw new Error(`No data found in table ${config.tableName}`);
    }

    // Split data into training and testing
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * config.trainingRatio);
    const trainingData = shuffled.slice(0, splitIndex);
    const testingData = shuffled.slice(splitIndex);

    console.log(`Split data: ${trainingData.length} training, ${testingData.length} testing`);

    // Generate embeddings for training data
    console.log('Generating training embeddings...');
    const trainingEmbeddings = await this.embeddingGenerator.processTrainingData(
      trainingData,
      combination,
      config.yColumn
    );

    // Process test queries
    console.log('Processing test queries...');
    const results: any[] = [];
    let totalSimilarity = 0;

    for (let i = 0; i < testingData.length; i++) {
      const testRow = testingData[i];
      const query = testRow[config.queryColumn];
      const expectedAnswer = testRow[config.answerColumn];

      if (!query || !expectedAnswer) {
        console.warn(`Skipping test row ${i} - missing query or answer`);
        continue;
      }

      try {
        // Find best match from training data
        const matches = await this.embeddingGenerator.processQuery(
          query,
          trainingEmbeddings,
          1
        );

        if (matches.length === 0) {
          console.warn(`No matches found for query: ${query.substring(0, 50)}...`);
          continue;
        }

        const bestMatch = matches[0];
        const actualAnswer = bestMatch.result.yValue;
        totalSimilarity += bestMatch.similarity;

        // Calculate metric based on type
        let metricResult: any;
        if (config.metricType === 'sql') {
          metricResult = this.sqlMetricCalculator.calculate(expectedAnswer, actualAnswer);
        } else {
          metricResult = this.brdrMetricCalculator.calculate(expectedAnswer, actualAnswer);
        }

        results.push({
          testIndex: i,
          query,
          expectedAnswer,
          actualAnswer,
          similarity: bestMatch.similarity,
          metricResult,
          score: metricResult.overallScore
        });

        // Progress logging
        if ((i + 1) % 10 === 0) {
          console.log(`Processed ${i + 1}/${testingData.length} test queries`);
        }

      } catch (error) {
        console.error(`Failed to process test query ${i}:`, error);
        continue;
      }
    }

    // Calculate averages
    const averageScore = results.length > 0 ? 
      results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
    const averageSimilarity = results.length > 0 ? totalSimilarity / results.length : 0;

    const processingTime = Date.now() - startTime;

    return {
      id: testId,
      testName: config.testName,
      timestamp: new Date(),
      configuration: config,
      combination,
      results: {
        [config.metricType]: results.map(r => r.metricResult)
      },
      averageScore,
      totalTests: results.length,
      processingTime,
      embeddingStats: {
        trainingEmbeddings: trainingEmbeddings.embeddings.length,
        testQueries: results.length,
        averageSimilarity
      }
    };
  }

  async validateConfiguration(config: TestConfiguration): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if table exists
    const tableInfo = await this.db.getTableInfo(config.tableName);
    if (!tableInfo) {
      errors.push(`Table "${config.tableName}" not found`);
      return { isValid: false, errors, warnings };
    }

    const columnNames = tableInfo.columns.map(col => col.column_name);

    // Check if selected columns exist
    for (const column of config.selectedColumns) {
      if (!columnNames.includes(column)) {
        errors.push(`Column "${column}" not found in table "${config.tableName}"`);
      }
    }

    // Check if y column exists
    if (!columnNames.includes(config.yColumn)) {
      errors.push(`Y column "${config.yColumn}" not found in table "${config.tableName}"`);
    }

    // Check if query and answer columns exist
    if (!columnNames.includes(config.queryColumn)) {
      errors.push(`Query column "${config.queryColumn}" not found in table "${config.tableName}"`);
    }

    if (!columnNames.includes(config.answerColumn)) {
      errors.push(`Answer column "${config.answerColumn}" not found in table "${config.tableName}"`);
    }

    // Check if selected columns are reasonable
    if (config.selectedColumns.length === 0) {
      errors.push('At least one column must be selected for embeddings');
    }

    if (config.selectedColumns.length > 5) {
      warnings.push('More than 5 columns selected - this may result in many combinations and slow processing');
    }

    // Check training ratio
    if (config.trainingRatio <= 0 || config.trainingRatio >= 1) {
      errors.push('Training ratio must be between 0 and 1');
    }

    // Check if table has enough data
    if (tableInfo.rowCount < 10) {
      warnings.push('Table has very few rows - results may not be reliable');
    }

    const minTestSize = Math.ceil(tableInfo.rowCount * (1 - config.trainingRatio));
    if (minTestSize < 5) {
      warnings.push('Test set will be very small - consider adjusting training ratio');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Utility methods for analysis
  async getColumnDataTypes(tableName: string): Promise<Record<string, string>> {
    const tableInfo = await this.db.getTableInfo(tableName);
    if (!tableInfo) return {};

    return tableInfo.columns.reduce((acc, col) => {
      acc[col.column_name] = col.data_type;
      return acc;
    }, {} as Record<string, string>);
  }

  async getSampleData(tableName: string, limit: number = 5): Promise<any[]> {
    return this.db.getTableData(tableName, ['*'], limit);
  }

  // Export/Import functionality
  exportResults(results: ExperimentResults): string {
    return JSON.stringify(results, null, 2);
  }

  importResults(jsonString: string): ExperimentResults {
    return JSON.parse(jsonString);
  }
}
