/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:   "bg-zinc-950 text-white hover:bg-zinc-900 focus-visible:ring-zinc-400",
        primary:   "bg-[#CC543A] text-white hover:bg-[#b8472f] focus-visible:ring-[#CC543A]/50",
        outline:   "border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 focus-visible:ring-zinc-300",
        secondary: "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 focus-visible:ring-zinc-300",
        ghost:     "text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-300",
        destructive: "bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-300",
        link:      "text-blue-700 underline-offset-4 hover:underline cursor-pointer",
      },
      size: {
        default:   "h-11 gap-2",
        xs:        "h-7 gap-1  px-3 text-xs",
        sm:        "h-9 gap-1.5 px-3 text-sm",
        lg:        "h-12 gap-2 px-5 text-base",
        icon:      "size-11",
        "icon-xs": "size-7 ",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
