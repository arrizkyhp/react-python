import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge.tsx";
import {Permission} from "@/types/permission.ts";
import { Users} from "lucide-react";

export const columns: ColumnDef<Permission>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "category",
        header: () => <div className="text-left">Category</div>,
    },
    {
        accessorKey: "description",
        header: "Description",
    },
    {
        accessorKey: "usage",
        header: "Usage",
        cell: ({ row }) => {
            const usage = row.getValue("usage");
            return (
                <div className="flex items-center gap-1">
                    <span>{usage as number}</span>
                    <Users className="h-4 w-4 text-gray-500" /> {/* Add User Icon */}
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status");
            const isActive = status === "active";

            return (
                <Badge variant={isActive ? "default" : "destructive"}>
                    {status as string}
                </Badge>
            );
        },
    },
]
