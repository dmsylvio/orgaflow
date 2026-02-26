"use client";

import { FileIcon, FileTextIcon, Plus, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminQuickActions() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="secondary" aria-label="Quick actions">
          <Plus className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push("/app/invoices/create")}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          <span>New invoice</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/app/estimates/create")}>
          <FileIcon className="mr-2 h-4 w-4" />
          <span>New estimate</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/app/customers/create")}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>New customer</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
