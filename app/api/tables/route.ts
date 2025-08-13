import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../lib/supabase';
import { DatabaseConnection } from '../../../lib/database/connection';

export async function POST(request: NextRequest) {

  
  try {
    const { url, anonKey } = await request.json();

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: 'Database URL and anonymous key are required' },
        { status: 400 }
      );
    }

    // Create Supabase client following the documentation pattern
    const supabase = createSupabaseClient({ url, anonKey });
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to connect to database' },
        { status: 400 }
      );
    }

    // Test connection first using RPC function
    const { data: connectionTest, error: connectionError } = await supabase
      .rpc('test_connection');

    if (connectionError) {
      return NextResponse.json(
        { error: 'Failed to connect to database: ' + connectionError.message },
        { status: 400 }
      );
    }

    // Get table names using RPC function
    const { data: tableData, error: tableError } = await supabase
      .rpc('get_table_names');

    if (tableError) {
      return NextResponse.json(
        { error: 'Failed to fetch tables: ' + tableError.message },
        { status: 500 }
      );
    }

    // Extract table names from the returned data
    const tableNames = tableData?.map((row: any) => row.table_name) || [];

    console.log('Table names:', tableNames);

    
    return NextResponse.json({ 
      success: true, 
      tables: tableNames,
      message: 'Connected successfully'
    });

  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST to connect to database and get tables' },
    { status: 405 }
  );
}
