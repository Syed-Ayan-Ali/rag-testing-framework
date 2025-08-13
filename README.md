# RAG Testing Framework

A comprehensive TypeScript-based system for testing and optimizing embedding combinations in RAG (Retrieval-Augmented Generation) applications.

## 🎯 Purpose

This framework helps you systematically test different combinations of data columns to find the most effective embedding strategies for your RAG system. It evaluates performance across multiple combinations and provides detailed metrics to guide optimization decisions.

## ✨ Features

- **Systematic Testing**: Tests all combinations of up to 5 columns to find optimal embedding strategies
- **Multiple Embedding Models**: Supports both OpenAI and local HuggingFace models
- **Specialized Metrics**: 
  - SQL Query Metric: For database query comparison tasks
  - BRDR Banking Metric: Specialized for banking regulation documents
- **80/20 Data Split**: Automatically splits your data for training and testing
- **Comprehensive Results**: Detailed performance analysis with visualizations
- **Modern UI**: React-based interface built with Next.js and TypeScript
- **Database Integration**: Direct connection to Supabase PostgreSQL databases

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase database access
- (Optional) OpenAI API key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables** (create `.env.local`):
   ```env
   # Optional: for OpenAI embeddings
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the development server:**
```bash
npm run dev
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## 📋 How It Works

### 1. Data Preparation
- Connect to your Supabase database
- Select a table containing your test data
- The table should have columns for embedding, queries, and expected answers

### 2. Configuration
- **Embedding Columns**: Choose up to 5 columns for creating embedding combinations
- **Y Column**: Select the target column (expected output)
- **Query/Answer Columns**: Choose columns containing test queries and correct answers
- **Embedding Model**: Select between local (free) or OpenAI (paid) models
- **Metric Type**: Choose SQL or BRDR metric based on your use case

### 3. Testing Process
- **Training Phase**: Creates embeddings for all column combinations using 80% of data
- **Testing Phase**: Evaluates performance using remaining 20% of data
- **Similarity Matching**: Uses cosine similarity to find best matches
- **Metric Calculation**: Compares retrieved vs. expected results

### 4. Results Analysis
- Performance breakdown by column combination
- Best and worst performing combinations
- Detailed metrics and similarity scores
- Export capabilities for further analysis

## 📊 Metric Models

### SQL Metric Model
Perfect for database query tasks with 6 evaluation criteria:
- **Tables Presence** (25%): Required tables in query
- **Columns Presence** (25%): Required columns in query
- **Joins Presence** (20%): Correct join operations
- **Syntax Validity** (15%): Query parseability
- **Keywords Presence** (10%): SQL keyword accuracy
- **Differences Penalty** (5%): Negative weight for errors

### BRDR Banking Metric Model
Specialized for banking regulation documents with 7 criteria:
- **Semantic Similarity** (20%): Content similarity
- **Document Relevance** (15%): Document type relevance
- **Concept Accuracy** (15%): Banking concept alignment
- **Topic Alignment** (15%): Regulatory topic matching
- **Keyword Presence** (10%): Domain keyword accuracy
- **Regulatory Compliance** (15%): Compliance term matching
- **Contextual Coherence** (10%): Overall coherence

## 🛠 API Reference

### Database Connection
```http
POST /api/tables
{
  "url": "https://your-project.supabase.co",
  "anonKey": "your-anon-key"
}
```

### Run Test
```http
POST /api/test/run
{
  "dbConfig": { "url": "...", "anonKey": "..." },
  "testConfig": {
    "tableName": "your_table",
    "selectedColumns": ["col1", "col2"],
    "yColumn": "target_column",
    "queryColumn": "query_column",
    "answerColumn": "answer_column",
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

## 🔧 Extending the Framework

### Adding Custom Metrics
1. Create a new metric class in `lib/metrics/`
2. Implement the calculation interface
3. Update the UI configuration options

### Adding New Embedding Models
1. Extend the `EmbeddingGenerator` class
2. Add model configuration options
3. Update the UI model selection

### Adding New Data Sources
1. Create a new connection class
2. Implement the database interface
3. Update the connection UI

## 📁 Project Structure

```
rag-testing-framework/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── DatabaseConnection.tsx
│   ├── TableSelector.tsx
│   ├── TestConfiguration.tsx
│   └── ResultsDashboard.tsx
├── lib/                   # Core framework logic
│   ├── core/             # Main testing framework
│   ├── database/         # Database connection
│   ├── embeddings/       # Embedding generation
│   └── metrics/          # Metric calculations
└── IMPLEMENTATION_GUIDE.md
```

## 🎯 Use Cases

### Database Query Optimization
- Test different column combinations for SQL query generation
- Compare embedding strategies for database schema understanding
- Optimize retrieval for database documentation

### Document Analysis
- Banking regulation compliance checking
- Legal document analysis
- Technical documentation retrieval

### General RAG Optimization
- Find optimal embedding combinations for any text corpus
- Compare local vs. cloud embedding models
- Systematic performance evaluation

## ⚡ Performance Tips

1. **Start Small**: Begin with smaller datasets (< 1000 rows) for faster iteration
2. **Column Selection**: Choose the most relevant columns to reduce processing time
3. **Local vs OpenAI**: Local embeddings are free but slower; OpenAI is faster but costs money
4. **Batch Processing**: The framework automatically handles efficient batch processing

## 🐛 Troubleshooting

**Connection Issues**: Verify Supabase URL and key, check database accessibility

**Memory Problems**: Reduce dataset size or use smaller embedding models

**Slow Performance**: Consider OpenAI embeddings or reduce column combinations

**API Timeouts**: Check network connectivity and database response times

## 📚 Documentation

- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Detailed technical documentation
- [API Reference](./IMPLEMENTATION_GUIDE.md#api-reference) - Complete API documentation
- [Extension Guide](./IMPLEMENTATION_GUIDE.md#extension-points) - How to extend the framework

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source. See the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Next.js, React, and TypeScript
- Embedding support via AI SDK and Transformers.js
- Database integration with Supabase
- UI components styled with Tailwind CSS

---

**Ready to optimize your RAG system?** Start by connecting your database and running your first embedding test! 🚀