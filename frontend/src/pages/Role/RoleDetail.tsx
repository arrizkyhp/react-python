import {useNavigate, useParams} from "react-router-dom";
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
import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/ui/PageHeader";

const groupPermissionsByCategory = (
    permissions: Permission[],
): Record<string, Permission[]> => {
    const grouped: Record<string, Permission[]> = {};

    permissions.forEach((permission) => {
        // Use the category field directly from the permission object
        const categoryName = permission.category || "Uncategorized"; // Fallback if category is null/missing

        if (!grouped[categoryName]) {
            grouped[categoryName] = [];
        }
        grouped[categoryName].push(permission);
    });

    // Optional: Sort permissions within each category by name for consistent display
    for (const category in grouped) {
        grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
};

const RoleDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State for editing mode
    const [isEditing, setIsEditing] = useState(false);
    // States for form fields
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

    const { data: roleData, isLoading, isError, error } = useGetData<
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

    const {
        mutate: updateRoleMutation,
        isLoading: isUpdating
    } = usePatchData(
        ['updateRole', String(id)], // Mutation key
        `/app/roles/${id}`, // URL for this specific role (changed from /app/permissions/${id})
        {
            options: {
                onSuccess: () => {
                    toast('Role updated successfully!', {
                        position: 'top-center',
                        icon: <Check />
                    });
                    // Invalidate and refetch role data to show updated information
                    // Or you can directly refetch if you want to be sure it's the latest
                    // refetchRoleData();
                    setIsEditing(false); // Exit editing mode after successful save
                },
                onError: (err: any) => { // Use any for err for now or define a more specific error type
                    const errorMessage = err?.response?.data?.message || err?.message || "Unknown error";
                    toast(`Update failed: ${errorMessage}`, {
                        position: 'top-center',
                        icon: <Check className="text-red-500" /> // Example: show a red check for error
                    });
                },
            },
        },
    );

    useEffect(() => {
        if (roleData) {
            setRoleName(roleData.name);
            setRoleDescription(roleData.description || "");
            // Set initial selected permissions from roleData
            setSelectedPermissionIds(roleData.permissions?.map(p => p.id) || []);
        }
    }, [roleData]);

    const handleBack = () => {
        if (isEditing) {
            if (window.confirm("You have unsaved changes. Are you sure you want to go back?")) {
                setIsEditing(false);
                // Optionally reset form state if you want to discard changes immediately
                if (roleData) {
                    setRoleName(roleData.name);
                    setRoleDescription(roleData.description || "");
                    setSelectedPermissionIds(roleData.permissions?.map(p => p.id) || []);
                }
                navigate("/role");
            }
        } else {
            navigate("/role");
        }
    }

    const handleEditClick = () => {
        setIsEditing(true);
    }

    const handleCancelClick = () => {
        if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
            setIsEditing(false);
            // Reset form states to current roleData values
            if (roleData) {
                setRoleName(roleData.name);
                setRoleDescription(roleData.description || "");
                setSelectedPermissionIds(roleData.permissions?.map(p => p.id) || []);
            }
        }
    }

    const handleSaveClick = () => {
        // Prepare the payload for the patch request
        const payload = {
            name: roleName,
            description: roleDescription,
            permission_ids: selectedPermissionIds, // Send only IDs
        };

        console.log(selectedPermissionIds)
        console.log(payload)
        updateRoleMutation(payload);
    }

    const togglePermission = (permissionId: number) => {
        setSelectedPermissionIds(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    // Group *all* available permissions by category
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
                                                    checked={selectedPermissionIds.includes(permission.id)} // Controlled by selectedPermissionIds
                                                    onCheckedChange={() => isEditing && togglePermission(permission.id)} // Only toggle if editing
                                                    disabled={!isEditing} // Enable/disable based on isEditing
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
