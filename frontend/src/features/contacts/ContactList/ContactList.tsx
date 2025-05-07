import {Contact} from "@/types/contact.ts";
import { columns } from "./ContactList.constants";
import DataTable from "@/components/ui/DataTable";
import {PencilIcon, TrashIcon} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {fetchContacts} from "@/features/contacts/fetch.ts";
import useQueryParams from "@/hooks/useQueryParams.ts";

interface ContactProps {
    onEditClick: (contact: Contact) => void;
    onDeleteClick: (contact: Contact) => void;
}

const ContactList = ({  onEditClick, onDeleteClick }: ContactProps) => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()

    const { data} = useQuery({
        queryKey: ['contacts', queryParams],
        queryFn: () => fetchContacts(queryParams),
    })

    return (
        <div>
            <DataTable
                columns={columns}
                data={data?.contacts || []}
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
