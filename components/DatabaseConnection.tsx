"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { SUPABASE_CONFIG } from '@/lib/env'

interface DatabaseConnectionProps {
  onConnect: (config: { url: string; anonKey: string }) => void
  isConnecting: boolean
}

type ConnectionType = 'custom' | 'predefined'

export function DatabaseConnection({ onConnect, isConnecting }: DatabaseConnectionProps) {
  const [connectionType, setConnectionType] = useState<ConnectionType>('predefined')
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  
  // Environment variables for pre-determined dataset
  const predefinedUrl = SUPABASE_CONFIG.url
  const predefinedAnonKey = SUPABASE_CONFIG.anonKey

  console.log('predefinedUrl', predefinedUrl)
  console.log('predefinedAnonKey', predefinedAnonKey)
  
  // Check if predefined config is available
  const hasPredefinedConfig = predefinedUrl && predefinedAnonKey
  
  useEffect(() => {
    // If no predefined config, default to custom
    if (!hasPredefinedConfig) {
      setConnectionType('custom')
    }
  }, [hasPredefinedConfig])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: string[] = []
    let finalUrl = ''
    let finalAnonKey = ''
    
    if (connectionType === 'predefined') {
      if (!predefinedUrl || !predefinedAnonKey) {
        newErrors.push('Pre-determined dataset configuration is not available')
      } else {
        finalUrl = predefinedUrl
        finalAnonKey = predefinedAnonKey
      }
    } else {
      if (!url.trim()) {
        newErrors.push('Database URL is required')
      }
      
      if (!anonKey.trim()) {
        newErrors.push('Anonymous key is required')
      }
      
      if (url && !url.startsWith('http')) {
        newErrors.push('Database URL must start with http:// or https://')
      }
      
      if (newErrors.length === 0) {
        finalUrl = url.trim()
        finalAnonKey = anonKey.trim()
      }
    }
    
    setErrors(newErrors)
    
    if (newErrors.length === 0 && finalUrl && finalAnonKey) {
      onConnect({ url: finalUrl, anonKey: finalAnonKey })
    }
  }

  const handleConnectionTypeChange = (type: ConnectionType) => {
    setConnectionType(type)
    setErrors([])
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Database Connection</CardTitle>
        <CardDescription className="text-gray-700">
          Choose your dataset and connect to start testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Connection Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">
              Dataset Selection
            </label>
            
            {hasPredefinedConfig && (
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="connectionType"
                    value="predefined"
                    checked={connectionType === 'predefined'}
                    onChange={() => handleConnectionTypeChange('predefined')}
                    disabled={isConnecting}
                    className="w-4 h-4 text-blue-600"
                  />
                  
                </label>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="connectionType"
                  value="custom"
                  checked={connectionType === 'custom'}
                  onChange={() => handleConnectionTypeChange('custom')}
                  disabled={isConnecting}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Use Your Own Dataset
                  </div>
                  <div className="text-xs text-gray-700">
                    Connect to your own Supabase database
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Database Connection Fields */}
          {connectionType === 'custom' && (
            <>
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
            </>
          )}

          {/* Pre-determined Dataset Info */}
          {connectionType === 'predefined' && hasPredefinedConfig && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-600 mt-1">
                Ready to connect to the pre-configured sample dataset
              </div>
            </div>
          )}
          
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
            {isConnecting ? 'Connecting...' : 
             connectionType === 'predefined' ? 'Connect to Sample Dataset' : 'Connect to Database'}
          </Button>
        </form>
        
        <div className="mt-4 text-xs text-gray-700">
          <p>
            {connectionType === 'custom' 
              ? 'Your connection details are not stored and are only used for this session.'
              : 'Using secure pre-configured dataset for testing purposes.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
