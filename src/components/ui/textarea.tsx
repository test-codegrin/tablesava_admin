import * as React from "react"
import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string
  error?: string
}

function Textarea({ className, label, error, id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="font-medium leading-none select-none"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        data-slot="textarea"
        className={cn(
          "field-sizing-content min-h-16 w-full border border-black bg-zinc-50 p-3 text-black transition-all outline-none placeholder:text-zinc-400 focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-100",
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

export { Textarea }