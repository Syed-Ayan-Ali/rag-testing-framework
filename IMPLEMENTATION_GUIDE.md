# RAG Testing Framework - Implementation Guide

## Overview

The RAG Testing Framework is a comprehensive TypeScript-based system designed to test and optimize embedding combinations for RAG (Retrieval-Augmented Generation) applications. It provides a systematic approach to evaluate different embedding strategies and identify the most effective combinations for your specific use case.

## Architecture

### Core Components

1. **Database Connection Layer** (`lib/database/connection.ts`)
   - Manages connections to Supabase PostgreSQL databases
   - Provides table discovery and data retrieval functionality
   - Handles raw SQL query execution

2. **Embedding Generation System** (`lib/embeddings/embedding-generator.ts`)
   - Supports both OpenAI and local (HuggingFace) embedding models
   - Generates all possible column combinations (up to 5 columns)
   - Processes training data and creates embeddings
   - Implements cosine similarity for retrieval

3. **Metric Calculation Systems**
   - **SQL Metric** (`lib/metrics/sql-metric.ts`): For SQL query comparison
   - **BRDR Metric** (`lib/metrics/brdr-metric.ts`): For banking regulation documents

4. **Core Testing Framework** (`lib/core/testing-framework.ts`)
   - Orchestrates the entire testing process
   - Manages data splitting (80/20 training/testing)
   - Runs experiments across all column combinations
   - Generates comprehensive results

5. **API Layer** (`app/api/`)
   - RESTful endpoints for database operations
   - Test configuration validation
   - Test execution endpoints

6. **UI Components** (`components/`)
   - React-based user interface
   - Database connection wizard
   - Table selection and configuration
   - Results dashboard with visualizations

## Getting Started

### Prerequisites

1. Node.js 18+ and npm
2. Supabase database with read access
3. (Optional) OpenAI API key for OpenAI embeddings

### Installation

1. Clone and navigate to the project:
   ```bash
   cd rag-testing-framework
   npm install
   ```

2. Set up environment variables (create `.env.local`):
   ```env
   # Optional: for OpenAI embeddings
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Basic Usage

1. **Connect to Database**: Enter your Supabase URL and anonymous key
2. **Select Table**: Choose a table containing your test data
3. **Configure Test**: 
   - Select up to 5 columns for embedding combinations
   - Choose Y column (target/expected output)
   - Select query and answer columns for testing
   - Configure embedding model and metric type
4. **Run Test**: Execute the experiment across all combinations
5. **View Results**: Analyze performance metrics and identify best combinations

## Data Requirements

### Table Structure

Your table should contain:
- **Embedding Columns**: 1-5 columns containing text/data for embedding
- **Y Column**: Target column containing expected outputs
- **Query Column**: Column containing test queries
- **Answer Column**: Column containing expected answers

### Example Schema

```sql
CREATE TABLE test_data (
  id SERIAL PRIMARY KEY,
  -- Embedding columns (choose up to 5)
  title TEXT,
  description TEXT,
  content TEXT,
  metadata JSONB,
  category TEXT,
  
  -- Target column (Y column)
  expected_result TEXT,
  
  -- Test columns
  user_query TEXT,
  correct_answer TEXT
);
```

## Metric Models

### SQL Metric Model

Designed for comparing SQL queries with 6 indicators:
1. **Tables Presence** (25%): All required tables present
2. **Columns Presence** (25%): All required columns present  
3. **Joins Presence** (20%): Correct join operations
4. **Syntax Validity** (15%): Query is parseable and valid
5. **Keywords Presence** (10%): SQL keywords correctly used
6. **Differences Penalty** (5%): Negative weight for differences

### BRDR Metric Model

Specialized for banking regulation documents with 7 indicators:
1. **Semantic Similarity** (20%): Overall content similarity
2. **Document Relevance** (15%): Document type and context relevance
3. **Concept Accuracy** (15%): Banking/regulatory concept alignment
4. **Topic Alignment** (15%): Regulatory topic matching
5. **Keyword Presence** (10%): Domain-specific keyword matching
6. **Regulatory Compliance** (15%): Compliance term accuracy
7. **Contextual Coherence** (10%): Overall context coherence

## API Reference

### Database Operations

#### Connect to Database
```http
POST /api/tables
Content-Type: application/json

{
  "url": "https://your-project.supabase.co",
  "anonKey": "your-anon-key"
}
```

#### Get Table Information
```http
POST /api/table-info
Content-Type: application/json

{
  "url": "https://your-project.supabase.co",
  "anonKey": "your-anon-key",
  "tableName": "your_table"
}
```

### Test Operations

#### Validate Configuration
```http
POST /api/test/validate
Content-Type: application/json

{
  "dbConfig": {
    "url": "https://your-project.supabase.co",
    "anonKey": "your-anon-key"
  },
  "testConfig": {
    "tableName": "test_data",
    "selectedColumns": ["title", "description"],
    "yColumn": "expected_result",
    "queryColumn": "user_query",
    "answerColumn": "correct_answer",
    "embeddingConfig": {
      "model": "local",
      "localModel": "Xenova/all-MiniLM-L6-v2"
    },
    "metricType": "brdr",
    "trainingRatio": 0.8,
    "testName": "My Test"
  }
}
```

#### Run Test
```http
POST /api/test/run
Content-Type: application/json

{
  "dbConfig": { /* same as above */ },
  "testConfig": { /* same as above */ }
}
```

## Extension Points

### Adding New Metric Models

1. Create a new metric class in `lib/metrics/`:
   ```typescript
   export class CustomMetricCalculator {
     calculate(expected: string, actual: string): CustomMetricResult {
       // Your metric logic here
     }
   }
   ```

2. Update the testing framework to include your metric:
   ```typescript
   // In lib/core/testing-framework.ts
   private customMetricCalculator: CustomMetricCalculator;
   ```

3. Add UI option in `TestConfiguration.tsx`

### Adding New Embedding Models

1. Extend the `EmbeddingGenerator` class:
   ```typescript
   // In lib/embeddings/embedding-generator.ts
   async generateEmbedding(text: string): Promise<number[]> {
     if (this.config.model === 'custom') {
       // Your custom embedding logic
     }
     // ... existing logic
   }
   ```

2. Update the configuration interface and UI

### Adding New Data Sources

1. Create a new connection class:
   ```typescript
   export class CustomDatabaseConnection {
     // Implement similar interface to DatabaseConnection
   }
   ```

2. Update the UI to support the new connection type

## Performance Considerations

### Optimization Tips

1. **Data Size**: Start with smaller datasets (< 1000 rows) for initial testing
2. **Column Selection**: Limit to most relevant columns to reduce processing time
3. **Local vs OpenAI**: Local embeddings are free but slower; OpenAI is faster but costs money
4. **Batch Processing**: The framework processes embeddings in batches for efficiency

### Scaling

- **Horizontal**: Run multiple instances for different tables/datasets
- **Vertical**: Use more powerful hardware for local embedding generation
- **Cloud**: Consider cloud embedding services for large-scale testing

## Troubleshooting

### Common Issues

1. **Connection Failures**: Check Supabase URL and key, ensure database is accessible
2. **Memory Issues**: Reduce data size or use smaller embedding models
3. **Slow Performance**: Use OpenAI embeddings or reduce column combinations
4. **API Timeouts**: Implement request timeouts and retry logic

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Future Development Roadmap

### Phase 1 (Current)
- ✅ Basic embedding testing framework
- ✅ SQL and BRDR metric models
- ✅ Web interface
- ✅ Local and OpenAI embedding support

### Phase 2 (Next)
- [ ] Custom metric model builder
- [ ] Advanced visualization and analytics
- [ ] Batch testing across multiple tables
- [ ] Performance optimization tools
- [ ] Export/import test configurations

### Phase 3 (Future)
- [ ] Integration with popular RAG frameworks
- [ ] Automated hyperparameter tuning
- [ ] A/B testing capabilities
- [ ] Real-time monitoring dashboard
- [ ] Cloud deployment templates

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Submit a pull request

### Code Standards

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add comprehensive error handling
- Include unit tests for new functionality
- Document public APIs and complex logic

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "EmbeddingGenerator"

# Run with coverage
npm run test:coverage
```

## Support

For issues, questions, or contributions:

1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include steps to reproduce for bugs
4. Provide sample data (anonymized) when relevant

## License

This project is open source. See LICENSE file for details.

---

*This framework is designed to be extensible and maintainable. Follow the established patterns when adding new features, and always consider the user experience when making changes to the UI or API.*
