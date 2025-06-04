import { useState } from "react";
import createQueryParams from "@/utils/createQueryParams.ts";
import {BaseQueryParams} from "@/types/responses.ts";
import {useLocation, useNavigate } from "react-router-dom";
import {SortDirection, SortFieldAudit} from "@/types/sort.ts";

interface QueryParamsOptions {
    replaceURL?: boolean;
}

const useQueryParams = (options?: QueryParamsOptions,) => {
    const { replaceURL = true } = options || {};
    const navigate = useNavigate();
    const location = useLocation();
    const [queryParams, setQueryParams] = useState<BaseQueryParams>({
        search: '',
        page: 1,
        per_page: 10,
    });

    const updateQueryParams = (queryObject: Partial<BaseQueryParams>) => { // Use Partial for partial updates
        const newQueryParams = { ...queryParams, ...queryObject } as BaseQueryParams; // Merge and cast
        setQueryParams(newQueryParams);
        if (replaceURL) {
            // Use navigate for replacement, constructing the URL with location.pathname
            navigate(`${location.pathname}?${createQueryParams(newQueryParams)}`, { replace: true, state: location.state });
        }
    };

    const onPageChange = (val: number) => {
        updateQueryParams({ ...queryParams, page: val });
    };

    const onPageSizeChange = (val: number) => {
        updateQueryParams({ ...queryParams, per_page: val, page: 1 });
    };

    const onSearchChange = (val: string) => {
        updateQueryParams({ ...queryParams, search: val, page: 1 });
    };

    const onSortChange = (field: SortFieldAudit, direction: SortDirection) => {
        updateQueryParams({
            ...queryParams,
            page: 1, // Reset to first page on sort change
            sort_by: field,
            sort_order: direction,
        });
    };

    const onActionTypeChange = (actionType: string) => {
        updateQueryParams({
            action_type: actionType === "all" ? undefined : actionType, // Set to undefined if "all"
            page: 1, // Reset to first page on filter change
        });
    };

    return {
        onPageChange,
        onPageSizeChange,
        onSearchChange,
        onActionTypeChange,
        queryParams,
        onSortChange
    }
}

export default useQueryParams;
