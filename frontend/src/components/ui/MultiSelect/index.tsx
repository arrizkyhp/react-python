import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils"; // Your shadcn utility for class names
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SelectOption } from "@/types/common";

interface MultiSelectProps {
    options: SelectOption[];
    selected: string[];
    onSelectChange: (selectedValues: string[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function MultiSelect({
                                options,
                                selected,
                                onSelectChange,
                                placeholder = "Select...",
                                className,
                                disabled = false,
                            }: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (optionValue: string) => {
        const isSelected = selected.includes(optionValue);
        let newSelected: string[];

        if (isSelected) {
            newSelected = selected.filter((item) => item !== optionValue);
        } else {
            newSelected = [...selected, optionValue];
        }
        onSelectChange(newSelected);
    };

    const handleRemove = (optionValue: string) => {
        const newSelected = selected.filter((item) => item !== optionValue);
        onSelectChange(newSelected);
    };

    const handleClearAll = () => {
        onSelectChange([]);
    };

    const selectedOptions = options.filter((option) =>
        selected.includes(option.value),
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between p-2 flex items-center min-h-[38px] h-auto",
                        className,
                    )}
                >
                    <div className="flex flex-wrap items-center gap-1 flex-1">
                        {selectedOptions.length > 0 ? (
                            selectedOptions.map((option) => (
                                <Badge
                                    key={option.value}
                                    variant="secondary"
                                    className="flex items-center gap-1.5"
                                >
                                    {option.label}
                                    <button
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.stopPropagation();
                                                handleRemove(option.value);
                                            }
                                        }}
                                        // Crucial: Prevents blur on popover trigger/content
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevents focus change
                                            e.stopPropagation(); // Prevents event from bubbling up to close popover
                                        }}
                                        onClick={() => handleRemove(option.value)}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
                // Crucial: Keep popover open when clicking inside the content
                onPointerDownOutside={(e) => {
                    // Prevent closing when clicking on the trigger itself
                    if (e.target instanceof HTMLElement && e.target.closest('[data-radix-popper-content]')) {
                        return;
                    }
                    if (e.target instanceof HTMLElement && e.target.closest('[data-state="open"][role="combobox"]')) {
                        e.preventDefault();
                    }
                }}
            >
                <Command>
                    {/* Crucial: Prevent click/focus within CommandInput from closing Popover */}
                    <CommandInput
                        placeholder="Search options..."
                        onMouseDown={(e) => {
                            e.stopPropagation(); // Stop event from bubbling to Popover, which might close it
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={(currentValue) => {
                                        // Find the option using the original value (since onSelect provides the value prop which might be the label)
                                        const selectedOption = options.find(o => o.label === currentValue || o.value === currentValue);
                                        if (selectedOption) {
                                            handleSelect(selectedOption.value);
                                        }
                                        // Important: Do NOT call setOpen(false) here. The popover should remain open for multi-select.
                                        // If you had setOpen(false) before, remove it.
                                    }}
                                    disabled={option.disable}
                                    className={cn(
                                        "cursor-pointer",
                                        option.disable && "cursor-not-allowed opacity-50",
                                    )}
                                    // Crucial: Prevent CommandItem click from closing Popover immediately
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevents focus change
                                        e.stopPropagation(); // Prevents event from bubbling up to close popover
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            selected.includes(option.value)
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible",
                                        )}
                                    >
                                        <Check className={cn("h-4 w-4")} />
                                    </div>
                                    <span>{option.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        {selected.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={handleClearAll}
                                        className="justify-center text-center text-destructive cursor-pointer"
                                        onMouseDown={(e) => { // Prevent closing on "Clear All" click
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        Clear All
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
