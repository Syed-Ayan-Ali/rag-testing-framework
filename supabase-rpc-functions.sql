-- Function to get all table names in the public schema
CREATE OR REPLACE FUNCTION get_table_names()
RETURNS TABLE(table_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$;

-- Function to get table information including columns and row count
CREATE OR REPLACE FUNCTION get_table_info(table_name_param text)
RETURNS TABLE(
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  row_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  row_count_val bigint;
BEGIN
  -- Get row count for the table
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name_param) INTO row_count_val;
  
  -- Return table information with columns
  RETURN QUERY
  SELECT 
    table_name_param::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    row_count_val
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END;
$$;

-- Function to test database connection
CREATE OR REPLACE FUNCTION test_connection()
RETURNS TABLE(status text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 'success'::text, 'Database connection successful'::text;
END;
$$;

-- Function to get sample data from a table
CREATE OR REPLACE FUNCTION get_sample_data(table_name_param text, limit_param integer DEFAULT 5)
RETURNS TABLE(sample_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('SELECT to_jsonb(t.*) FROM %I t LIMIT %s', table_name_param, limit_param);
END;
$$;

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = table_name_param
  );
END;
$$;
