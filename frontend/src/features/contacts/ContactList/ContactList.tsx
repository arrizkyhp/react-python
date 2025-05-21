import { columns } from "./ContactList.constants";
import DataTable from "@/components/ui/DataTable";
import {PencilIcon, TrashIcon} from "lucide-react";
import useQueryParams from "@/hooks/useQueryParams.ts";
import useGetData from "@/hooks/useGetData.ts";
import {FetchContactsResponse, ContactProps} from "./ContactList.types.ts";
import {BaseQueryParams} from "@/types/responses.ts";
import createQueryParams from "@/utils/createQueryParams.ts";

const ContactList = ({  onEditClick, onDeleteClick }: ContactProps) => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()

    const { data } = useGetData<FetchContactsResponse, BaseQueryParams>(
        ['listContacts', createQueryParams(queryParams || {})],
        '/app/contacts',
        {
            params: {
                page: queryParams.page,
                per_page: queryParams.per_page || '10',
            },
        }
    )

    return (
        <div>
            <DataTable
                columns={columns}
                data={data?.items || []}
                rowActions={[
                    {
                        color: "secondary",
                        icon: <PencilIcon className="h-4 w-4" />,
                        onClick: (contact) => onEditClick(contact),
                        tooltip: "Edit contact",
                    },
                    {
                        color: "destructive",
                        icon: <TrashIcon className="h-4 w-4" />,
                        onClick: (contact) => onDeleteClick(contact),
                        tooltip: "Delete contact",
                    },
                ]}
                pagination={{
                    currentPage: data?.pagination.current_page || 1,
                    totalPages: data?.pagination.total_pages || 1,
                    totalItems: data?.pagination.total_items || 0,
                    onPageChange: onPageChange,
                    onPageSizeChange: onPageSizeChange
                }}
            />
        </div>
    )
}

export default ContactList;
