import { useState } from "react";
import createQueryParams from "@/utils/createQueryParams.ts";
import {BaseQueryParams} from "@/types/response.ts";
import {useLocation, useNavigate } from "react-router-dom";

interface QueryParamsOptions {
    replaceURL?: boolean;
}

const useQueryParams = (options?: QueryParamsOptions,) => {
    const { replaceURL = true } = options || {};
    const navigate = useNavigate();
    const location = useLocation();
    const [queryParams, setQueryParams] = useState<BaseQueryParams>({
        page: 1,
        per_page: '5',
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

    return {
        onPageChange,
        onPageSizeChange,
        queryParams
    }
}

export default useQueryParams;
