"use client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon, ICONS } from "../config/icons";

export default function NewReservation() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-20 text-center">

      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#CC543A]/10 mb-6">
        <Icon icon={ICONS.tableMgmt} width={36} className="text-[#CC543A]" />
      </div>

      {/* Badge */}
      <span className="mb-4 inline-flex items-center rounded-full border border-[#CC543A]/30 bg-[#CC543A]/5 px-3 py-1 text-xs font-medium text-[#CC543A]">
        Coming Soon
      </span>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">
        New Reservation
      </h1>
      <p className="max-w-sm text-sm text-zinc-400 leading-relaxed mb-8">
        We're building a seamless reservation management experience. This feature will be available very soon.
      </p>

      {/* Dots decoration */}
      <div className="flex gap-2 mb-8">
        <span className="h-2 w-2 rounded-full bg-[#CC543A]" />
        <span className="h-2 w-2 rounded-full bg-[#CC543A]/40" />
        <span className="h-2 w-2 rounded-full bg-[#CC543A]/20" />
      </div>

      {/* Back button */}
      <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
        <Icon icon={ICONS.chevronLeft} width={16} />
        Go Back
      </Button>

    </div>
  );
}