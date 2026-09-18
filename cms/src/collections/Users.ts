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
