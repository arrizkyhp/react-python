export type QueryObject = Record<string, string | number | undefined>;

export type BaseQueryParams = {
    s?: string;
    page: number;
    size?: number;
} & QueryObject;
