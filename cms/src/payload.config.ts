import { buildConfig } from 'payload'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Pages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'change-me-in-production-min-32-chars',
  typescript: {
    outputFile: './src/payload-types.ts',
  },
  db: sqliteD1Adapter({
    binding: 'DB',
    push: true,
  }),
})
