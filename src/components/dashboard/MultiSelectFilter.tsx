import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface MultiSelectFilterProps {
    options: { label: string; value: string }[];
    selected: string[];
    onSelectionChange: (selected: string[]) => void;
    placeholder?: string;
    label?: string;
}

export function MultiSelectFilter({
    options,
    selected,
    onSelectionChange,
    placeholder = 'Select options...',
    label,
}: MultiSelectFilterProps) {
    const [open, setOpen] = useState(false);

    const toggleOption = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((s) => s !== value)
            : [...selected, value];
        onSelectionChange(newSelected);
    };

    const clearAll = () => {
        onSelectionChange([]);
    };

    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm font-medium">{label}</label>}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <span className="truncate">
                            {selected.length === 0 ? (
                                placeholder
                            ) : selected.length === 1 ? (
                                options.find((opt) => opt.value === selected[0])?.label
                            ) : (
                                `${selected.length} selected`
                            )}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandEmpty>No option found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                            {options.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => toggleOption(option.value)}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                isSelected ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        {option.label}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selected.length > 0 && (
                            <div className="border-t p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={clearAll}
                                >
                                    Clear all
                                </Button>
                            </div>
                        )}
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Selected Items as Badges */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selected.map((value) => {
                        const option = options.find((opt) => opt.value === value);
                        if (!option) return null;

                        return (
                            <Badge
                                key={value}
                                variant="secondary"
                                className="cursor-pointer hover:bg-destructive/10"
                                onClick={() => toggleOption(value)}
                            >
                                {option.label}
                                <button className="ml-1 hover:text-destructive">×</button>
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
