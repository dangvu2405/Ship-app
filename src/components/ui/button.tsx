import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "sku-btn sku-btn-primary text-primary-foreground border-b-2 border-primary/70 hover:brightness-110 active:brightness-95",
        destructive:
          "sku-btn bg-gradient-to-b from-destructive to-red-700 text-destructive-foreground border-b-2 border-red-800 hover:brightness-110 active:brightness-95",
        success:
          "sku-btn bg-gradient-to-b from-success to-emerald-700 text-success-foreground border-b-2 border-emerald-800 hover:brightness-110 active:brightness-95",
        warning:
          "sku-btn bg-gradient-to-b from-warning to-amber-600 text-warning-foreground border-b-2 border-amber-700 hover:brightness-110 active:brightness-95",
        outline:
          "sku-btn sku-btn-secondary border border-input text-foreground hover:bg-accent/50 active:bg-accent",
        secondary:
          "sku-btn sku-btn-secondary border border-input text-secondary-foreground hover:bg-secondary/80 active:bg-secondary",
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground rounded-md transition-colors",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3.5 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
