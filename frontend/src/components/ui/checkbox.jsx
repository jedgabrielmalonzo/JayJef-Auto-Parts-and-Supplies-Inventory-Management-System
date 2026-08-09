import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({
  className,
  ...props
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-white transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-black-900 focus-visible:ring-2 focus-visible:ring-black-900/15 disabled:cursor-not-allowed disabled:bg-gray-50 aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/20 data-checked:border-red-600 data-checked:bg-red-600 data-checked:text-white",
        className
      )}
      {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5">
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox }
