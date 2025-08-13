"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface TableInfo {
  name: string
  columns: Array<{
    column_name: string
    data_type: string
    is_nullable: boolean
  }>
  rowCount: number
}

interface TestConfig {
  tableId: string
  tableName: string
  selectedColumns: string[]
  yColumn: string
  queryColumn: string
  answerColumn: string
  embeddingConfig: {
    model: 'openai' | 'local'
    openaiModel?: string
    localModel?: string
  }
  metricType: 'sql' | 'brdr'
  trainingRatio: number
  testName: string
}

interface TestConfigurationProps {
  tableInfo: TableInfo
  onConfigurationComplete: (config: TestConfig) => void
  onBack: () => void
}

export function TestConfiguration({ tableInfo, onConfigurationComplete, onBack }: TestConfigurationProps) {
  const [config, setConfig] = useState<TestConfig>({
    tableId: tableInfo.name,
    tableName: tableInfo.name,
    selectedColumns: [],
    yColumn: '',
    queryColumn: '',
    answerColumn: '',
    embeddingConfig: {
      model: 'local',
      localModel: 'Xenova/all-MiniLM-L6-v2'
    },
    metricType: 'brdr',
    trainingRatio: 0.8,
    testName: `Test_${tableInfo.name}_${new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')}`
  })

  const [errors, setErrors] = useState<string[]>([])

  const handleColumnToggle = (columnName: string) => {
    setConfig(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(columnName)
        ? prev.selectedColumns.filter(col => col !== columnName)
        : [...prev.selectedColumns, columnName].slice(0, 5) // Limit to 5 columns
    }))
  }

  const validateConfiguration = (): string[] => {
    const errors: string[] = []

    if (!config.testName.trim()) {
      errors.push('Test name is required')
    }

    if (config.selectedColumns.length === 0) {
      errors.push('At least one column must be selected for embeddings')
    }

    if (!config.yColumn) {
      errors.push('Y column (target) must be selected')
    }

    if (!config.queryColumn) {
      errors.push('Query column must be selected')
    }

    if (!config.answerColumn) {
      errors.push('Answer column must be selected')
    }

    if (config.selectedColumns.includes(config.yColumn)) {
      errors.push('Y column cannot be used as an embedding column')
    }

    if (config.trainingRatio <= 0 || config.trainingRatio >= 1) {
      errors.push('Training ratio must be between 0 and 1')
    }

    if (config.embeddingConfig.model === 'openai' && !config.embeddingConfig.openaiModel) {
      errors.push('OpenAI model must be specified when using OpenAI embeddings')
    }

    return errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateConfiguration()
    setErrors(validationErrors)

    if (validationErrors.length === 0) {
      onConfigurationComplete(config)
    }
  }

  const textColumns = tableInfo.columns.filter(col => 
    col.data_type.includes('text') || 
    col.data_type.includes('varchar') || 
    col.data_type.includes('char')
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Test Configuration</h2>
          <p className="text-gray-700">Configure your RAG embedding test for table: {tableInfo.name}</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Back to Table Selection
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
            <CardDescription className="text-gray-700">Set up the basic test parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Test Name</label>
                <Input
                  value={config.testName}
                  onChange={(e) => setConfig(prev => ({ ...prev, testName: e.target.value }))}
                  placeholder="Enter test name"
                  className="text-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Training Ratio</label>
                <Input
                  type="number"
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  value={config.trainingRatio}
                  onChange={(e) => setConfig(prev => ({ ...prev, trainingRatio: parseFloat(e.target.value) }))}
                  className="text-gray-100"
                />
                <p className="text-xs text-gray-700">
                  {Math.round(config.trainingRatio * 100)}% for training, {Math.round((1 - config.trainingRatio) * 100)}% for testing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Metric Type</label>
                <Select
                  value={config.metricType}
                  onChange={(e) => setConfig(prev => ({ ...prev, metricType: e.target.value as 'sql' | 'brdr' }))}
                  options={[
                    { value: 'brdr', label: 'BRDR Banking Regulation Metric' },
                    { value: 'sql', label: 'SQL Query Metric' }
                  ]}
                  className="text-gray-100"
                />
                <p className="text-xs text-gray-700">
                  {config.metricType === 'brdr' ? 
                    'Specialized for banking regulation documents' : 
                    'Designed for SQL query comparison'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Column Selection</CardTitle>
            <CardDescription className="text-gray-700">Choose columns for embeddings and specify target columns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Embedding Columns (Select up to 5 columns for embedding combinations)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                {tableInfo.columns.map((col) => (
                  <label key={col.column_name} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.selectedColumns.includes(col.column_name)}
                      onChange={() => handleColumnToggle(col.column_name)}
                      disabled={!config.selectedColumns.includes(col.column_name) && config.selectedColumns.length >= 5}
                      className="rounded"
                    />
                    <span className="text-sm">{col.column_name}</span>
                    <span className="text-xs text-gray-500">({col.data_type})</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-700">
                Selected: {config.selectedColumns.length}/5 columns
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Y Column (Target)</label>
                <Select
                  value={config.yColumn}
                  onChange={(e) => setConfig(prev => ({ ...prev, yColumn: e.target.value }))}
                  options={tableInfo.columns.map(col => ({ 
                    value: col.column_name, 
                    label: `${col.column_name} (${col.data_type})` 
                  }))}
                  
                  className="text-gray-100"
                >
                  <option value="">Select Y column...</option>
                </Select>
                <p className="text-xs text-gray-700">
                  The column containing the expected output/answer
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Query Column</label>
                <Select
                  value={config.queryColumn}
                  onChange={(e) => setConfig(prev => ({ ...prev, queryColumn: e.target.value }))}
                  options={textColumns.map(col => ({ 
                    value: col.column_name, 
                    label: `${col.column_name} (${col.data_type})` 
                  }))}          
                  className="text-gray-100"
                >
                  <option value="">Select query column...</option>
                </Select>
                <p className="text-xs text-gray-700">
                  Column containing test queries
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Answer Column</label>
                <Select
                  value={config.answerColumn}
                  onChange={(e) => setConfig(prev => ({ ...prev, answerColumn: e.target.value }))}
                  options={tableInfo.columns.map(col => ({ 
                    value: col.column_name, 
                    label: `${col.column_name} (${col.data_type})` 
                  }))}                  
                  className="text-gray-100"
                >
                  <option value="">Select answer column...</option>
                </Select>
                <p className="text-xs text-gray-700">
                  Column containing expected answers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Embedding Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Embedding Configuration</CardTitle>
            <CardDescription className="text-gray-700">Configure the embedding model to use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Embedding Model</label>
              <Select
                value={config.embeddingConfig.model}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  embeddingConfig: { 
                    ...prev.embeddingConfig, 
                    model: e.target.value as 'openai' | 'local' 
                  }
                }))}
                options={[
                  { value: 'local', label: 'Local Model (Xenova/all-MiniLM-L6-v2)' },
                  { value: 'openai', label: 'OpenAI Embeddings' }
                ]}
                className="text-gray-100"
              />
            </div>

            {config.embeddingConfig.model === 'openai' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">OpenAI Model</label>
                <Select
                  value={config.embeddingConfig.openaiModel || ''}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    embeddingConfig: { 
                      ...prev.embeddingConfig, 
                      openaiModel: e.target.value 
                    }
                  }))}
                  options={[
                    { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
                    { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
                    { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002' }
                  ]}
                  className="text-gray-100"
                >
                  <option value="">Select OpenAI model...</option>
                </Select>
              </div>
            )}

            {config.embeddingConfig.model === 'local' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Local Model</label>
                <Input
                  value={config.embeddingConfig.localModel || 'Xenova/all-MiniLM-L6-v2'}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    embeddingConfig: { 
                      ...prev.embeddingConfig, 
                      localModel: e.target.value 
                    }
                  }))}
                  placeholder="Xenova/all-MiniLM-L6-v2"
                  className="text-gray-100"
                />
                <p className="text-xs text-gray-500">
                  HuggingFace model name (default: Xenova/all-MiniLM-L6-v2)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Errors */}
        {errors.length > 0 && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-red-600 space-y-1">
                <h4 className="font-medium">Configuration Errors:</h4>
                {errors.map((error, index) => (
                  <div key={index} className="text-sm">• {error}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <Card>
          <CardContent className="pt-6">
            <Button type="submit" className="w-full" size="lg">
              Start RAG Embedding Test
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will test {config.selectedColumns.length > 0 ? 
                `${Math.pow(2, config.selectedColumns.length) - 1} column combinations` : 
                '0 combinations'
              } using the selected configuration
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
