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
  collapsed?: boolean;
  onLogout: () => void;
};

export default function Logoutbox({ collapsed = false, onLogout }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Logout"
        variant="ghost"
        className="w-full justify-start gap-3 px-3 text-primary hover:bg-primary/20"
      >
        <Icon icon={ICONS.logout} width={16} className="shrink-0" />
        {!collapsed && <span>Logout</span>}
      </Button>

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
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="ghost"
              className="flex-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}          
              className="flex-1 text-white"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
