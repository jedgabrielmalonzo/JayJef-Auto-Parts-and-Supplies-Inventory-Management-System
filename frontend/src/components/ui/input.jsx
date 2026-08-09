import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded border border-input bg-white px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-black-900 focus-visible:ring-2 focus-visible:ring-black-900/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-black-300 aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/20",
        className
      )}
      {...props} />
  );
}

export { Input }
