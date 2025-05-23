import { useNavigate } from "react-router-dom";
import { Permission } from "@/types/role.ts";
import { BaseQueryParams } from "@/types/responses.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea";
import useGetData from "@/hooks/useGetData.ts";
import { usePostData } from "@/hooks/useMutateData.ts"; // Assuming this is where usePostData is
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

const RoleCreatePage = () => {
    const navigate = useNavigate();

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
    >(["allPermission"], `/app/permissions`, {
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
        "/app/roles", // URL for creating a new role
        {
            options: {
                onSuccess: () => {
                    toast("Role created successfully!", {
                        position: "top-center",
                        icon: <Check />,
                    });
                    // Navigate back to the role list or to the new role's detail page
                    navigate("/role");
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
                navigate("/role");
            }
        } else {
            navigate("/role");
        }
    };

    const handleCreateClick = () => {
        // Prepare the payload for the post request
        const payload = {
            name: roleName,
            description: roleDescription,
            permission_ids: selectedPermissionIds, // Send only IDs
        };

        createRoleMutation(payload);
    };

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

    if (isLoadingAllPermissions) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading permissions...</span>
            </div>
        );
    }

    if (isErrorAllPermissions) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load permissions:{" "}
                    {errorAllPermissions?.response?.data?.message ||
                        errorAllPermissions?.message ||
                        "Unknown error"}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col mt-2 w-full">
            <PageHeader
                title="Create New Role"
                breadcrumbs={[
                    { label: "Role", href: "/role" },
                    { label: "Create" },
                ]}
                onBack={handleBack}
                actions={
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
                }
            />

            <Card className="mt-6">
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                        <div>
                            <Label htmlFor="roleName">Name<span className="text-red-500">*</span></Label>
                            <Input
                                id="roleName"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="roleDescription">Description</Label>
                            <Textarea
                                id="roleDescription"
                                value={roleDescription}
                                onChange={(e) => setRoleDescription(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <Separator />
                    <div className="flex mt-6">
                        <h2 className="text-lg font-medium">Permissions</h2>
                    </div>

                    <div className="flex flex-col gap-6 pt-4">
                        {Object.keys(allGroupedPermissions).length > 0 ? (
                            Object.keys(allGroupedPermissions)
                                .sort()
                                .map((categoryName) => (
                                    <div key={categoryName}>
                                        <h4 className="text-lg font-semibold mb-3">{categoryName}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pl-4">
                                            {allGroupedPermissions[categoryName].map((permission) => (
                                                <div
                                                    key={permission.id}
                                                    className="flex items-start space-x-2"
                                                >
                                                    <Checkbox
                                                        id={`permission-${permission.id}`}
                                                        checked={selectedPermissionIds.includes(
                                                            permission.id,
                                                        )}
                                                        onCheckedChange={() =>
                                                            togglePermission(permission.id)
                                                        }
                                                    />
                                                    <div className="grid gap-1.5">
                                                        <Label
                                                            htmlFor={`permission-${permission.id}`}
                                                            className="font-medium"
                                                        >
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
    );
};

export default RoleCreatePage;
