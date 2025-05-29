export const ENDPOINTS = {
    USERS: {
        GET: '/app/users',
    },
    ROLES: {
        GET: '/app/roles',
        GET_BY_ID: (id: string) => `/app/roles/${id}`,
    },
    PERMISSIONS: {
        GET: '/app/permissions',
        GET_BY_ID: (id: string) => `/app/permissions/${id}`
    },
    CONTACTS: {
        GET: '/app/contacts',
        GET_BY_ID: (id: string) => `/app/contacts/${id}`,
        CREATE: '/app/contacts',
        UPDATE: (id: string) => `/app/contacts/${id}`,
        DELETE: (id: string) => `/app/contacts/${id}`,
    }
}
