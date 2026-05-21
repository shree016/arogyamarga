#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

// If you prefer dotenv-cli, run with: npx dotenv -e .env.local -- node scripts/test-supabase-connection.mjs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !publicKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or publishable key in environment')
    process.exit(2)
}

const supabase = createClient(supabaseUrl, publicKey)

async function main() {
    console.log('Testing Supabase connection to', supabaseUrl)

    try {
        // Try a lightweight query against a likely table. If the table does not exist
        // this still proves network connectivity; the error will be printed.
        const { data, error, status } = await supabase.from('doctors').select('id').limit(1)

        console.log('Status:', status)
        if (error) {
            console.error('Query error:', error)
            process.exit(1)
        }

        console.log('Query successful, sample data:', data)
        process.exit(0)
    } catch (err) {
        console.error('Unexpected error:', err)
        process.exit(1)
    }
}

main()
