import { buildConfig } from 'payload'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { Admins } from './collections/Admins'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { Courses } from './collections/Courses'
import { Lessons } from './collections/Lessons'
import { Enrollments } from './collections/Enrollments'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://starc-cms.quickd.workers.dev',
  admin: { user: 'admins', meta: { titleSuffix: ' - STARC CMS' } },
  editor: lexicalEditor({}),
  db: sqliteD1Adapter({ binding: 'DB' }),
  collections: [Admins, Users, Media, Pages, Categories, Products, Orders, Courses, Lessons, Enrollments],
  secret: process.env.PAYLOAD_SECRET || 'CHANGE_ME_32_CHARS_MINIMUM_123456789012',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
