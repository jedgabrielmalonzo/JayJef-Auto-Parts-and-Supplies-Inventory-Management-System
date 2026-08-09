import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded border border-input bg-white px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-black-900 focus-visible:ring-2 focus-visible:ring-black-900/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-black-300 aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/20",
        className
      )}
      {...props} />
  );
}

export { Textarea }
