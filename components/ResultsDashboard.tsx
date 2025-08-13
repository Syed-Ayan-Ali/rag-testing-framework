"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface ExperimentResults {
  experimentId: string
  testName: string
  timestamp: Date
  configuration: any
  allResults: Array<{
    id: string
    combination: {
      columns: string[]
      name: string
    }
    averageScore: number
    totalTests: number
    processingTime: number
    embeddingStats: {
      trainingEmbeddings: number
      testQueries: number
      averageSimilarity: number
    }
  }>
  summary: {
    bestCombination: {
      columns: string[]
      name: string
    }
    bestScore: number
    worstCombination: {
      columns: string[]
      name: string
    }
    worstScore: number
    averageScore: number
    totalCombinations: number
  }
  processingTime: number
}

interface ResultsDashboardProps {
  results: ExperimentResults
  onNewTest: () => void
}

export function ResultsDashboard({ results, onNewTest }: ResultsDashboardProps) {
  const [sortBy, setSortBy] = useState<'score' | 'tests' | 'time'>('score')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const sortedResults = [...results.allResults].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.averageScore - a.averageScore
      case 'tests':
        return b.totalTests - a.totalTests
      case 'time':
        return a.processingTime - b.processingTime
      default:
        return 0
    }
  })

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const exportResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rag-test-results-${results.testName}-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Test Results</h2>
          <p className="text-gray-700">
            {results.testName} • {new Date(results.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportResults} variant="outline">
            Export Results
          </Button>
          <Button onClick={onNewTest}>
            New Test
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Combination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(results.summary.bestScore * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-700 mt-1">
              {results.summary.bestCombination.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(results.summary.averageScore * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-700 mt-1">
              Across all combinations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Combinations Tested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.summary.totalCombinations}
            </div>
            <p className="text-xs text-gray-700 mt-1">
              Column combinations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(results.processingTime)}
            </div>
            <p className="text-xs text-gray-700 mt-1">
              Processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription className="text-gray-700">
                Performance breakdown by column combination
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="score">Sort by Score</option>
                <option value="tests">Sort by Test Count</option>
                <option value="time">Sort by Time</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Column Combination</th>
                  <th className="text-left p-2">Score</th>
                  <th className="text-left p-2">Tests</th>
                  <th className="text-left p-2">Avg Similarity</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result, index) => (
                  <tr key={result.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{index + 1}</span>
                        {index === 0 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Best</span>}
                        {index === sortedResults.length - 1 && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Worst</span>}
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{result.combination.name}</div>
                        <div className="text-xs text-gray-500">
                          {result.combination.columns.join(', ')}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {(result.averageScore * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${result.averageScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{result.totalTests}</td>
                    <td className="p-2">
                      {(result.embeddingStats.averageSimilarity * 100).toFixed(1)}%
                    </td>
                    <td className="p-2">{formatTime(result.processingTime)}</td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(showDetails === result.id ? null : result.id)}
                      >
                        {showDetails === result.id ? 'Hide' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Modal/Expandable */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detailed Analysis: {sortedResults.find(r => r.id === showDetails)?.combination.name}
            </CardTitle>
            <CardDescription>
              In-depth performance metrics and breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const result = sortedResults.find(r => r.id === showDetails)
              if (!result) return null

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <h4 className="font-medium text-blue-900">Embedding Statistics</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>Training Embeddings: {result.embeddingStats.trainingEmbeddings}</div>
                        <div>Test Queries: {result.embeddingStats.testQueries}</div>
                        <div>Average Similarity: {(result.embeddingStats.averageSimilarity * 100).toFixed(2)}%</div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded">
                      <h4 className="font-medium text-green-900">Performance Metrics</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>Overall Score: {(result.averageScore * 100).toFixed(2)}%</div>
                        <div>Total Tests: {result.totalTests}</div>
                        <div>Processing Time: {formatTime(result.processingTime)}</div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded">
                      <h4 className="font-medium text-purple-900">Column Details</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>Columns Used: {result.combination.columns.length}</div>
                        <div className="break-words">
                          {result.combination.columns.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setShowDetails(null)} variant="outline">
                      Close Details
                    </Button>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Configuration used for this experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div><strong>Table:</strong> {results.configuration.tableName}</div>
              <div><strong>Metric Type:</strong> {results.configuration.metricType}</div>
              <div><strong>Training Ratio:</strong> {(results.configuration.trainingRatio * 100).toFixed(0)}%</div>
            </div>
            <div className="space-y-2">
              <div><strong>Embedding Model:</strong> {results.configuration.embeddingConfig.model}</div>
              <div><strong>Selected Columns:</strong> {results.configuration.selectedColumns.join(', ')}</div>
              <div><strong>Y Column:</strong> {results.configuration.yColumn}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
