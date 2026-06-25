import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'

// Read SANITY_WRITE_TOKEN from .env
const env = readFileSync('.env', 'utf8')
const token = env
  .split('\n')
  .find((l) => l.startsWith('SANITY_WRITE_TOKEN'))
  ?.split('=')[1]
  ?.trim()

if (!token) {
  console.error('Could not find SANITY_WRITE_TOKEN in .env')
  process.exit(1)
}

const client = createClient({
  projectId: 'f0yvhrzy',
  dataset: 'production',
  apiVersion: '2025-06-18',
  token,
  useCdn: false,
})

const ORPHAN_ID = '4e60301d-aab9-429c-976a-9a3cf2b7174b'

client
  .delete(ORPHAN_ID)
  .then(() => console.log('? Deleted orphan document', ORPHAN_ID))
  .catch((err) => console.error('Delete failed:', err.message))