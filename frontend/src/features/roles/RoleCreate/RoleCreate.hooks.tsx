import {useNavigate} from "react-router-dom";
import {useCallback, useMemo, useState} from "react";
import useGetData from "@/hooks/useGetData.ts";
import {Permission} from "@/types/permission.ts";
import {BaseQueryParams} from "@/types/responses.ts";
import {usePostData} from "@/hooks/useMutateData.ts";
import {toast} from "sonner";
import {Check, Loader2} from "lucide-react";
import {groupPermissionsByCategory} from "@/helpers/groupPermissionsByCategory.ts";
import {Button} from "@/components/ui/button.tsx";
import {usePageHeader} from "@/contexts/PageHeaderContext.tsx";
import { ENDPOINTS } from "@/constants/apiUrl";

const useRoleCreate = () => {
    const navigate = useNavigate();
    const {
        PERMISSIONS: {
            GET: GET_PERMISSIONS,
        },
        ROLES: {
            GET: GET_ROLES,
        }
    } = ENDPOINTS

    // States for form fields
    const [roleName, setRoleName] = useState("");
    const [roleDescription, setRoleDescription] = useState("");
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<
        number[]
    >([]);

    const {
        data: permissionsData,
        isLoading: isLoadingAllPermissions,
        isError: isErrorAllPermissions,
        error: errorAllPermissions,
    } = useGetData<
        { items: Permission[]; pagination: any },
        BaseQueryParams
    >(["allPermission"],
        GET_PERMISSIONS,
        {
            params: {
                page: 1,
                per_page: "1000",
        },
    });

    const {
        mutate: createRoleMutation,
        isLoading: isCreating,
    } = usePostData(
        ["createRole"], // Mutation key
        GET_ROLES, // URL for creating a new role
        {
            options: {
                onSuccess: () => {
                    toast("Role created successfully!", {
                        position: "top-center",
                        icon: <Check />,
                    });
                    navigate("/roles");
                },
                onError: (err: any) => {
                    const errorMessage =
                        err?.response?.data?.message || err?.message || "Unknown error";
                    toast(`Creation failed: ${errorMessage}`, {
                        position: "top-center",
                        icon: <Check className="text-red-500" />,
                    });
                },
            },
        },
        ["roles"], // Invalidate 'roles' query to refetch the list
    );

    const handleBack = () => {
        // If the form has any unsaved changes, prompt the user
        if (
            roleName !== "" ||
            roleDescription !== "" ||
            selectedPermissionIds.length > 0
        ) {
            if (
                window.confirm(
                    "You have unsaved changes. Are you sure you want to go back?",
                )
            ) {
                navigate("/roles");
            }
        } else {
            navigate("/roles");
        }
    };

    const handleCreateClick = useCallback(() => {
        const payload = {
            name: roleName,
            description: roleDescription,
            permission_ids: selectedPermissionIds,
        };
        createRoleMutation(payload);
    }, [roleName, roleDescription, selectedPermissionIds, createRoleMutation]);

    const togglePermission = (permissionId: number) => {
        setSelectedPermissionIds((prev) =>
            prev.includes(permissionId)
                ? prev.filter((id) => id !== permissionId)
                : [...prev, permissionId],
        );
    };

    const allGroupedPermissions = permissionsData?.items
        ? groupPermissionsByCategory(permissionsData.items)
        : {};

    const userHeaderConfig = useMemo(() => ({
        title: "Create New Role",
        breadcrumbs: [
            { label: "Role", href: "/roles" },
            { label: "Create" },
        ],
        onBack: handleBack,
        actions: (
            <>
                <Button variant="outline" onClick={handleBack} disabled={isCreating}>
                    Cancel
                </Button>
                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleCreateClick}
                    disabled={isCreating}
                >
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Role
                </Button>
            </>
        )
    }), [handleCreateClick, isCreating]);

    usePageHeader(userHeaderConfig);


    return {
        isLoadingAllPermissions,
        isErrorAllPermissions,
        errorAllPermissions,
        roleName,
        setRoleName,
        roleDescription,
        setRoleDescription,
        allGroupedPermissions,
        selectedPermissionIds,
        togglePermission
    }
}

export default useRoleCreate
