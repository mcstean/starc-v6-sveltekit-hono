#!/usr/bin/env python3
"""
STARC CMS - Complete Script
- E-commerce + LMS + Multi-role Admin/Users + Guest Demo (read-only)
- Run: python3 ./starc_complete.py
"""

from pathlib import Path
ROOT = Path.cwd()
print(f"Project root: {ROOT}")

def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"  -> {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}")

roles_ts = """
// Shared role helpers - prevents guest-demo from affecting the site
export const isSuperAdmin = (user: any) => user?.role === 'super-admin'
export const isAdmin = (user: any) => ['super-admin', 'admin'].includes(user?.role)
export const isCollaborator = (user: any) => ['super-admin', 'admin', 'collaborator'].includes(user?.role)
export const isGuest = (user: any) => user?.role === 'guest-demo'
export const onlySuperAdmin = ({ req: { user } }: any) => user?.role === 'super-admin'
"""

admins_ts = """
import type { CollectionConfig } from 'payload'
import { isSuperAdmin, isGuest } from '../access/roles'
export const Admins: CollectionConfig = {
  slug: 'admins',
  admin: { useAsTitle: 'email', group: '01 - Access Control', description: 'System owners, admins, collaborators, and read-only guest demos' },
  auth: { tokenExpiration: 7200 },
  access: {
    read: () => true,
    create: ({ req }) => { if (!req.user) return true; if (isGuest(req.user)) return false; return ['super-admin','admin'].includes(req.user.role) },
    update: ({ req }) => { if (!req.user) return false; if (isGuest(req.user)) return false; if (isSuperAdmin(req.user)) return true; return req.user.role === 'admin' || req.user.id === req.data?.id },
    delete: ({ req }) => req.user?.role === 'super-admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'select', required: true, defaultValue: 'collaborator', options: [
        { label: 'Super Admin - Owner (no guest version)', value: 'super-admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Collaborator - Can edit products, pages, courses', value: 'collaborator' },
        { label: 'Guest Demo - READ ONLY for clients', value: 'guest-demo' },
      ]},
    { name: 'bio', type: 'textarea' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
  ],
}
"""

users_ts = """
import type { CollectionConfig } from 'payload'
import { isGuest } from '../access/roles'
export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', group: '01 - Access Control', description: 'Customers, Students, Prospects, Guest demos' },
  auth: true,
  access: {
    read: ({ req }) => { if (!req.user) return false; if (isGuest(req.user)) return true; if (['super-admin','admin','collaborator'].includes(req.user?.role)) return true; return { id: { equals: req.user.id } } },
    create: () => true,
    update: ({ req }) => { if (!req.user) return false; if (isGuest(req.user)) return false; return ['super-admin','admin'].includes(req.user.role) || req.user.id === req.data?.id },
    delete: ({ req }) => ['super-admin','admin'].includes(req.user?.role),
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'role', type: 'select', defaultValue: 'customer', options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Student - LMS learner', value: 'student' },
        { label: 'Client Prospect', value: 'client-prospect' },
        { label: 'VIP', value: 'vip' },
        { label: 'Guest Demo - READ ONLY', value: 'guest-demo' },
      ]},
    { name: 'company', type: 'text' },
    { name: 'enrollments', type: 'join', collection: 'enrollments', on: 'student' },
    { name: 'orders', type: 'join', collection: 'orders', on: 'customer' },
  ],
}
"""

media_ts = "import type { CollectionConfig } from 'payload'\nexport const Media: CollectionConfig = { slug: 'media', admin: { group: '02 - Content' }, upload: {}, access: { read: () => true, create: ({ req }: any) => req.user?.role !== 'guest-demo', update: ({ req }: any) => req.user?.role !== 'guest-demo', delete: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role) }, fields: [{ name: 'alt', type: 'text', required: true }] }"
pages_ts = "import type { CollectionConfig } from 'payload'\nexport const Pages: CollectionConfig = { slug: 'pages', admin: { useAsTitle: 'title', group: '02 - Content' }, access: { read: () => true, create: ({ req }: any) => req.user?.role !== 'guest-demo', update: ({ req }: any) => req.user?.role !== 'guest-demo', delete: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role) }, fields: [{ name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true }, { name: 'content', type: 'richText' }, { name: 'status', type: 'select', defaultValue: 'draft', options: ['draft','published'] }] }"
categories_ts = "import type { CollectionConfig } from 'payload'\nexport const Categories: CollectionConfig = { slug: 'categories', admin: { useAsTitle: 'name', group: '03 - E-commerce' }, access: { read: () => true, create: ({ req }: any) => req.user?.role !== 'guest-demo', update: ({ req }: any) => req.user?.role !== 'guest-demo', delete: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role) }, fields: [{ name: 'name', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true }, { name: 'description', type: 'textarea' }] }"
products_ts = "import type { CollectionConfig } from 'payload'\nexport const Products: CollectionConfig = { slug: 'products', admin: { useAsTitle: 'title', group: '03 - E-commerce' }, access: { read: () => true, create: ({ req }: any) => req.user?.role !== 'guest-demo', update: ({ req }: any) => req.user?.role !== 'guest-demo', delete: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role) }, fields: [{ name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true }, { name: 'description', type: 'richText' }, { name: 'price', type: 'number', required: true }, { name: 'stock', type: 'number', defaultValue: 0 }, { name: 'category', type: 'relationship', relationTo: 'categories' }, { name: 'images', type: 'upload', relationTo: 'media', hasMany: true }] }"
orders_ts = "import type { CollectionConfig } from 'payload'\nexport const Orders: CollectionConfig = { slug: 'orders', admin: { group: '03 - E-commerce' }, access: { read: ({ req }: any) => !!req.user, create: ({ req }: any) => req.user?.role !== 'guest-demo', update: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role), delete: ({ req }: any) => req.user?.role === 'super-admin' }, fields: [{ name: 'customer', type: 'relationship', relationTo: 'users', required: true }, { name: 'total', type: 'number', required: true }, { name: 'status', type: 'select', defaultValue: 'pending', options: ['pending','paid','shipped','completed'] }] }"
courses_ts = "import type { CollectionConfig } from 'payload'\nexport const Courses: CollectionConfig = { slug: 'courses', admin: { useAsTitle: 'title', group: '04 - LMS', description: 'Host learning materials' }, access: { read: () => true, create: ({ req }: any) => ['super-admin','admin','collaborator'].includes(req.user?.role) && req.user?.role !== 'guest-demo', update: ({ req }: any) => req.user?.role !== 'guest-demo', delete: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role) }, fields: [{ name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true }, { name: 'description', type: 'richText', required: true }, { name: 'instructor', type: 'relationship', relationTo: 'admins' }, { name: 'thumbnail', type: 'upload', relationTo: 'media' }, { name: 'price', type: 'number', defaultValue: 0 }, { name: 'level', type: 'select', defaultValue: 'beginner', options: ['beginner','intermediate','advanced'] }, { name: 'status', type: 'select', defaultValue: 'draft', options: ['draft','published'] }] }"
lessons_ts = "import type { CollectionConfig } from 'payload'\nexport const Lessons: CollectionConfig = { slug: 'lessons', admin: { useAsTitle: 'title', group: '04 - LMS' }, access: { read: () => true, create: ({ req }: any) => req.user?.role !== 'guest-demo', update: ({ req }: any) => req.user?.role !== 'guest-demo', delete: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role) }, fields: [{ name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true }, { name: 'course', type: 'relationship', relationTo: 'courses', required: true }, { name: 'order', type: 'number', defaultValue: 0 }, { name: 'content', type: 'richText', required: true }, { name: 'videoUrl', type: 'text' }, { name: 'isPreview', type: 'checkbox', defaultValue: false }] }"
enrollments_ts = "import type { CollectionConfig } from 'payload'\nexport const Enrollments: CollectionConfig = { slug: 'enrollments', admin: { group: '04 - LMS' }, access: { read: ({ req }: any) => !!req.user, create: ({ req }: any) => !!req.user && req.user?.role !== 'guest-demo', update: ({ req }: any) => true, delete: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role) }, fields: [{ name: 'student', type: 'relationship', relationTo: 'users', required: true }, { name: 'course', type: 'relationship', relationTo: 'courses', required: true }, { name: 'progress', type: 'number', defaultValue: 0 }, { name: 'completed', type: 'checkbox', defaultValue: false }] }"

payload_config_ts = """
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
  admin: { user: 'admins' },
  editor: lexicalEditor({}),
  db: sqliteD1Adapter({ binding: 'DB' }),
  collections: [Admins, Users, Media, Pages, Categories, Products, Orders, Courses, Lessons, Enrollments],
  secret: process.env.PAYLOAD_SECRET || 'CHANGE_ME_32_CHARS_MINIMUM',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  sharp: false,
})
"""

write(ROOT / "src" / "access" / "roles.ts", roles_ts)
write(ROOT / "src" / "collections" / "Admins.ts", admins_ts)
write(ROOT / "src" / "collections" / "Users.ts", users_ts)
write(ROOT / "src" / "collections" / "Media.ts", media_ts)
write(ROOT / "src" / "collections" / "Pages.ts", pages_ts)
write(ROOT / "src" / "collections" / "Categories.ts", categories_ts)
write(ROOT / "src" / "collections" / "Products.ts", products_ts)
write(ROOT / "src" / "collections" / "Orders.ts", orders_ts)
write(ROOT / "src" / "collections" / "Courses.ts", courses_ts)
write(ROOT / "src" / "collections" / "Lessons.ts", lessons_ts)
write(ROOT / "src" / "collections" / "Enrollments.ts", enrollments_ts)
write(ROOT / "src" / "payload.config.ts", payload_config_ts)
print("DONE - E-commerce + LMS + guest-demo read-only created")
