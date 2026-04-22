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
import { Icon, ICONS } from "../config/icons";

type Props = {
  collapsed?: boolean;
  onLogout: () => void;
};

export default function Logoutbox({ collapsed = false, onLogout }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Logout"
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-primary hover:bg-primary/20 transition cursor-pointer"
      >
        <Icon icon={ICONS.logout} width={16} className="shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>

      {/* Centered Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm p-6">
          <DialogHeader className="items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mx-auto mb-2">
              <Icon icon={ICONS.logout} width={22} className="text-primary" />
            </div>
            <DialogTitle className="text-base font-semibold text-zinc-900">
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row gap-3 mt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex-1 bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/80 transition cursor-pointer"
            >
              Logout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}