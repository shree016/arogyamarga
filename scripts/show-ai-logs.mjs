#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
    console.error('Set SUPABASE_SERVICE_ROLE_KEY in .env.local to read demo logs from the DB')
    process.exit(2)
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey)

async function main() {
    const { data, error } = await supabaseAdmin
        .from('ai_demo_logs')
        .select('id, prompt, response, model, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching ai_demo_logs:', error)
        process.exit(1)
    }

    if (!data || data.length === 0) {
        console.log('No ai_demo_logs found yet.')
        process.exit(0)
    }

    console.log('Recent ai_demo_logs:')
    for (const r of data) {
        console.log('---')
        console.log(new Date(r.created_at).toLocaleString())
        console.log('Model:', r.model)
        console.log('Prompt:', r.prompt)
        console.log('Response:', r.response)
    }
}

main()
