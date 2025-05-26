import useQueryParams from "@/hooks/useQueryParams.ts";
import DataTable from "@/components/ui/DataTable";
import {columns} from "@/features/users/UserList/UserList.constants.tsx";
import useGetData from "@/hooks/useGetData.ts";
import createQueryParams from "@/utils/createQueryParams.ts";
import {FetchUsersResponse} from "@/features/users/UserList/UserList.types.ts";
import {BaseQueryParams} from "@/types/responses.ts";
import PageHeader from "@/components/ui/PageHeader";
import { UserCog} from "lucide-react";
import {Sheet, SheetContent} from "@/components/ui/sheet.tsx";
import {useState} from "react";
import UserAssignForm from "@/features/users/UserAssignForm.tsx";
import {User} from "@/types/user.ts";

const UserList = () => {
    const { queryParams, onPageChange, onPageSizeChange } = useQueryParams()
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User>({
        id: 0,
        username: '',
        email: '',
        roles: [],
    });

    const { data } = useGetData<FetchUsersResponse, BaseQueryParams>(
        ['userList', createQueryParams(queryParams || {})],
        '/app/users',
        {
            params: {
                page: queryParams.page,
                per_page: queryParams.per_page || '10',
            },
        }
    )

    const handleOpenAssignUser = (user: User) => {
        setIsSheetOpen(true);
        setSelectedUser(user);
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <PageHeader
                    title="User List"
                    breadcrumbs={[{ label: "User List" }]}
                    showBackButton={false}

                />

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent>
                        <UserAssignForm
                            userData={selectedUser}
                            setIsSheetOpen={setIsSheetOpen}
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
                        icon: <UserCog className="h-4 w-4" />,
                        onClick: (user) => handleOpenAssignUser(user),
                        tooltip: "Assign Role",
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
        </>
    )
}

export default UserList
