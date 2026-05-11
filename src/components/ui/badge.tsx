import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-foreground text-background",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
        success: "border-transparent bg-success/10 text-success ring-1 ring-inset ring-success/20",
        warning: "border-transparent bg-warning/10 text-warning ring-1 ring-inset ring-warning/30",
        info: "border-transparent bg-info/10 text-info ring-1 ring-inset ring-info/20",
        brand: "border-transparent bg-brand/10 text-brand ring-1 ring-inset ring-brand/20",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
