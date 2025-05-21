"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  popoverClassName?: string;
  groupHeading?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  popoverClassName,
  groupHeading,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;

    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const matchLabel = option.label.toLowerCase().includes(query);
      const matchDescription = option.description
        ?.toLowerCase()
        .includes(query);
      const matchValue = option.value.toLowerCase().includes(query);
      return matchLabel || matchDescription || matchValue;
    });
  }, [options, searchQuery]);

  // Get the selected option display
  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-left font-normal",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-md w-[var(--radix-popover-trigger-width)] min-w-[200px]",
          popoverClassName
        )}
        align="start"
        side="bottom"
        sideOffset={5}
      >
        <Command shouldFilter={false} className="border-0">
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
          />
          <CommandList className="max-h-[200px] overflow-y-auto p-0">
            <CommandEmpty className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup
              heading={groupHeading}
              className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400"
            >
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-gray-900 dark:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 px-2 py-1 text-sm cursor-pointer overflow-hidden"
                >
                  <span className="flex-none w-4">
                    <Check
                      className={cn(
                        "h-3 w-3",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </span>
                  <div className="flex-1 truncate min-w-0">
                    <span className="font-medium block truncate">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
