import {useMemo} from "react";
import {usePageHeader} from "@/contexts/PageHeaderContext.tsx";
import useGetData from "@/hooks/useGetData.ts";
import {BaseQueryParams} from "@/types/responses.ts";
import createQueryParams from "@/utils/createQueryParams.ts";
import {PermissionResponse} from "@/features/permissions/PermissionList/PermissionList.types.ts";
import useQueryParams from "@/hooks/useQueryParams.ts";
import { ENDPOINTS } from "@/constants/apiUrl";
import DataTable from "@/components/ui/DataTable";
import { columns } from "./PermissionList.constants";

const PermissionList = () => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()
    const { PERMISSIONS: { GET } } = ENDPOINTS

    const userHeaderConfig = useMemo(() => ({
        title: "Permission List",
        breadcrumbs: [{ label: "Permission List" }],
        showBackButton: false,
    }), []);

    usePageHeader(userHeaderConfig);

    const { data } = useGetData<PermissionResponse, BaseQueryParams>(
        ['permissionList', createQueryParams(queryParams || {})],
        GET,
        {
            params: {
                page: queryParams.page,
                per_page: queryParams.per_page || '10',
                status: queryParams.status,
                include_usage: queryParams.include_usage ?? true,
            },
        }
    )

    console.log(data)

    return (
        <>
            <div className="flex flex-col gap-4">
                AA
            </div>
            <DataTable
                columns={columns}
                data={data?.items || []}
                // rowActions={[
                //     {
                //         color: "secondary",
                //         icon: <UserCog className="h-4 w-4" />,
                //         onClick: (user) => handleOpenAssignUser(user),
                //         tooltip: "Assign Role",
                //     },
                //
                // ]}
                pagination={{
                    currentPage: data?.pagination.current_page || 1,
                    totalPages: data?.pagination.total_pages || 1,
                    totalItems: data?.pagination.total_items || 0,
                    onPageChange: onPageChange,
                    onPageSizeChange: onPageSizeChange
                }}
            />
        </>
    )
}

export default PermissionList;
