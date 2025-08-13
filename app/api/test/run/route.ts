import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../lib/supabase';
import { DatabaseConnection } from '../../../../lib/database/connection';
import { RAGTestingFramework } from '../../../../lib/core/testing-framework';

export async function POST(request: NextRequest) {
  try {
    const { 
      dbConfig, 
      testConfig 
    } = await request.json();

    if (!dbConfig || !testConfig) {
      return NextResponse.json(
        { error: 'Database config and test config are required' },
        { status: 400 }
      );
    }

    // Create Supabase client following the documentation pattern
    const supabase = createSupabaseClient(dbConfig);
    
    // Test connection using RPC function
    const { data: connectionTest, error: connectionError } = await supabase
      .rpc('test_connection');

    if (connectionError) {
      return NextResponse.json(
        { error: 'Failed to connect to database: ' + connectionError.message },
        { status: 400 }
      );
    }

    const db = new DatabaseConnection(dbConfig);
    const framework = new RAGTestingFramework(db, testConfig.embeddingConfig);

    // Initialize the framework
    await framework.initialize();

    // Validate configuration first
    const validation = await framework.validateConfiguration(testConfig);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid configuration', 
          validation 
        },
        { status: 400 }
      );
    }

    // Run the experiment
    const results = await framework.runFullExperiment(testConfig);

    return NextResponse.json({ 
      success: true, 
      results,
      validation,
      message: 'Test completed successfully'
    });

  } catch (error) {
    console.error('Test execution error:', error);
    return NextResponse.json(
      { 
        error: 'Test execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Add GET method to return status or help
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to run RAG tests',
    requiredFields: {
      dbConfig: {
        url: 'string',
        anonKey: 'string'
      },
      testConfig: {
        tableId: 'string',
        tableName: 'string',
        selectedColumns: 'string[]',
        yColumn: 'string',
        queryColumn: 'string',
        answerColumn: 'string',
        embeddingConfig: {
          model: 'openai | local',
          openaiModel: 'string (optional)',
          localModel: 'string (optional)'
        },
        metricType: 'sql | brdr',
        trainingRatio: 'number (0-1)',
        testName: 'string'
      }
    }
  });
}
