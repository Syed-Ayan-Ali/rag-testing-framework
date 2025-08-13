"use client"

import { useState } from 'react'
import { DatabaseConnection } from '../components/DatabaseConnection'
import { TableSelector } from '../components/TableSelector'
import { TestConfiguration } from '../components/TestConfiguration'
import { ResultsDashboard } from '../components/ResultsDashboard'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

type AppState = 'connect' | 'select-table' | 'configure' | 'running' | 'results'

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

export default function Home() {
  const [state, setState] = useState<AppState>('connect')
  const [dbConfig, setDbConfig] = useState<{ url: string; anonKey: string } | null>(null)
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)
  const [sampleData, setSampleData] = useState<any[]>([])
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null)
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{
    current: number
    total: number
    currentStep: string
  } | null>(null)

  const handleDatabaseConnect = async (config: { url: string; anonKey: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to database')
      }

      setDbConfig(config)
      setTables(data.tables)
      setState('select-table')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTableSelect = (tableInfo: TableInfo, sampleData: any[]) => {
    setSelectedTable(tableInfo)
    setSampleData(sampleData)
    setState('configure')
  }

  const handleConfigurationComplete = async (config: TestConfig) => {
    setTestConfig(config)
    setState('running')
    setIsLoading(true)
    setError(null)
    setProgress({ current: 0, total: 100, currentStep: 'Initializing test...' })

    try {
      // First validate the configuration
      setProgress({ current: 10, total: 100, currentStep: 'Validating configuration...' })
      
      const validateResponse = await fetch('/api/test/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dbConfig,
          testConfig: config
        }),
      })

      const validateData = await validateResponse.json()

      if (!validateResponse.ok) {
        throw new Error(validateData.error || 'Configuration validation failed')
      }

      if (!validateData.validation.isValid) {
        const errors = validateData.validation.errors.join('\n')
        throw new Error(`Configuration errors:\n${errors}`)
      }

      // Run the test
      setProgress({ current: 20, total: 100, currentStep: 'Starting test execution...' })

      const testResponse = await fetch('/api/test/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dbConfig,
          testConfig: config
        }),
      })

      const testData = await testResponse.json()

      if (!testResponse.ok) {
        throw new Error(testData.error || testData.details || 'Test execution failed')
      }

      setResults(testData.results)
      setState('results')
    } catch (err) {
      console.error('Test execution error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('configure')
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }

  const resetToStart = () => {
    setState('connect')
    setDbConfig(null)
    setTables([])
    setSelectedTable(null)
    setSampleData([])
    setTestConfig(null)
    setResults(null)
    setError(null)
    setProgress(null)
  }

  const backToTableSelection = () => {
    setState('select-table')
    setSelectedTable(null)
    setSampleData([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RAG Testing Framework</h1>
              <p className="text-gray-700">Test and optimize embedding combinations for better RAG performance</p>
            </div>
            {state !== 'connect' && (
              <Button onClick={resetToStart} variant="outline">
                Start Over
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      {(state !== 'connect' && state !== 'results') && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${state === 'select-table' ? 'text-blue-600' : ['connect'].includes(state) ? 'text-gray-400' : 'text-green-600'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${state === 'select-table' ? 'bg-blue-100' : ['connect'].includes(state) ? 'bg-gray-100' : 'bg-green-100'}`}>
                  1
                </div>
                <span className="text-sm font-medium">Select Table</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300" />
              <div className={`flex items-center space-x-2 ${state === 'configure' ? 'text-blue-600' : ['connect', 'select-table'].includes(state) ? 'text-gray-400' : 'text-green-600'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${state === 'configure' ? 'bg-blue-100' : ['connect', 'select-table'].includes(state) ? 'bg-gray-100' : 'bg-green-100'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Configure Test</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300" />
              <div className={`flex items-center space-x-2 ${state === 'running' ? 'text-blue-600' : ['connect', 'select-table', 'configure'].includes(state) ? 'text-gray-400' : 'text-green-600'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${state === 'running' ? 'bg-blue-100' : ['connect', 'select-table', 'configure'].includes(state) ? 'bg-gray-100' : 'bg-green-100'}`}>
                  3
                </div>
                <span className="text-sm font-medium">Run Test</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="text-red-600">⚠️</div>
                <div>
                  <h4 className="text-red-900 font-medium">Error</h4>
                  <pre className="text-red-700 text-sm mt-1 whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection State */}
        {state === 'connect' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">Welcome to RAG Testing Framework</h2>
              <p className="text-lg text-gray-700 max-w-2xl">
                This framework helps you test different embedding combinations to find the most effective 
                approach for your RAG application. Connect to your database to get started.
              </p>
            </div>
            <DatabaseConnection 
              onConnect={handleDatabaseConnect} 
              isConnecting={isLoading} 
            />
        </div>
        )}

        {/* Table Selection State */}
        {state === 'select-table' && dbConfig && (
          <TableSelector
            tables={tables}
            dbConfig={dbConfig}
            onTableSelect={handleTableSelect}
            isLoading={isLoading}
          />
        )}

        {/* Configuration State */}
        {state === 'configure' && selectedTable && (
          <TestConfiguration
            tableInfo={selectedTable}
            onConfigurationComplete={handleConfigurationComplete}
            onBack={backToTableSelection}
          />
        )}

        {/* Running State */}
        {state === 'running' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Running Test</CardTitle>
                <CardDescription>
                  {testConfig ? `Testing "${testConfig.testName}"` : 'Processing your test...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{progress.currentStep}</span>
                      <span>{progress.current}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.current}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-700 mt-2">
                    This may take several minutes depending on your data size...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results State */}
        {state === 'results' && results && (
          <ResultsDashboard
            results={results}
            onNewTest={resetToStart}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t absolute bottom-0 inset-x-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-700">
            <p>RAG Testing Framework - Optimize your embedding strategies for better retrieval performance</p>
          </div>
        </div>
      </footer>
    </div>
  )
}