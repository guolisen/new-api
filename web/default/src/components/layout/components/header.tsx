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
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement>

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-[var(--app-header-height,4.5rem)] w-full shrink-0 bg-transparent px-3 pt-3',
        className
      )}
      {...props}
    >
      <div className='bg-background/88 ring-border/70 flex h-full items-center gap-2 rounded-[24px] border-2 border-transparent px-3 shadow-[0_8px_24px_rgba(121,79,39,0.08)] backdrop-blur-md sm:px-4'>
        <SidebarTrigger variant='outline' className='size-9' />
        {children}
      </div>
    </header>
  )
}
