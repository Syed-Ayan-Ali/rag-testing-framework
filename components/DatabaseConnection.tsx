"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface DatabaseConnectionProps {
  onConnect: (config: { url: string; anonKey: string }) => void
  isConnecting: boolean
}

export function DatabaseConnection({ onConnect, isConnecting }: DatabaseConnectionProps) {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: string[] = []
    
    if (!url.trim()) {
      newErrors.push('Database URL is required')
    }
    
    if (!anonKey.trim()) {
      newErrors.push('Anonymous key is required')
    }
    
    if (url && !url.startsWith('http')) {
      newErrors.push('Database URL must start with http:// or https://')
    }
    
    setErrors(newErrors)
    
    if (newErrors.length === 0) {
      onConnect({ url: url.trim(), anonKey: anonKey.trim() })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Database Connection</CardTitle>
        <CardDescription className="text-gray-700">
          Connect to your Supabase database to start testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium text-gray-900">
              Database URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isConnecting}
              className="text-gray-100"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="anonKey" className="text-sm font-medium text-gray-900">
              Anonymous Key
            </label>
            <Input
              id="anonKey"
              type="password"
              placeholder="Your Supabase anonymous key"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              disabled={isConnecting}
              className="text-gray-100"
            />
          </div>
          
          {errors.length > 0 && (
            <div className="text-red-600 text-sm space-y-1">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect to Database'}
          </Button>
        </form>
        
        <div className="mt-4 text-xs text-gray-700">
          <p>Your connection details are not stored and are only used for this session.</p>
        </div>
      </CardContent>
    </Card>
  )
}
