import {ColumnDef, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Button, buttonVariants} from "@/components/ui/button.tsx";
import {type VariantProps} from "class-variance-authority";
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

interface RowAction<TData> {
    color?: ButtonVariant;
    icon?: React.ReactNode;
    onClick: (row: TData) => void;
    tooltip?: string;
    label?: string; // Add a label for button text
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    rowActions?: RowAction<TData>[];
    pagination?: Pagination;
}

interface Pagination {
    onPageChange: (page: number) => void;
    currentPage: number;
    totalPages: number;
    onPageSizeChange: (pageSize: number) => void;
}

const DataTable = <TData, TValue>(
    {
        columns,
        data,
        rowActions = [],
        pagination
    }: DataTableProps<TData, TValue>) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return   (
        <div className="flex flex-col gap-2">
            <div>
                <Select onValueChange={(value) => {
                    if (pagination && pagination.onPageSizeChange) {
                        pagination.onPageSizeChange(Number(value));
                    }
                }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select page size" /> {/* Changed placeholder */}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem> {/* Corrected value */}
                            <SelectItem value="100">100</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                                {rowActions.length > 0 && (
                                    <TableHead className="text-center">Actions</TableHead>
                                )}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                    {rowActions.length > 0 && (
                                        <TableCell className="flex gap-2">
                                            {rowActions.map((action, index) => (
                                                <Button
                                                    key={index}
                                                    onClick={() => action.onClick(row.original)}
                                                    variant={action.color}
                                                    title={action.tooltip} // Use title for tooltip
                                                >
                                                    {action.icon}
                                                    {action.label}
                                                </Button>
                                            ))}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)} // Adjust colspan
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {pagination && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage <= 1}
                    >
                        Previous
                    </Button>
                    {/* You could add page number indicators here */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= pagination.totalPages}
                    >
                        Next
                    </Button>
                    {/* Add page size select if onPageSizeChange is provided */}
                </div>
            )}
        </div>
    )
}

export default DataTable;
