import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// Variants match docs/09-design-system.md#component-states exactly — solid
// red = primary/brand action, red outline = destructive (never solid red
// fill for destructive, see "Red's Dual Role"). Focus ring is red for
// actions (--ring-color-action) vs black for form fields, per the same doc.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-gray-200 disabled:text-black-300",
        secondary:
          "border border-gray-300 bg-white text-black-900 hover:bg-gray-50 active:bg-gray-100 disabled:text-black-300 disabled:border-gray-200",
        destructive:
          "border-[1.5px] border-red-600 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-700 active:bg-red-100 active:text-red-800 active:border-red-800 disabled:text-black-300 disabled:border-gray-200",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 hover:text-black-900 disabled:text-black-300 disabled:border-gray-200",
        ghost:
          "border border-transparent hover:bg-gray-100 hover:text-black-900 disabled:text-black-300",
        link: "text-red-600 underline-offset-4 hover:underline disabled:text-black-300",
      },
      size: {
        default:
          "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
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
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
