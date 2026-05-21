#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

// Load .env.local if present
try {
    const dotenv = await import('dotenv')
    dotenv.config({ path: path.resolve('.env.local') })
} catch (e) {
    // ignore
}

// Import the server action
const { submitIntake } = await import('../app/actions/ai.js')

async function main() {
    const formData = new FormData()
    formData.set('symptoms', 'Severe headache with nausea and blurred vision')

    console.log('Calling submitIntake...')
    const result = await submitIntake({}, formData)
    console.log('Result:', result)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
