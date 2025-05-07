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

    const response = await fetch(`http://127.0.0.1:5000/api/contacts?${queryString}`);

    if (!response.ok) {
        throw new Error('Failed to fetch contacts');
    }
    return response.json();
};
