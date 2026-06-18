"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Contact } from "@/lib/types";
import { ArrowUpDown, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ContactsTableProps {
  data: Contact[];
  onRefresh: () => void;
  onSync: () => Promise<void>;
  onValidate: () => Promise<void>;
  isLoading?: boolean;
}

export function ContactsTable({
  data,
  onRefresh,
  onSync,
  onValidate,
  isLoading = false,
}: ContactsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("phone")}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-sm">{row.getValue("email") || "-"}</span>,
    },
    {
      accessorKey: "segment",
      header: "Segment",
      cell: ({ row }) => (
        <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
          {row.getValue("segment")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColor =
          status === "Sent"
            ? "bg-green-100 text-green-700"
            : status === "Failed"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700";

        return (
          <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${statusColor}`}>
            {status || "Pending"}
          </span>
        );
      },
    },
    {
      accessorKey: "sendWhatsapp",
      header: "WhatsApp",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("sendWhatsapp") === "Yes" ? "✓" : "-"}</span>
      ),
    },
    {
      id: "actions",
      cell: () => (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: "auto",
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search contacts..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setValidateLoading(true);
              await onValidate();
              setValidateLoading(false);
            }}
            disabled={validateLoading || isLoading}
          >
            {validateLoading ? "Validating..." : "Validate"}
          </Button>
          <Button
            onClick={async () => {
              setSyncLoading(true);
              await onSync();
              setSyncLoading(false);
            }}
            disabled={syncLoading || isLoading}
          >
            {syncLoading ? "Syncing..." : "Sync Sheet"}
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts ({data.length})</CardTitle>
          <CardDescription>Manage and sync your contact list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No contacts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
