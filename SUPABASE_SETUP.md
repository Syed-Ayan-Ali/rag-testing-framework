# Supabase RPC Functions Setup

## Why RPC Functions Are Needed

Due to security restrictions in Supabase, the `information_schema` tables cannot be accessed directly via REST API calls. To access table metadata and schema information, we need to create PostgreSQL functions with `SECURITY DEFINER` privileges that can access these system tables.

## Installation Steps

### 1. Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** in the left sidebar
3. Create a new query

### 2. Run the RPC Functions SQL

Copy and paste the contents of `supabase-rpc-functions.sql` into the SQL editor and execute it. This will create the following functions:

#### Functions Created:

1. **`get_table_names()`**
   - Returns all table names in the public schema
   - Used by: `/api/tables` route

2. **`get_table_info(table_name_param text)`**
   - Returns detailed table information including columns and row count
   - Used by: `/api/table-info` route

3. **`test_connection()`**
   - Simple function to test database connectivity
   - Used by: All API routes for connection testing

4. **`get_sample_data(table_name_param text, limit_param integer)`**
   - Returns sample data from a specified table
   - Used by: `/api/table-info` route

5. **`table_exists(table_name_param text)`**
   - Checks if a table exists in the public schema
   - Used by: `/api/table-info` route for validation

### 3. Verify Installation

After running the SQL, you should see output confirming that the functions were created. You can verify by checking the **Database** > **Functions** section in your Supabase dashboard.

## Function Details

### get_table_names()
```sql
SELECT get_table_names();
```
Returns:
```
table_name
-----------
users
posts
comments
```

### get_table_info(table_name)
```sql
SELECT * FROM get_table_info('users');
```
Returns:
```
table_name | column_name | data_type | is_nullable | row_count
-----------|-------------|-----------|-------------|----------
users      | id          | uuid      | NO          | 150
users      | email       | text      | NO          | 150
users      | name        | text      | YES         | 150
```

### test_connection()
```sql
SELECT test_connection();
```
Returns:
```
status  | message
--------|---------------------------
success | Database connection successful
```

## Security Considerations

- All functions are created with `SECURITY DEFINER` which means they run with the privileges of the function owner (your Supabase project)
- These functions only access metadata and sample data, not sensitive user data
- The functions are designed to only work with tables in the `public` schema
- Sample data is limited to 5 rows by default to prevent large data transfers

## Troubleshooting

### Function Not Found Error
If you get "function does not exist" errors:
1. Ensure the SQL was executed successfully
2. Check the Functions section in Supabase dashboard
3. Verify you're using the correct function names

### Permission Errors
If you get permission errors:
1. Ensure your database user has CREATE FUNCTION privileges
2. Check that the functions were created with SECURITY DEFINER
3. Verify the functions are in the public schema

### Table Access Issues
If specific tables can't be accessed:
1. Ensure the tables exist in the public schema
2. Check that the table names are spelled correctly (case-sensitive)
3. Verify the tables have appropriate permissions

## Usage in the Application

Once the RPC functions are installed, the RAG Testing Framework will automatically use them for:

- **Database Connection Testing**: Verifies connectivity before operations
- **Table Discovery**: Lists all available tables in your database
- **Table Analysis**: Gets column information and row counts
- **Sample Data**: Retrieves preview data for table inspection
- **Validation**: Checks table existence before processing

The application will now work seamlessly with your Supabase database without encountering the "relation does not exist" errors that occur when trying to access information_schema directly via REST API.

## Updates and Maintenance

If you need to modify the functions:

1. You can drop and recreate them:
   ```sql
   DROP FUNCTION IF EXISTS get_table_names();
   ```

2. Or use `CREATE OR REPLACE FUNCTION` as shown in the provided SQL

3. Always test the functions individually before using them in the application

The functions are designed to be safe and efficient, but you can modify them to suit your specific needs or add additional security measures as required.
