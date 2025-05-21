import useQueryParams from "@/hooks/useQueryParams.ts";
import DataTable from "@/components/ui/DataTable";
import {columns} from "@/features/users/UserList/UserList.constants.tsx";
import useGetData from "@/hooks/useGetData.ts";
import createQueryParams from "@/utils/createQueryParams.ts";
import {FetchUsersResponse} from "@/features/users/UserList/UserList.types.ts";
import {BaseQueryParams} from "@/types/responses.ts";

const UserList = () => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()

    const { data } = useGetData<FetchUsersResponse, BaseQueryParams>(
        ['userList', createQueryParams(queryParams || {})],
        '/app/users',
        {
            params: {
                page: queryParams.page,
                per_page: queryParams.per_page || '10',
            },
        }
    )

    return (
        <div>
            <DataTable
                columns={columns}
                data={data?.items || []}
                pagination={{
                    currentPage: data?.pagination.current_page || 1,
                    totalPages: data?.pagination.total_pages || 1,
                    totalItems: data?.pagination.total_items || 0,
                    onPageChange: onPageChange,
                    onPageSizeChange: onPageSizeChange
                }}
            />
        </div>
    )
}

export default UserList
