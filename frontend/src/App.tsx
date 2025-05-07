import {FormEvent, useEffect, useState} from 'react'
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

// !TODO ADD DATA_TABLE

function App() {
    const [contacts, setContacts] = useState([])
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState<number | null>(null);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const [contactToDeleteId, setContactToDeleteId] = useState<number | null>(null); // State for contact ID to delete
    const [contactToDeleteName, setContactToDeleteName] = useState<string | null>(null); // New state for contact name to delete

    const fetchContacts = async () => {
        const response = await fetch('http://127.0.0.1:5000/api/contacts');

        const data = await response.json();
        setContacts(data.contacts);

    }

    useEffect(() => {
        fetchContacts();
    }, [])

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
        const url = `http://127.0.0.1:5000/api/delete_contact/${contactToDeleteId}`;


        try {
            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (response.status === 200) {
                fetchContacts()
                toast('Contact deleted successfully', {
                    position: 'top-center',
                    icon: <Check />
                })
            } else {
                alert('An error occurred while deleting the contact.');
            }
        } catch (error) {
            alert(error);
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const data = {
            firstName,
            lastName,
            email,
        }

        let url = 'http://127.0.0.1:5000/api';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }

        if (editingContactId) {
            url += `/update_contact/${editingContactId}`;
            options.method = 'PATCH';
        } else {
            url += '/create_contact';
        }

        try {
            const response = await fetch(url, options);
            if (response.status !== 201 && response.status !== 200) {
                const data = await response.json();
                alert(data.message);
            } else {
                toast(`${editingContactId ? 'Contact updated' : 'Contact created'} successfully!`, {
                    position: 'top-center',
                    icon: <Check />
                })
                // Refetch the contacts list
                fetchContacts();
                // Clear the form
                setFirstName('');
                setLastName('');
                setEmail('');
                // Close the sheet on success
                setIsSheetOpen(false);
            }
        } catch {
            alert('An error occurred while creating the contact.');
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
               contacts={contacts}
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
