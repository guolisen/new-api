/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { isValidElement } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-xl)] border-2 border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 active:not-aria-[haspopup]:translate-y-[2px] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-background text-foreground shadow-[0_5px_0_0_color-mix(in_srgb,var(--border)_96%,transparent)] hover:-translate-y-px hover:shadow-[0_6px_0_0_color-mix(in_srgb,var(--border)_96%,transparent)] active:translate-y-[2px] active:shadow-[0_1px_0_0_color-mix(in_srgb,var(--border)_96%,transparent)]',
        outline:
          'border-border bg-background text-card-foreground shadow-[0_2px_4px_rgba(61,52,40,0.06)] hover:border-primary hover:bg-card hover:text-foreground hover:shadow-[0_3px_10px_rgba(61,52,40,0.1)] hover:-translate-y-px aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[0_2px_4px_rgba(61,52,40,0.06)] hover:-translate-y-px hover:shadow-[0_3px_10px_rgba(61,52,40,0.1)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_5px_0_0_color-mix(in_srgb,var(--destructive)_70%,black_20%)] hover:-translate-y-px hover:shadow-[0_6px_0_0_color-mix(in_srgb,var(--destructive)_70%,black_20%)] active:translate-y-[2px] active:shadow-[0_1px_0_0_color-mix(in_srgb,var(--destructive)_70%,black_20%)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-11 gap-1.5 rounded-[50px] px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        xs: "h-8 gap-1 rounded-[16px] px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-[18px] px-4 text-[0.8rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-12 gap-1.5 rounded-[24px] px-8 text-base has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6',
        icon: 'size-11 rounded-[24px]',
        'icon-xs':
          "size-8 rounded-[16px] [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-9 rounded-[18px]',
        'icon-lg': 'size-12 rounded-[24px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function isNativeButtonRender(render: ButtonPrimitive.Props['render']) {
  if (!render || !isValidElement(render)) {
    return true
  }

  return render.type === 'button'
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  nativeButton,
  render,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={nativeButton ?? isNativeButtonRender(render)}
      render={render}
      {...props}
    />
  )
}

export { Button, buttonVariants }
