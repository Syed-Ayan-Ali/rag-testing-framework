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

    // Validate configuration
    const validation = await framework.validateConfiguration(testConfig);

    return NextResponse.json({ 
      success: true, 
      validation,
      message: 'Configuration validated'
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
