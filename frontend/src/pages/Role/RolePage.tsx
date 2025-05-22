import RoleList from "@/features/roles/RoleList";
import {Button} from "@/components/ui/button.tsx";

const RolePage = () => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center gap-2">
                <h2 className="font-bold text-lg">Role List</h2>
                <Button className="bg-green-600 hover:bg-green-700" >Create Role</Button>
            </div>
            <RoleList />
            {/*<UserList />*/}
        </div>
    )
}

export default RolePage;
