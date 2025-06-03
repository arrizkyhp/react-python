import {Clock, Plus, SquarePen, Trash2, User} from "lucide-react";
import {ENDPOINTS} from "@/constants/apiUrl.ts";
import useGetData from "@/hooks/useGetData.ts";
import {BaseQueryParams, ListResponse} from "@/types/responses.ts";
import {AuditTrail} from "@/types/auditTrail.ts";
import { Card, CardContent } from "@/components/ui/card";
import {Badge} from "@/components/ui/badge.tsx";
import {cn} from "@/lib/utils.ts";
import { formatDateTimeUS } from "@/lib/date-utils";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import { Button } from "@/components/ui/button";
import useQueryParams from "@/hooks/useQueryParams.ts";
import createQueryParams from "@/utils/createQueryParams.ts";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RoleAuditTrail = () => {
    const {
        AUDIT_TRAIL: {
            GET: GET_AUDIT_TRAIL,
        }
    } = ENDPOINTS;

    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()

    const { data: dataAuditTrail } = useGetData<ListResponse<AuditTrail>, BaseQueryParams>(
        ['auditTrailRole', createQueryParams(queryParams || {})],
        GET_AUDIT_TRAIL,
        {
            params: {
                entity_type: 'Role',
                page: queryParams.page,
                per_page: queryParams.per_page || '10',
            }
        }
    )

    const { items, pagination } = dataAuditTrail ?? {}

    const getBadgeColorClass = (actionType: AuditTrail["action_type"]) => {
        switch (actionType) {
            case "DELETE":
                return "bg-red-500 hover:bg-red-500/80"; // Using Tailwind CSS classes for red
            case "CREATE":
                return "bg-green-500 hover:bg-green-500/80"; // Using Tailwind CSS classes for green
            case "UPDATE":
                return "bg-blue-500 hover:bg-blue-500/80"; // Using Tailwind CSS classes for blue
            default:
                return ""; // Default or no specific color
        }
    };

    const renderChangeDetails = (auditTrail: AuditTrail) => {
        if (auditTrail.action_type !== "UPDATE" || !auditTrail.field_name) {
            return null; // Only render specific changes for UPDATEs with a field_name
        }

        switch (auditTrail.field_name) {
            case 'name':
            case 'description':
            case 'status':
                return (
                    <p>
                        <span className="font-medium">{auditTrail.field_name}</span>
                        : "
                        <span className="text-red-500">{auditTrail.old_value as string}</span>" → "
                        <span className="text-green-500">{auditTrail.new_value as string}</span>"
                    </p>
                );
            case 'permissions':
                // For permissions, auditTrail.old_value and new_value are arrays of {id, name} objects
                const oldPerms: { id: number; name: string }[] = auditTrail.old_value || [];
                const newPerms: { id: number; name: string }[] = auditTrail.new_value || [];

                // Convert arrays of objects to sets of IDs for efficient comparison
                const oldPermIds = new Set(oldPerms.map(p => p.id));
                const newPermIds = new Set(newPerms.map(p => p.id));

                // Find permissions that were added
                const addedPerms = newPerms.filter(p => !oldPermIds.has(p.id));
                // Find permissions that were removed
                const removedPerms = oldPerms.filter(p => !newPermIds.has(p.id));

                return (
                    <>
                        {addedPerms.length > 0 && (
                            <p className="text-green-600">
                                Added: {addedPerms.map(p => p.name).join(', ')}
                            </p>
                        )}
                        {removedPerms.length > 0 && (
                            <p className="text-red-600">
                                Removed: {removedPerms.map(p => p.name).join(', ')}
                            </p>
                        )}
                        {/* If no specific added/removed but field_name is 'permissions', it implies a change */}
                        {addedPerms.length === 0 && removedPerms.length === 0 && (
                            <p className="text-neutral-500">
                                Permissions changed (details in description).
                            </p>
                        )}
                    </>
                );
        }
    };

    const startIndex = pagination
        ? (pagination.current_page - 1) * pagination.per_page + 1
        : 0;
    const endIndex = pagination
        ? Math.min(
            startIndex + (items?.length || 0) - 1,
            pagination.total_items,
        )
        : 0;


    return (
        <div className="mt-2">
            <div className="flex gap-2 items-center">
                <Clock className="h-5 w-5"/>
                <h2 className="font-semibold text-2xl">Role Management Audit Trail</h2>
            </div>
            <div>
                <Select
                    onValueChange={(value) => {
                        if (pagination && onPageSizeChange) {
                            onPageSizeChange(Number(value));
                        }
                    }}
                    defaultValue={String(pagination?.per_page) || '10'}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select page size" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <ScrollArea className="h-[500px] pr-4 mt-4">
                <div className="flex flex-col gap-2">
                    {items?.map((auditTrail) => (
                        <Card key={auditTrail.id} className="rounded-sm shadow-none">
                            <CardContent className="px-4">
                                <div className="flex items-start gap-2">
                                    <div className="flex p-2 items-center rounded-full bg-gray-100">
                                        <div className="flex p-2 items-center rounded-full bg-gray-100">
                                            {auditTrail.action_type === "UPDATE" && (
                                                <SquarePen className="w-4 h-4" />
                                            )}
                                            {auditTrail.action_type === "CREATE" && (
                                                <Plus className="w-4 h-4" />
                                            )}
                                            {auditTrail.action_type === "DELETE" && (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex gap-2 text-sm">
                                            <Badge
                                                className={cn(
                                                    "uppercase",
                                                    getBadgeColorClass(auditTrail.action_type),
                                                )}
                                            >
                                                {auditTrail.action_type}
                                            </Badge>
                                            <p className="font-bold">{auditTrail.entity_type}</p>
                                            <p className="text-neutral-500">#{auditTrail.entity_id}</p>
                                        </div>
                                        <div className="text-sm ">
                                            <p>{auditTrail.description}</p>
                                        </div>
                                        <div className="flex gap-2 items-center text-xs text-gray-500">
                                            <User className="w-3 h-3"/>
                                            <p>{auditTrail.user_details.username}</p>
                                            <p>•</p>
                                            <p>{formatDateTimeUS(auditTrail.timestamp)}</p>
                                        </div>
                                        {auditTrail.action_type === "UPDATE" && (
                                            <div className="text-sm p-3 bg-neutral-100 w-full rounded-md mt-2"> {/* Adjusted padding and added mt-2 */}
                                                <p className="font-semibold mb-1">Changes:</p>
                                                {renderChangeDetails(auditTrail)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>

            <div className="flex justify-between w-full items-center mt-2">
                <div>
                    {pagination && pagination.total_items > 0 ? (
                        <>
                            Showing {startIndex} to {endIndex} of{" "}
                            {pagination.total_items} results.
                        </>
                    ) : (
                        <>No results.</>
                    )}
                </div>
                {pagination && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onPageChange(pagination.current_page - 1)
                            }
                            disabled={pagination.current_page <= 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onPageChange(pagination.current_page + 1)
                            }
                            disabled={
                                pagination.current_page >= pagination.total_pages
                            }
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RoleAuditTrail
