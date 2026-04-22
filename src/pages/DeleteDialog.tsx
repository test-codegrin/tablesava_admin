"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon, ICONS } from "../config/icons";

type Props = {
  onDelete: () => void;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
};

export default function DeleteDialog({
  onDelete,
  title = "Confirm Delete",
  description = "Are you sure you want to delete this? This action cannot be undone.",
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Icon icon={ICONS.delete ?? ICONS.logout} width={16} className="shrink-0" />
            <span>Delete</span>
          </Button>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm p-6">
          <DialogHeader className="items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto mb-2">
              <Icon icon={ICONS.delete ?? ICONS.logout} width={22} className="text-primary" />
            </div>
            <DialogTitle className="text-base font-semibold text-zinc-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row gap-3 mt-2">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="ghost"
              className="flex-1 border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => { setOpen(false); onDelete(); }}
              className="flex-1 bg-primary text-white hover:bg-red-600"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}