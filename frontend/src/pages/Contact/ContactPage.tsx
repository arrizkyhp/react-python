import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet.tsx";
import {Button} from "@/components/ui/button.tsx";
import ContactForm from "@/features/contacts/ContactForm.tsx";
import ContactList from "@/features/contacts/ContactList";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {FormEvent, useState} from "react";
import {toast} from "sonner";
import {Check} from "lucide-react";
import type {Contact} from "@/types/contact.ts";
import {useDeleteData, usePatchData, usePostData} from "@/hooks/useMutateData.ts";

const ContactPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState<number | null>(null);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const [contactToDeleteId, setContactToDeleteId] = useState<number | null>(null); // State for contact ID to delete
    const [contactToDeleteName, setContactToDeleteName] = useState<string | null>(null); // New state for contact name to delete

    const {
        mutate: createContactMutation,
    } = usePostData<Contact, Omit<Contact, 'id'>>(
        ['createContact'], // A unique key for this specific mutation operation
        '/app/contacts', // The API endpoint
        {
            options: {
                onSuccess: () => {
                    toast('Contact created successfully!', {
                        position: 'top-center',
                        icon: <Check />,
                    });
                    // This invalidation is handled by `usePostData` due to `queryInvalidateKeys`
                    // queryClient.invalidateQueries({ queryKey: ['contacts'] });

                    // Clear form and close sheet
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setIsSheetOpen(false);
                },
                onError: (err) => {
                    alert(`Error creating contact: ${err.message}`);
                    console.error('Create Contact Error:', err);
                },
            },
        },
        ['listContacts'], // Invalidate the 'contacts' query key on success
    );

    const {
        mutate: updateContactMutation,
    } = usePatchData(
        ['updateContact', String(editingContactId)], // Mutation key
        `/app/contacts/${editingContactId}`, // URL for this specific contact
        {
            options: {
                onSuccess: () => {
                    toast('Contact updated successfully!', {
                        position: 'top-center',
                        icon: <Check />
                    });
                    setEditingContactId(null);
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setIsSheetOpen(false);
                },
                onError: (err) => toast(`Update failed: ${err.message}`),
            },
        },
        ['listContacts'], // Invalidate contacts list and potentially individual contact detail
    );

    const {
        mutate: deleteContactMutation,
    } = useDeleteData<void, number>(
        ['deleteContact', String(contactToDeleteId)], // Mutation key
        `/app/contacts/${contactToDeleteId}`, // URL for this specific contact
        {
            options: {
                onSuccess: () => {
                    toast('Contact deleted successfully', {
                        position: 'top-center',
                        icon: <Check />
                    });
                    setIsAlertDialogOpen(false);
                    setContactToDeleteId(null);
                    setContactToDeleteName(null);

                },
                onError: (err) => toast(`Delete failed: ${err.message}`),
            },
        },
        ['listContacts'], // Invalidate the contacts list after deletion
    );

    const handleOpenCreateSheet = () => {
        // Clear the form fields when opening for creation
        setEditingContactId(null);
        setFirstName('');
        setLastName('');
        setEmail('');
        setIsSheetOpen(true);
    };

    const handleOpenEditSheet = (contact: Contact) => {
        setEditingContactId(contact.id); // Set the ID of the contact being edited
        setFirstName(contact.firstName);
        setLastName(contact.lastName);
        setEmail(contact.email);
        setIsSheetOpen(true);
    };

    const handleDeleteContact = async (contact: Contact) => {
        setContactToDeleteId(contact.id);
        setContactToDeleteName(`${contact.firstName} ${contact.lastName}`);
        setIsAlertDialogOpen(true);
    }

    const handleDeleteContactConfirm = async () => {
        if (contactToDeleteId !== null) {
            deleteContactMutation(contactToDeleteId);
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const data = {
            firstName,
            lastName,
            email,
        }

        if (editingContactId) {
            updateContactMutation(data);
        } else {
            createContactMutation(data);
        }
    }

    return <>
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

            <ContactList
                onEditClick={handleOpenEditSheet}
                onDeleteClick={handleDeleteContact}
            />
        </div>
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
}

export default ContactPage
