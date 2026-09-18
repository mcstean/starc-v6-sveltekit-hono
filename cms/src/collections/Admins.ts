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
