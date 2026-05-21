#!/usr/bin/env node
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import path from 'path'

try {
    const dotenv = await import('dotenv')
    dotenv.config({ path: path.resolve('.env.local') })
} catch (e) { }

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in .env.local')
    process.exit(2)
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(2)
}

const prompt = 'Please provide 3 concise follow-up questions for: severe headache with nausea and blurred vision.'

async function callOpenAI() {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a medical intake assistant. Ask concise follow-up questions.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 200,
            temperature: 0.4,
        })
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`OpenAI error: ${res.status} ${text}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    return content
}

async function main() {
    console.log('Calling OpenAI...')
    const response = await callOpenAI()
    console.log('OpenAI response:', response)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const insert = await supabase.from('ai_demo_logs').insert({ prompt, response, model: 'gpt-4o-mini' })
    if (insert.error) {
        console.error('Error inserting demo log:', insert.error)
        process.exit(1)
    }
    console.log('Inserted demo log, id:', JSON.stringify(insert.data))
}

main().catch((err) => { console.error(err); process.exit(1) })
