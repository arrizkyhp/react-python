import {ArrowDown, ArrowUp, ArrowUpDown, CalendarIcon, Clock, Filter, Plus, Search, SquarePen, Trash2, User, X} from "lucide-react";
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
import { useState } from "react";
import {SortDirection, SortFieldAudit} from "@/types/sort.ts";
import {Separator} from "@/components/ui/separator.tsx";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export const formatMonthDay = (date: Date | undefined): string => {
    if (!date) {
        return "";
    }
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

const RoleAuditTrail = () => {
    const {
        AUDIT_TRAIL: {
            GET: GET_AUDIT_TRAIL,
        }
    } = ENDPOINTS;

    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()

    const [sortField, setSortField] = useState<SortFieldAudit>("timestamp")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
    const [actionFilter, setActionFilter] = useState<string>("all")
    const [userFilter, setUserFilter] = useState<string>("all")
    const [dateFrom, setDateFrom] = useState<Date | undefined>()
    const [dateTo, setDateTo] = useState<Date | undefined>()

    const [searchTerm, setSearchTerm] = useState("")

    const { data: dataAuditTrail } = useGetData<ListResponse<AuditTrail>, BaseQueryParams>(
        ['auditTrailRole', createQueryParams(queryParams || {})],
        GET_AUDIT_TRAIL,
        {
            params: {
                entity_type: 'Role',
                page: queryParams.page,
                per_page: queryParams.per_page || 10,
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

    const getSortIcon = (field: SortFieldAudit) => {
        if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
        return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    }

    const handleSort = (field: SortFieldAudit) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("desc")
        }
    }

    const handleFilterChange = () => {
        onPageChange(1)
    }

    const hasActiveFilters = searchTerm || actionFilter !== "all" || userFilter !== "all" || dateFrom || dateTo


    const clearFilters = () => {
        setSearchTerm("")
        setActionFilter("all")
        setUserFilter("all")
        setDateFrom(undefined)
        setDateTo(undefined)
        onPageChange(1)
    }


    return (
        <div className="mt-2">
            <div className="flex gap-2 items-center">
                <Clock className="h-5 w-5"/>
                <h2 className="font-semibold text-2xl">Role Management Audit Trail</h2>
            </div>
            <div className="flex my-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by username, description, entity type, and field name..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            handleFilterChange()
                        }}
                        className="max-w-md"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Sort by:</span>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("timestamp")} className="h-8 px-2">
                        Date {getSortIcon("timestamp")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("user")} className="h-8 px-2">
                        User {getSortIcon("user")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("action")} className="h-8 px-2">
                        Action {getSortIcon("action")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("entity")} className="h-8 px-2">
                        Entity {getSortIcon("entity")}
                    </Button>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {hasActiveFilters && (
                                <Badge
                                    variant="secondary"
                                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                >
                                    !
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Filters</h4>
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="h-4 w-4 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium">Action Type</Label>
                                    <Select
                                        value={actionFilter}
                                        onValueChange={(value) => {
                                            setActionFilter(value)
                                            handleFilterChange()
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Actions</SelectItem>
                                            <SelectItem value="create">Create</SelectItem>
                                            <SelectItem value="update">Update</SelectItem>
                                            <SelectItem value="delete">Delete</SelectItem>
                                            <SelectItem value="upload">Upload</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">User</Label>
                                    <Select
                                        value={userFilter}
                                        onValueChange={(value) => {
                                            setUserFilter(value)
                                            handleFilterChange()
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/*<SelectItem value="all">All Users</SelectItem>*/}
                                            {/*{uniqueUsers.map((user) => (*/}
                                            {/*    <SelectItem key={user} value={user}>*/}
                                            {/*        {user}*/}
                                            {/*    </SelectItem>*/}
                                            {/*))}*/}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-sm font-medium">From Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateFrom ? formatMonthDay(dateFrom) : "Select"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={dateFrom}
                                                    onSelect={(date) => {
                                                        setDateFrom(date)
                                                        handleFilterChange()
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium">To Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateTo ? formatMonthDay(dateTo) : "Select"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={dateTo}
                                                    onSelect={(date) => {
                                                        setDateTo(date)
                                                        handleFilterChange()
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            {/* Sort Controls */}
            <Separator className="my-4"/>
            <div className="flex gap-2 items-center justify-between">
                <div className="flex gap-2 items-center">
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
                    <div className="text-sm text-neutral-500">
                        {pagination && pagination.total_items > 0 ? (
                            <>
                                Showing {startIndex} to {endIndex} of{" "}
                                {pagination.total_items} results.
                            </>
                        ) : (
                            <>No results.</>
                        )}
                    </div>
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
            <ScrollArea className="h-[500px] pr-4 mt-4">
                <div className="flex flex-col gap-2">
                    {items?.map((auditTrail) => (
                        <Card key={auditTrail.id} className="rounded-sm shadow-none">
                            <CardContent className="px-4">
                                <div className="flex items-start gap-2">
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


        </div>
    )
}

export default RoleAuditTrail
