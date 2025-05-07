export interface Contact {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export interface PaginationInfo {
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    next_num: number | null;
    per_page: number;
    prev_num: number | null;
    total_items: number;
    total_pages: number;
}
