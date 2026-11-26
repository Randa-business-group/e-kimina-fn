"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the typed confirmation name and optional reason. */
  onConfirm: (v: { confirmName: string; reason?: string }) => void;
  isPending: boolean;
  groupName: string;
};

export function DeleteGroupDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  groupName,
}: DeleteGroupDialogProps) {
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTyped("");
      setReason("");
    }
    onOpenChange(next);
  };

  const matches = typed.trim() === groupName.trim() && groupName.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border bg-bg text-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this group?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-text-muted">
          The group is closed for all members. Its financial history is kept and a platform
          admin can restore it. Deletion is refused while loans, payments awaiting confirmation
          or loan payouts are still open.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="delete-confirm-name">
            Type <span className="font-semibold text-text">{groupName}</span> to confirm
          </Label>
          <Input
            id="delete-confirm-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="border-border bg-secondary-2"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="delete-reason">Reason (optional)</Label>
          <Input
            id="delete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border-border bg-secondary-2"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || !matches}
            onClick={() =>
              onConfirm({ confirmName: typed.trim(), reason: reason.trim() || undefined })
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
