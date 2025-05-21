import {ColumnDef} from "@tanstack/react-table";
import {User} from "@/types/user.ts";

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: "username",
        header: "Name",
    },
    {
        accessorKey: "email",
        header: () => <div className="text-left">Email</div>,
    }
]
