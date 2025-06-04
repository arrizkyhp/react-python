import {ENDPOINTS} from "@/constants/apiUrl.ts";
import useQueryParams from "@/hooks/useQueryParams.ts";
import {useEffect, useState} from "react";
import useGetData from "@/hooks/useGetData.ts";
import {BaseQueryParams, ListResponse} from "@/types/responses.ts";
import {AuditTrail} from "@/types/auditTrail.ts";
import createQueryParams from "@/utils/createQueryParams.ts";
import {SortDirection, SortFieldAudit} from "@/types/sort.ts";
import {ArrowDown, ArrowUp, ArrowUpDown} from "lucide-react";
import { AuditTrailHooksProps } from "./AuditTrail.types.ts";

const useAuditTrail = ({ entityType }: AuditTrailHooksProps) => {
    const {
        AUDIT_TRAIL: {
            GET: GET_AUDIT_TRAIL,
        }
    } = ENDPOINTS;

    const {
        queryParams,
        onPageChange,
        onPageSizeChange,
        onSearchChange,
        onSortChange,
        onActionTypeChange,
        clearAllParams
    } = useQueryParams()

    const [actionFilter, setActionFilter] = useState<string>("all")
    const [userFilter, setUserFilter] = useState<string>("all")
    const [dateFrom, setDateFrom] = useState<Date | undefined>()
    const [dateTo, setDateTo] = useState<Date | undefined>()

    const [searchQuery, setSearchQuery] = useState(queryParams.search || "")

    useEffect(() => {
        setSearchQuery(queryParams.search || "");
    }, [queryParams.search]);

    const { data: dataAuditTrail } = useGetData<ListResponse<AuditTrail>, BaseQueryParams>(
        ['auditTrail', entityType, createQueryParams(queryParams || {})],
        GET_AUDIT_TRAIL,
        {
            params: {
                entity_type: entityType,
                page: queryParams.page,
                per_page: queryParams.per_page || 10,
                search: queryParams.search,
                sort_by: queryParams.sort_by,
                sort_order: queryParams.sort_order,
                action_type: queryParams.action_type
            }
        }
    )

    const { items, pagination } = dataAuditTrail ?? {}

    const getBadgeColorClass = (actionType: AuditTrail["action_type"]) => {
        switch (actionType) {
            case "DELETE":
                return "bg-red-500 hover:bg-red-500/80";
            case "CREATE":
                return "bg-green-500 hover:bg-green-500/80";
            case "UPDATE":
                return "bg-blue-500 hover:bg-blue-500/80";
            default:
                return "";
        }
    };

    const renderChangeDetails = (auditTrail: AuditTrail) => {
        if (auditTrail.action_type !== "UPDATE" || !auditTrail.field_name) {
            return null;
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
                const oldPerms: { id: number; name: string }[] = auditTrail.old_value || [];
                const newPerms: { id: number; name: string }[] = auditTrail.new_value || [];

                const oldPermIds = new Set(oldPerms.map(p => p.id));
                const newPermIds = new Set(newPerms.map(p => p.id));

                const addedPerms = newPerms.filter(p => !oldPermIds.has(p.id));
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
        if (queryParams.sort_by !== field) return <ArrowUpDown className="h-4 w-4" />;
        return queryParams.sort_order === "asc" ? (
            <ArrowUp className="h-4 w-4" />
        ) : (
            <ArrowDown className="h-4 w-4" />
        );
    };

    const handleSort = (field: SortFieldAudit) => {
        const currentSortDirection =
            queryParams.sort_by === field ? queryParams.sort_order : "desc";

        const newSortDirection: SortDirection =
            currentSortDirection === "asc" ? "desc" : "asc";

        onSortChange(field, newSortDirection);
    };

    const handleFilterChange = () => {
        onPageChange(1)
    }

    const handleActionFilterChange = (value: string) => {
        setActionFilter(value);
        onActionTypeChange(value);
    };

    const hasActiveFilters = searchQuery || actionFilter !== "all" || userFilter !== "all" || dateFrom || dateTo

    const clearFilters = () => {
        setSearchQuery("")
        setActionFilter("all")
        setUserFilter("all")
        setDateFrom(undefined)
        setDateTo(undefined)
        clearAllParams()
    }

    return {
        searchQuery,
        onSearchChange,
        setSearchQuery,
        handleSort,
        getSortIcon,
        hasActiveFilters,
        clearFilters,
        actionFilter,
        handleActionFilterChange,
        userFilter,
        setUserFilter,
        handleFilterChange,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        pagination,
        onPageSizeChange,
        startIndex,
        endIndex,
        onPageChange,
        items,
        getBadgeColorClass,
        renderChangeDetails
    }
}

export default useAuditTrail
