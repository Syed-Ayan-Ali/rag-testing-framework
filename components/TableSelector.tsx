"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
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

interface TableSelectorProps {
  tables: string[]
  dbConfig: { url: string; anonKey: string }
  onTableSelect: (tableInfo: TableInfo, sampleData: any[]) => void
  isLoading: boolean
}

export function TableSelector({ tables, dbConfig, onTableSelect, isLoading }: TableSelectorProps) {
  const [selectedTable, setSelectedTable] = useState('')
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [sampleData, setSampleData] = useState<any[]>([])
  const [isLoadingTable, setIsLoadingTable] = useState(false)
  const [error, setError] = useState('')

  const fetchTableInfo = async (tableName: string) => {
    if (!tableName) return
    
    setIsLoadingTable(true)
    setError('')
    
    try {
      const response = await fetch('/api/table-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dbConfig,
          tableName
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch table info')
      }

      setTableInfo(data.tableInfo)
      setSampleData(data.sampleData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTableInfo(null)
      setSampleData([])
    } finally {
      setIsLoadingTable(false)
    }
  }

  useEffect(() => {
    if (selectedTable) {
      fetchTableInfo(selectedTable)
    }
  }, [selectedTable])

  const handleSelectTable = () => {
    if (tableInfo) {
      onTableSelect(tableInfo, sampleData)
    }
  }

  return (
    <div className="space-y-6 h-full">
      <Card>
        <CardHeader>
          <CardTitle>Select Table</CardTitle>
                  <CardDescription className="text-gray-700">
          Choose a table from your database to test embeddings
        </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="table" className="text-sm font-medium text-gray-900">
              Available Tables
            </label>
            <Select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              disabled={isLoading || isLoadingTable}
              options={tables.map(table => ({ value: table, label: table }))}
              className="text-gray-100"
            >
              <option value="" className="text-gray-100">Select a table...</option>
            </Select>
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {tableInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Table Information: {tableInfo.name}</CardTitle>
            <CardDescription className="text-gray-700">
              {tableInfo.rowCount} rows, {tableInfo.columns.length} columns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-900">Columns:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm border border-gray-700">
                {tableInfo.columns.map((col) => (
                  <div key={col.column_name} className="flex justify-between p-2 bg-gray-50 rounded ">
                    <span className="font-medium text-gray-900">{col.column_name}</span>
                    <span className="text-gray-900">{col.data_type}</span>
                  </div>
                ))}
              </div>
            </div>

            {sampleData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-900">Sample Data:</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(sampleData[0]).slice(0, 5).map((key) => (
                          <th key={key} className="border p-2 text-left">
                            {key}
                          </th>
                        ))}
                        {Object.keys(sampleData[0]).length > 5 && (
                          <th className="border p-2 text-left">...</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.slice(0, 3).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).slice(0, 5).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="border p-2">
                              {typeof value === 'object' ? 
                                JSON.stringify(value).substring(0, 50) + '...' : 
                                String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')
                              }
                            </td>
                          ))}
                          {Object.keys(row).length > 5 && (
                            <td className="border p-2">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSelectTable}
              disabled={isLoadingTable}
              className="w-full"
            >
              {isLoadingTable ? 'Loading...' : 'Use This Table'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
