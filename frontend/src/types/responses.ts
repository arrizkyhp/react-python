export type QueryObject = Record<string, string | number | undefined>;

export type BaseQueryParams = {
    s?: string;
    page?: number;
    size?: number;
} & QueryObject;

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

export interface BaseError {
    message?: string;
    errors?: Record<string, string[]>;
    code?: string;
    status?: number;
}

export interface ListResponse<T> {
    items: T[];
    pagination: PaginationInfo;
}
