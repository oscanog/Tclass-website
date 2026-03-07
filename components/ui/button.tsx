import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98] lg:rounded-xl lg:tracking-[0.01em]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md shadow-blue-500/25 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-blue-500/30 lg:bg-[linear-gradient(135deg,oklch(0.56_0.18_254),oklch(0.62_0.14_230))] lg:shadow-[0_18px_34px_-18px_oklch(0.42_0.1_245/0.65)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 lg:shadow-[0_16px_30px_-18px_oklch(0.58_0.2_24/0.6)]",
        outline:
          "border bg-background/80 shadow-xs backdrop-blur-sm hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 lg:border-white/60 lg:bg-white/78 lg:shadow-[0_14px_28px_-24px_oklch(0.29_0.04_248/0.55)] dark:lg:border-white/10 dark:lg:bg-white/6",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 lg:bg-[linear-gradient(180deg,oklch(0.96_0.012_245),oklch(0.92_0.022_242))] lg:shadow-[0_14px_26px_-22px_oklch(0.29_0.04_248/0.45)] dark:lg:bg-white/8",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 lg:hover:bg-white/70 dark:lg:hover:bg-white/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 lg:h-10 lg:px-5",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 lg:h-9 lg:px-4",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 lg:h-11 lg:px-7",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 lg:size-9",
        "icon-lg": "size-10 lg:size-11",
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
