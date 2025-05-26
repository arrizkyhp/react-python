import { columns } from "./ContactList.constants";
import DataTable from "@/components/ui/DataTable";
import {PencilIcon, TrashIcon} from "lucide-react";
import useContactList from "@/features/contacts/ContactList/ContactList.hooks.tsx";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet.tsx";
import {Button} from "@/components/ui/button.tsx";
import ContactForm from "@/features/contacts/ContactForm.tsx";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";

const ContactList = () => {
    const {
        contactToDeleteName,
        data,
        editingContactId,
        firstName,
        lastName,
        email,
        handleDeleteContactConfirm,
        handleDeleteContact,
        handleSubmit,
        handleOpenCreateSheet,
        handleOpenEditSheet,
        isSheetOpen,
        isAlertDialogOpen,
        setIsAlertDialogOpen,
        setIsSheetOpen,
        setFirstName,
        setLastName,
        setEmail,
        onPageChange,
        onPageSizeChange
    } = useContactList();

    return (
        <>
            <div className="flex flex-col gap-4">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <div className="flex justify-between items-center gap-2">
                        <h2 className="font-bold text-lg">Contact List</h2>
                        <SheetTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleOpenCreateSheet}>Create Contact</Button>
                        </SheetTrigger>
                    </div>


                    <SheetContent>
                        <ContactForm
                            isEdit={!!editingContactId}
                            handleSubmit={handleSubmit}
                            firstName={firstName}
                            lastName={lastName}
                            email={email}
                            setFirstName={setFirstName}
                            setLastName={setLastName}
                            setEmail={setEmail}
                        />
                    </SheetContent>
                </Sheet>
            </div>

            <DataTable
                columns={columns}
                data={data?.items || []}
                rowActions={[
                    {
                        color: "secondary",
                        icon: <PencilIcon className="h-4 w-4" />,
                        onClick: (contact) => handleOpenEditSheet(contact),
                        tooltip: "Edit contact",
                    },
                    {
                        color: "destructive",
                        icon: <TrashIcon className="h-4 w-4" />,
                        onClick: (contact) => handleDeleteContact(contact),
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

            <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this contact?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the contact:
                            <br/>
                            <span className="font-bold"> {contactToDeleteName}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={handleDeleteContactConfirm} className="bg-red-600 hover:bg-red-700">Delete</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default ContactList;
