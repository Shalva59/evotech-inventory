"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 whitespace-nowrap",
  {
    variants: {
      variant: {
        // Brass = the store's primary action colour.
        primary: "bg-brass text-brass-fg hover:bg-brass-hi",
        // Jade is reserved for committing money — checkout, confirm payment.
        confirm: "bg-jade text-bg hover:brightness-110",
        outline: "border border-line-strong text-fg hover:bg-elevated hover:border-brass",
        ghost: "text-muted hover:bg-elevated hover:text-fg",
        danger: "bg-danger-dim text-danger hover:bg-danger hover:text-bg",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-[15px]",
        xl: "h-16 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export const Button = React.forwardRef(function Button(
  { className, variant, size, asChild, children, ...props },
  ref
) {
  const classes = cn(buttonVariants({ variant, size }), className);

  // `asChild` lets a Next.js <Link> wear the button's clothes without nesting
  // an <a> inside a <button>, which browsers and screen readers both dislike.
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref,
      className: cn(classes, children.props.className),
      ...props,
    });
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});

export { buttonVariants };
