import {useMemo, useState} from "react";
import {usePageHeader} from "@/contexts/PageHeaderContext.tsx";
import useGetData from "@/hooks/useGetData.ts";
import {BaseQueryParams} from "@/types/responses.ts";
import createQueryParams from "@/utils/createQueryParams.ts";
import {PermissionResponse} from "@/features/permissions/PermissionList/PermissionList.types.ts";
import useQueryParams from "@/hooks/useQueryParams.ts";
import { ENDPOINTS } from "@/constants/apiUrl";
import DataTable from "@/components/ui/DataTable";
import { columns } from "./PermissionList.constants";
import {EyeIcon, PencilIcon} from "lucide-react";
import {Permission} from "@/types/permission.ts";
import {Sheet, SheetContent} from "@/components/ui/sheet.tsx";
import PermissionDetail from "@/features/permissions/PermissionDetail";
import {Button} from "@/components/ui/button.tsx";

const PermissionList = () => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()
    const { PERMISSIONS: { GET } } = ENDPOINTS

    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

    const [selectedPermissions, setSelectedPermissions] = useState<Permission>({
        id: 0,
        category: "",
        description: "",
        name: "",
        status: "",
        usage: 0,
        affected_roles: [],
    });



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

    const handleDetailClick = (permission: Permission) => {
        setSelectedPermissions(permission)
        setIsDetailSheetOpen(true)
    }

    const handleEditClick = (permission: Permission) => {
        setSelectedPermissions(permission);
        setIsEditSheetOpen(true);
    };

    const handleCreateClick = () => {
        setIsEditSheetOpen(true);
    };

    const userHeaderConfig = useMemo(() => ({
        title: "Permission List",
        breadcrumbs: [{ label: "Permission List" }],
        showBackButton: false,
        actions: (
            <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCreateClick}
            >
                Create Permission
            </Button>
        )
    }), []);

    usePageHeader(userHeaderConfig);

    return (
        <>
            <div className="flex flex-col gap-4">
                <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
                    <SheetContent>
                        <PermissionDetail
                            data={selectedPermissions}
                        />

                    </SheetContent>
                </Sheet>

                <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                    <SheetContent>
                        Edit

                        {/*<PermissionEdit*/}
                        {/*    data={selectedPermissions}*/}
                        {/*    onClose={() => setIsEditSheetOpen(false)} // Pass a close handler*/}
                        {/*/>*/}
                    </SheetContent>
                </Sheet>
            </div>
            <DataTable
                columns={columns}
                data={data?.items || []}
                rowActions={[
                    {
                        label: "View Details",
                        color: "secondary",
                        icon: <EyeIcon className="h-4 w-4" />,
                        onClick: (permission) => handleDetailClick(permission),
                        tooltip: "View",
                    },
                    {
                        label: "Edit",
                        color: "default",
                        icon: <PencilIcon className="h-4 w-4" />,
                        onClick: (permission) => handleEditClick(permission),
                        tooltip: "Edit",
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
        </>
    )
}

export default PermissionList;
