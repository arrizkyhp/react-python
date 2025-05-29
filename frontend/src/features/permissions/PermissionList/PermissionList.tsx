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
import {EyeIcon} from "lucide-react";
import {Permission} from "@/types/permission.ts";
import {Sheet, SheetContent} from "@/components/ui/sheet.tsx";
import PermissionForm from "@/features/permissions/PermissionForm";

const PermissionList = () => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()
    const { PERMISSIONS: { GET } } = ENDPOINTS

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<Permission>({
        id: 0,
        category: "",
        description: "",
        name: "",
        status: "",
        usage: 0,
        affected_roles: [],
    });

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

    const handleDetailClick = (permission: Permission) => {
        setSelectedPermissions(permission)
        setIsSheetOpen(true)
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent>
                        <PermissionForm
                            data={selectedPermissions}
                        />
                        {/*<ContactForm*/}
                        {/*    isEdit={!!editingContactId}*/}
                        {/*    handleSubmit={handleSubmit}*/}
                        {/*    firstName={firstName}*/}
                        {/*    lastName={lastName}*/}
                        {/*    email={email}*/}
                        {/*    setFirstName={setFirstName}*/}
                        {/*    setLastName={setLastName}*/}
                        {/*    setEmail={setEmail}*/}
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
