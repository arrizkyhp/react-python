import {Contact, PaginationInfo} from "@/types/contact.ts";
import {BaseQueryParams} from "@/types/response.ts";

interface FetchContactsResponse {
    contacts: Contact[];
    pagination: PaginationInfo;
}

export const fetchContacts = async (params: BaseQueryParams): Promise<FetchContactsResponse> => {
    const queryString = new URLSearchParams({
        page: params.page.toString(),
        per_page: params.per_page?.toString() || '10',
    }).toString();

    const response = await fetch(`http://127.0.0.1:5000/api/app/contacts?${queryString}`, {
      credentials: "include",
    });

    if (!response.ok) {
        throw new Error('Failed to fetch contacts');
    }
    return response.json();
};

export const createContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
    const response = await fetch('http://127.0.0.1:5000/api/app/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
        credentials: "include",
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create contact');
    }
    return response.json(); // Assuming your backend returns the created contact
};

export const updateContact = async (id: number, contactData: Partial<Omit<Contact, 'id'>>): Promise<Contact> => {
    const response = await fetch(`http://127.0.0.1:5000/api/app/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
        credentials: "include",
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update contact');
    }
    return response.json(); // Assuming your backend returns the updated contact
};

export const deleteContact = async (id: number): Promise<void> => {
    const response = await fetch(`http://127.0.0.1:5000/api/app/contacts/${id}`, {
        method: 'DELETE',
        credentials: "include",
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete contact');
    }
};
