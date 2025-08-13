# Environment Variables Setup

To enable the pre-determined dataset option in the RAG Testing Framework, you need to create a `.env.local` file in the project root with your Supabase configuration.

## Setup Instructions

1. **Create the .env.local file:**
   ```bash
   touch .env.local
   ```

2. **Add the following environment variables:**
   ```env
   # Pre-determined dataset configuration
   # Replace these with your actual Supabase project credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here

   # Optional: Custom dataset name for UI display
   NEXT_PUBLIC_PREDEFINED_DATASET_NAME=Sample RAG Dataset
   ```

3. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" and "anon public" key
   - Replace the placeholder values in `.env.local`

## Environment Variables Explained

- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Your Supabase anonymous public key
- **`NEXT_PUBLIC_PREDEFINED_DATASET_NAME`**: (Optional) Display name for the pre-determined dataset

## How It Works

When these environment variables are configured:
- Users will see two options: "Use Pre-determined Dataset" and "Use Your Own Dataset"
- The pre-determined option connects automatically using the configured credentials
- If environment variables are not set, only the "Use Your Own Dataset" option appears

## Security Note

The `.env.local` file is automatically ignored by Git (in .gitignore) to keep your credentials secure. Never commit your actual Supabase credentials to version control.
