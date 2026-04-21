"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[13px] font-medium ring-offset-background transition-all duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] active:shadow-inner",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-110 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent hover:border-primary/40 hover:bg-primary/5",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:border-primary/30 hover:bg-primary/5",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Awardscut custom variants
        hero: "bg-primary text-primary-foreground hover:brightness-110 shadow-md hover:shadow-lg hover:shadow-primary/20 transform hover:-translate-y-0.5",
        gold: "bg-accent text-accent-foreground font-bold hover:bg-accent/90 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        heroOutline: "border-2 border-primary/30 bg-transparent text-foreground hover:bg-primary/5 hover:border-primary/50",
        dark: "bg-card text-foreground hover:bg-muted border border-border",
        glass: "backdrop-blur-lg bg-background/50 border border-border text-foreground hover:bg-background/80",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-sm",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
