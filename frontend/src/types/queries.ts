export type FetchQueryExtras<T, TParam> = {
    options?: {
        enabled?: boolean;
        initialData?: T;
        retry?: number | boolean;
        // Add other react-query options you might need
    };
    params?: TParam;
    normalizer?: (data: any) => T; // Optional function to transform data
};
