import useQueryParams from "@/hooks/useQueryParams.ts";
import {useQuery} from "@tanstack/react-query";
import { fetchUsers } from "../fetch";
import DataTable from "@/components/ui/DataTable";
import {columns} from "@/features/users/UserList/UserList.constants.tsx";

const UserList = () => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()

    const { data } = useQuery({
        queryKey: ['userList', queryParams],
        queryFn: () => fetchUsers(queryParams),
    })

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
