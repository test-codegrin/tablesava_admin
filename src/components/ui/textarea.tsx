import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  label?: string
  error?: string
}

function Textarea({ className, label, error, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

  const textareaNode = (
    <textarea
      id={textareaId}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-none border border-input bg-transparent px-2.5 py-2 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-xs dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )

  if (!label && !error) {
    return textareaNode
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="font-medium leading-none select-none">
          {label}
        </label>
      )}
      {textareaNode}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export { Textarea }
