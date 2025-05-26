import {SheetHeader} from "@/components/ui/sheet.tsx";
import {MultiSelect} from "@/components/ui/MultiSelect";
import {useState} from "react";
import useGetData from "@/hooks/useGetData.ts";
import {SelectOption} from "@/types/common.ts";
import {Role} from "@/types/role.ts";
import { Label } from "@/components/ui/label";


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

    const optionsRole = roleOptionsData || []




    return (
        <>
            <SheetHeader>
                <h2> Assign User Role </h2>
            </SheetHeader>

            <div className="p-4">
                <div className="grid gap-2">
                    <Label>Roles</Label>
                    <MultiSelect
                        options={optionsRole}
                        onValueChange={setSelectedRoles}
                        placeholder="Select Roles"
                        value={selectedRoles}
                        variant="inverted"
                        maxCount={3}
                    />
                </div>


            </div>


        </>
    )
}

export default UserAssignForm
