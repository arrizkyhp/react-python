import useQueryParams from "@/hooks/useQueryParams.ts";
import useGetData from "@/hooks/useGetData.ts";
import {BaseQueryParams, ListResponse} from "@/types/responses.ts";
import createQueryParams from "@/utils/createQueryParams.ts";
import DataTable from "@/components/ui/DataTable";
import { columns } from "./RoleList.constants";
import {Role} from "@/types/role.ts";
import {EyeIcon, PencilIcon, TrashIcon} from "lucide-react";
import {useNavigate} from "react-router-dom";

const RoleList = () => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()
    const navigate = useNavigate();

    const { data } = useGetData<ListResponse<Role>, BaseQueryParams>(
        ['roleList', createQueryParams(queryParams || {})],
        '/app/roles',
        {
            params: {
                page: queryParams.page,
                per_page: queryParams.per_page || '10',
            },
        }
    )

    const onDetailClick = (role: Role) => {
        navigate(`${role.id}`);
    }

    const onEditClick = () => {
        console.log("EDIT")
    }

    return (
        <div>
            <DataTable
                columns={columns}
                data={data?.items || []}
                rowActions={[
                    {
                        color: "secondary",
                        icon: <EyeIcon className="h-4 w-4" />,
                        onClick: (role) => onDetailClick(role),
                        tooltip: "View",
                    },
                    {
                        color: "default",
                        icon: <PencilIcon className="h-4 w-4" />,
                        onClick: (contact) => onEditClick(),
                        tooltip: "Edit",
                    },
                    {
                        color: "destructive",
                        icon: <TrashIcon className="h-4 w-4" />,
                        onClick: (contact) => onEditClick(),
                        tooltip: "Delete",
                    },
                ]}
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

export default RoleList
