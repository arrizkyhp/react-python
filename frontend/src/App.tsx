import {FormEvent, useState} from 'react'
import './App.css'
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet.tsx";
import {Button} from "@/components/ui/button.tsx";
import type {Contact} from "@/types/contact.ts";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {toast} from "sonner";
import {Check} from "lucide-react";
import ContactForm from "@/features/contacts/ContactForm.tsx";
import ContactList from './features/contacts/ContactList';
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {createContact, deleteContact, updateContact} from "@/features/contacts/fetch.ts";

// !TODO ADD DATA_TABLE

function App() {
    const queryClient = useQueryClient();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState<number | null>(null);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const [contactToDeleteId, setContactToDeleteId] = useState<number | null>(null); // State for contact ID to delete
    const [contactToDeleteName, setContactToDeleteName] = useState<string | null>(null); // New state for contact name to delete

    const createContactMutation = useMutation({
        mutationFn: createContact,
        onSuccess: () => {
            toast('Contact created successfully!', {
                position: 'top-center',
                icon: <Check />
            });
            // Invalidate and refetch the contacts query
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            // Clear form and close sheet
            setFirstName('');
            setLastName('');
            setEmail('');
            setIsSheetOpen(false);
        },
        onError: (error: Error) => {
            alert(`Error creating contact: ${error.message}`);
        },
    });

    const updateContactMutation = useMutation({
        mutationFn: ({ id, contactData }: { id: number, contactData: Partial<Omit<Contact, 'id'>> }) => updateContact(id, contactData),
        onSuccess: () => {
            toast('Contact updated successfully!', {
                position: 'top-center',
                icon: <Check />
            });
            // Invalidate and refetch the contacts query
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            // Clear form and close sheet
            setEditingContactId(null);
            setFirstName('');
            setLastName('');
            setEmail('');
            setIsSheetOpen(false);
        },
        onError: (error: Error) => {
            alert(`Error updating contact: ${error.message}`);
        },
    });

    const deleteContactMutation = useMutation({
        mutationFn: deleteContact,
        onSuccess: () => {
            toast('Contact deleted successfully', {
                position: 'top-center',
                icon: <Check />
            });
            // Invalidate and refetch the contacts query
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            // Close the dialog
            setIsAlertDialogOpen(false);
            setContactToDeleteId(null);
            setContactToDeleteName(null);
        },
        onError: (error: Error) => {
            alert(`Error deleting contact: ${error.message}`);
        },
    });

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
            deleteContactMutation.mutate(contactToDeleteId);
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
            updateContactMutation.mutate({ id: editingContactId, contactData: data });
        } else {
            createContactMutation.mutate(data);
        }
    }

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
  )
}

export default App
