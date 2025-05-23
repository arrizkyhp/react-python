import {useNavigate, useParams, useLocation} from "react-router-dom"; // Import useLocation
import useGetData from "@/hooks/useGetData.ts";
import {Role, Permission} from "@/types/role.ts";
import {BaseQueryParams} from "@/types/responses.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {Check, Loader2} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {usePatchData} from "@/hooks/useMutateData.ts";
import {toast} from "sonner";
import {useEffect, useState, useCallback} from "react"; // Add useCallback
import {Input} from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/ui/PageHeader";

const groupPermissionsByCategory = (
    permissions: Permission[],
): Record<string, Permission[]> => {
    const grouped: Record<string, Permission[]> = {};

    permissions.forEach((permission) => {
        const categoryName = permission.category || "Uncategorized";

        if (!grouped[categoryName]) {
            grouped[categoryName] = [];
        }
        grouped[categoryName].push(permission);
    });

    for (const category in grouped) {
        grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
};

const RoleDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine initial isEditing based on URL path
    const initialIsEditingFromPath = location.pathname.endsWith('/edit');

    const [isEditing, setIsEditing] = useState(initialIsEditingFromPath);
    const [roleName, setRoleName] = useState("");
    const [roleDescription, setRoleDescription] = useState("");
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

    const { data: permissionsData, isLoading: isLoadingAllPermissions, isError: isErrorAllPermissions, error: errorAllPermissions } = useGetData<
        {items: Permission[], pagination: any},
        BaseQueryParams
    >(
        ["allPermission"],
        `/app/permissions`,
        {
            params: {
                page: 1,
                per_page: '1000',
            },
        },
    );

    const { data: roleData, isLoading, isError, error, refetch: refetchRoleData } = useGetData< // Add refetch
        Role,
        BaseQueryParams
    >(
        ["role", String(id)],
        `/app/roles/${id}`,
        {
            params: {
                role_id: String(id) || '',
            },
            options: {
                enabled: !!id,
            },
        },
    );

    // useCallback to memoize the reset function
    const resetFormFields = useCallback(() => {
        if (roleData) {
            setRoleName(roleData.name);
            setRoleDescription(roleData.description || "");
            setSelectedPermissionIds(roleData.permissions?.map(p => p.id) || []);
        }
    }, [roleData]); // Dependency on roleData

    // Effect to initialize form fields when roleData loads
    useEffect(() => {
        if (roleData) {
            // Only set form fields if not already editing, or if editing and it's the initial load
            // Otherwise, keep the user's edits.
            if (!isEditing || (isEditing && initialIsEditingFromPath)) {
                resetFormFields();
            }
        }
    }, [roleData, isEditing, initialIsEditingFromPath, resetFormFields]);

    // Effect to react to URL path changes (e.g., manual URL change, back/forward button)
    useEffect(() => {
        const currentIsEditingFromPath = location.pathname.endsWith('/edit');
        if (currentIsEditingFromPath !== isEditing) {
            setIsEditing(currentIsEditingFromPath);
            // If we're transitioning from edit to view, reset the form fields to original data
            if (!currentIsEditingFromPath) {
                resetFormFields();
            }
        }
    }, [location.pathname, isEditing, resetFormFields]); // Added resetFormFields to dependencies

    const {
        mutate: updateRoleMutation,
        isLoading: isUpdating
    } = usePatchData(
        ['updateRole', String(id)],
        `/app/roles/${id}`,
        {
            options: {
                onSuccess: () => {
                    toast('Role updated successfully!', {
                        position: 'top-center',
                        icon: <Check />
                    });
                    refetchRoleData(); // Refetch to ensure latest data is displayed
                    navigate(`/role/${id}`, { replace: true }); // Navigate back to detail view
                },
                onError: (err: any) => {
                    const errorMessage = err?.response?.data?.message || err?.message || "Unknown error";
                    toast(`Update failed: ${errorMessage}`, {
                        position: 'top-center',
                        icon: <Check className="text-red-500" />
                    });
                },
            },
        },
    );

    const handleBack = () => {
        if (isEditing) {
            if (window.confirm("You have unsaved changes. Are you sure you want to go back?")) {
                navigate(`/role/${id}`, { replace: true }); // Go to detail view URL
                // The useEffect for location.pathname will handle setIsEditing(false)
                // and resetFormFields for you.
            }
        } else {
            navigate("/role");
        }
    }

    const handleEditClick = () => {
        // Navigate to the edit URL. The useEffect will pick this up and set isEditing to true.
        navigate(`/role/${id}/edit`);
    }

    const handleCancelClick = () => {
        if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
            // Navigate back to the detail URL. The useEffect will pick this up.
            navigate(`/role/${id}`, { replace: true });
        }
    }

    const handleSaveClick = () => {
        const payload = {
            name: roleName,
            description: roleDescription,
            permission_ids: selectedPermissionIds,
        };
        updateRoleMutation(payload);
    }

    const togglePermission = (permissionId: number) => {
        setSelectedPermissionIds(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const allGroupedPermissions = permissionsData?.items ? groupPermissionsByCategory(permissionsData.items) : {};

    if (!id) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>No role ID provided in the URL.</AlertDescription>
            </Alert>
        );
    }

    if (isLoading || isLoadingAllPermissions) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading role details...</span>
            </div>
        );
    }

    if (isError || isErrorAllPermissions) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load data: {error?.response?.data?.message || error?.message || errorAllPermissions?.response?.data?.message || errorAllPermissions?.message || "Unknown error"}
                </AlertDescription>
            </Alert>
        );
    }

    if (!roleData) {
        return (
            <Alert variant="default">
                <AlertTitle>Not Found</AlertTitle>
                <AlertDescription>Role with ID "{id}" not found.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col mt-2 w-full">
            <PageHeader
                title={isEditing ? "Edit Role" : "Role Detail"}
                breadcrumbs={[
                    { label: "Role", href: "/role" },
                    { label: isEditing ? "Edit" : "Detail" },
                ]}
                onBack={handleBack}
                actions={
                    isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleCancelClick}
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleSaveClick}
                                disabled={isUpdating}
                            >
                                {isUpdating && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleEditClick}>
                            Edit Role
                        </Button>
                    )
                }
            />

            <Card className="mt-6">
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                            {isEditing ? (
                                <Input
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    className="mt-1"
                                />
                            ) : (
                                <p className="text-base font-medium">{roleName}</p>
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                            {isEditing ? (
                                <Textarea
                                    value={roleDescription}
                                    onChange={(e) => setRoleDescription(e.target.value)}
                                    className="mt-1"
                                />
                            ) : (
                                <p className="text-base font-medium">{roleDescription}</p>
                            )}
                        </div>
                    </div>
                    <Separator />
                    <div className="flex mt-6">
                        <h2 className="text-lg font-medium">Permissions</h2>
                    </div>

                    <div className="flex flex-col gap-6 pt-4">
                        {Object.keys(allGroupedPermissions).length > 0 ? (
                            Object.keys(allGroupedPermissions).sort().map((categoryName) => (
                                <div key={categoryName}>
                                    <h4 className="text-lg font-semibold mb-3">{categoryName}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pl-4">
                                        {allGroupedPermissions[categoryName].map((permission) => (
                                            <div key={permission.id} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={`permission-${permission.id}`}
                                                    checked={selectedPermissionIds.includes(permission.id)}
                                                    onCheckedChange={() => isEditing && togglePermission(permission.id)}
                                                    disabled={!isEditing}
                                                />
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor={`permission-${permission.id}`} className="font-medium">
                                                        {permission.name}
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 pl-4">No permissions available.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default RoleDetailPage;
