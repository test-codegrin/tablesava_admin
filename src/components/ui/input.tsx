import * as React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
}

function Input({ className, type, label, error, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className=" font-medium  leading-none select-none"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        data-slot="input"
        className={cn(
          " w-full border border-black bg-zinc-50 p-3 text-black transition-all outline-none placeholder:text-zinc-400 focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-100",
          error && "border-red-400 ring-2 ring-red-100",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export { Input }