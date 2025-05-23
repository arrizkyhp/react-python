import RoleList from "@/features/roles/RoleList";
import {Button} from "@/components/ui/button.tsx";
import {useNavigate} from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";

const RolePage = () => {
    const navigate = useNavigate();

    const handleCreateRole = () => {
        navigate("/role/create");
    }

    return (
        <div className="flex flex-col gap-4 mt-2">
            <PageHeader
                title="Role List"
                breadcrumbs={[{ label: "Role List" }]}
                showBackButton={false} // No back button needed for a list page
                actions={
                    <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleCreateRole}
                    >
                        Create Role
                    </Button>
                }
            />
            <RoleList />
            {/*<UserList />*/}
        </div>
    )
}

export default RolePage;
