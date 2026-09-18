// Shared role helpers - prevents guest-demo from affecting the site
export const isSuperAdmin = (user: any) => user?.role === 'super-admin'
export const isAdmin = (user: any) => ['super-admin', 'admin'].includes(user?.role)
export const isCollaborator = (user: any) => ['super-admin', 'admin', 'collaborator'].includes(user?.role)
export const isGuest = (user: any) => user?.role === 'guest-demo'
export const onlySuperAdmin = ({ req: { user } }: any) => user?.role === 'super-admin'
