import UserList from "@/features/users/UserList";

const UserPage = () => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center gap-2">
                <h2 className="font-bold text-lg">User List</h2>
            </div>
            <UserList />
        </div>
    )
}

export default UserPage;
