import type { CollectionConfig } from 'payload'
import { isGuest } from '../access/roles'
export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', group: '01 - Access Control', description: 'Customers, Students, Prospects, and Guest demos' },
  auth: true,
  access: {
    read: ({ req }: any) => {
      if (!req.user) return false
      if (isGuest(req.user)) return true
      if (['super-admin','admin','collaborator'].includes(req.user?.role as string)) return true
      return { id: { equals: req.user.id } }
    },
    create: () => true,
    update: ({ req }: any) => {
      if (!req.user) return false
      if (isGuest(req.user)) return false
      if (['super-admin','admin'].includes(req.user?.role as string)) return true
      return req.user.id === (req as any).data?.id
    },
    delete: ({ req }: any) => ['super-admin','admin'].includes(req.user?.role as string),
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
