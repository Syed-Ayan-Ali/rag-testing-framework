import { createSupabaseClient } from '../supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseConfig {
  url: string;
  anonKey: string;
}

export interface TableSchema {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
}

export interface TableInfo {
  name: string;
  columns: TableSchema[];
  rowCount: number;
}

export class DatabaseConnection {
  private supabase: SupabaseClient;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.supabase = createSupabaseClient(config);
  }

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('test_connection');
      
      this.isConnected = !error;
      return this.isConnected;
    } catch (error) {
      console.error('Database connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async getTables(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_table_names');
      
      if (error) {
        console.error('Failed to fetch tables:', error);
        return [];
      }
      
      return data?.map((row: any) => row.table_name) || [];
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      return [];
    }
  }

  async getTableInfo(tableName: string): Promise<TableInfo | null> {
    try {
      // Get table information using RPC function
      const { data: tableInfoData, error: tableInfoError } = await this.supabase
        .rpc('get_table_info', { table_name_param: tableName });

      if (tableInfoError) throw tableInfoError;

      if (!tableInfoData || tableInfoData.length === 0) {
        return null;
      }

      return {
        name: tableName,
        columns: tableInfoData.map((row: any) => ({
          table_name: row.table_name,
          column_name: row.column_name,
          data_type: row.data_type,
          is_nullable: row.is_nullable === 'YES'
        })),
        rowCount: tableInfoData[0]?.row_count || 0
      };
    } catch (error) {
      console.error(`Failed to get table info for ${tableName}:`, error);
      return null;
    }
  }

  async getTableData(
    tableName: string, 
    columns: string[] = ['*'],
    limit?: number,
    offset?: number
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from(tableName)
        .select(columns.join(','));

      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 1000) - 1);

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Failed to fetch data from ${tableName}:`, error);
      return [];
    }
  }

  async executeRawQuery(query: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', { 
        sql_query: query 
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to execute raw query:', error);
      return [];
    }
  }

  getClient() {
    return this.supabase;
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}
