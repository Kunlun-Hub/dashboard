import Button from "@components/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/Popover";
import { Table } from "@tanstack/react-table";
import { cn } from "@utils/helpers";
import { Command, CommandGroup, CommandItem } from "cmdk";
import { Check, ChevronDown, RowsIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  disabled?: boolean;
  rowsSelection?: number[];
}

const defaultRowsSelection = [10, 25, 50, 100, 1000];

export function DataTableRowsPerPage<TData>({
  table,
  disabled,
  rowsSelection = defaultRowsSelection,
}: DataTablePaginationProps<TData>) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"secondary"}
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            data-cy={"rows-per-page"}
            className="w-[200px] justify-between"
          >
            <RowsIcon
              size={15}
              className={"shrink-0 text-neutral-500 dark:text-nb-gray-300"}
            />
            <div>
              <span className={"text-neutral-900 dark:text-white"}>
                {table.getState().pagination.pageSize}
              </span>
              <span className={"text-neutral-500 dark:text-nb-gray-300"}>
                {" "}{t("table.rowsPerPage")}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" sideOffset={7}>
          <Command
            value={`${table.getState().pagination.pageSize}`}
            className={"text-neutral-950 dark:text-neutral-50"}
          >
            <CommandGroup>
              {rowsSelection.map((val) => (
                <CommandItem
                  key={val}
                  value={val.toString()}
                  data-cy={`rows-per-page-value`}
                  onSelect={(currentValue) => {
                    table.setPageSize(Number(currentValue));
                    setOpen(false);
                  }}
                >
                  <div
                    className={cn(
                      "cursor-pointer",
                      "flex gap-2 px-2 py-1.5 my-1 mx-1 rounded-md items-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-nb-gray-400 dark:hover:bg-nb-gray-800 dark:hover:text-white",
                      table.getState().pagination.pageSize === val
                        ? "text-neutral-900 dark:text-white"
                        : "",
                    )}
                  >
                    <Check
                      size={15}
                      className={cn(
                        "shrink-0 text-neutral-900 dark:text-white",
                        table.getState().pagination.pageSize === val
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {val}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
