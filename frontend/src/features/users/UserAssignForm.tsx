import { MultiSelect } from "@/components/ui/MultiSelect";
import {SheetHeader} from "@/components/ui/sheet.tsx";
import useGetData from "@/hooks/useGetData.ts";
import {SelectOption} from "@/types/common.ts";
import {Role} from "@/types/role.ts";
import { useState } from "react";

const UserAssignForm = () => {

    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const { data: roleOptionsData } = useGetData<
        SelectOption[]
    >(["roleOptions"], "/app/roles/options", {
        normalizer: (data) =>
            data.map((role: Role) => ({
                label: role.name,
                value: String(role.id),
            })),
    });


    console.log(roleOptionsData)
    const optionsRole = roleOptionsData || []


    console.log("optionsRole", optionsRole)
    return (
        <>
            <SheetHeader>
                <h2> Assign User Role </h2>
            </SheetHeader>

            <MultiSelect
                options={optionsRole}
                selected={selectedRoles} // Pass the selectedRoles state
                onSelectChange={setSelectedRoles} // Pass the state setter
                placeholder="Select roles..."
                // disabled={!user} // Disable if no user is selected
            />


        </>
    )
}

export default UserAssignForm
