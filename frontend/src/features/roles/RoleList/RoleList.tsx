import useQueryParams from "@/hooks/useQueryParams.ts";
import useGetData from "@/hooks/useGetData.ts";
import {BaseQueryParams, ListResponse} from "@/types/responses.ts";
import createQueryParams from "@/utils/createQueryParams.ts";
import DataTable from "@/components/ui/DataTable";
import { columns } from "./RoleList.constants";
import {Role} from "@/types/role.ts";
import {Check, EyeIcon, PencilIcon, TrashIcon} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useState} from "react";
import {useDeleteData} from "@/hooks/useMutateData.ts";
import {toast} from "sonner";

const RoleList = () => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()
    const navigate = useNavigate();

    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const [deleteRoleId, setDeleteRoleId] = useState('');
    const [deleteRoleName, setDeleteRoleName] = useState('');

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

    const {
        mutate: deleteRoleMutation,
    } = useDeleteData<void, number>(
        ['deleteContact', String(deleteRoleId)],
        `/app/roles/${deleteRoleId}`,
        {
            options: {
                onSuccess: () => {
                    toast('Role deleted successfully', {
                        position: 'top-center',
                        icon: <Check />
                    });
                    setIsAlertDialogOpen(false);
                    setDeleteRoleId('');
                    setDeleteRoleName('');

                },
                onError: (err) => toast(`Delete failed: ${err.message}`),
            },
        },
        ['roleList'], // Invalidate the contacts list after deletion
    );

    const onDetailClick = (role: Role) => {
        navigate(`${role.id}`);
    }

    const onEditClick = (role: Role) => {
        navigate(`${role.id}/edit`); // Navigate directly to the edit URL
    }

    const onDeleteClick = (role: Role) => {
        setDeleteRoleId(String(role.id))
        setIsAlertDialogOpen(true)
        setDeleteRoleName(role.name)
    }

    const handleDeleteRoleConfirm = () => {
        if (deleteRoleId !== '') {
            deleteRoleMutation(Number(deleteRoleId));
        }
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
                        onClick: (role) => onEditClick(role),
                        tooltip: "Edit",
                    },
                    {
                        color: "destructive",
                        icon: <TrashIcon className="h-4 w-4" />,
                        onClick: (role) => onDeleteClick(role),
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

            <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this contact?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the contact:
                            <br/>
                            <span className="font-bold"> {deleteRoleName}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={handleDeleteRoleConfirm} className="bg-red-600 hover:bg-red-700">Delete</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default RoleList
