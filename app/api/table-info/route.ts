import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../lib/supabase';
import { DatabaseConnection } from '../../../lib/database/connection';

export async function POST(request: NextRequest) {
  try {
    const { url, anonKey, tableName } = await request.json();

    if (!url || !anonKey || !tableName) {
      return NextResponse.json(
        { error: 'Database URL, anonymous key, and table name are required' },
        { status: 400 }
      );
    }

    // Create Supabase client following the documentation pattern
    const supabase = createSupabaseClient({ url, anonKey });
    
    // Test connection first
    const { data: connectionTest, error: connectionError } = await supabase
      .rpc('test_connection');

    if (connectionError) {
      return NextResponse.json(
        { error: 'Failed to connect to database: ' + connectionError.message },
        { status: 400 }
      );
    }

    // Check if table exists
    const { data: tableExists, error: existsError } = await supabase
      .rpc('table_exists', { table_name_param: tableName });

    if (existsError) {
      return NextResponse.json(
        { error: 'Failed to check table existence: ' + existsError.message },
        { status: 500 }
      );
    }

    if (!tableExists) {
      return NextResponse.json(
        { error: `Table "${tableName}" not found` },
        { status: 404 }
      );
    }

    // Get table info using RPC function
    const { data: tableInfoData, error: tableInfoError } = await supabase
      .rpc('get_table_info', { table_name_param: tableName });

    if (tableInfoError) {
      return NextResponse.json(
        { error: 'Failed to get table info: ' + tableInfoError.message },
        { status: 500 }
      );
    }

    // Get sample data using RPC function
    const { data: sampleDataRaw, error: sampleError } = await supabase
      .rpc('get_sample_data', { table_name_param: tableName, limit_param: 5 });

    if (sampleError) {
      return NextResponse.json(
        { error: 'Failed to get sample data: ' + sampleError.message },
        { status: 500 }
      );
    }

    // Process table info
    const tableInfo = {
      name: tableName,
      columns: tableInfoData?.map((row: any) => ({
        column_name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable === 'YES'
      })) || [],
      rowCount: tableInfoData?.[0]?.row_count || 0
    };

    // Process sample data
    const sampleData = sampleDataRaw?.map((row: any) => row.sample_data) || [];

    return NextResponse.json({ 
      success: true, 
      tableInfo,
      sampleData,
      message: 'Table information retrieved successfully'
    });

  } catch (error) {
    console.error('Table info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
