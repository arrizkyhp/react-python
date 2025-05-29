export interface AffectedRoles {
    id: number;
    name: string;
}

export interface Permission {
    id: number;
    category: string;
    description: string;
    name: string;
    status?: string;
    usage?: number;
    affected_roles?: AffectedRoles[];
}
