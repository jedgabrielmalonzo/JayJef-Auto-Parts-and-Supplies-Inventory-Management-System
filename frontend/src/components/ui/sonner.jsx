"use client"

import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Light theme only, no next-themes — this app has no dark mode
// (docs/09-design-system.md assumptions). richColors tints success/error
// using the same tint-background pattern as Badge/inline banners
// (green-100/green-700, red-100/red-700) instead of sonner's own palette.
const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--color-green-100)",
          "--success-text": "var(--color-green-700)",
          "--success-border": "var(--color-green-100)",
          "--error-bg": "var(--color-red-100)",
          "--error-text": "var(--color-red-700)",
          "--error-border": "var(--color-red-100)",
          "--warning-bg": "var(--color-amber-100)",
          "--warning-text": "var(--color-amber-700)",
          "--warning-border": "var(--color-amber-100)",
        }
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props} />
  );
}

export { Toaster }
