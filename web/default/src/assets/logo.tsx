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
import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      id='aipaths-logo'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      height='24'
      width='24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn('size-6', className)}
      {...props}
    >
      <title>ai-paths</title>
      <path d='M4.5 7.5c0-1.657 1.343-3 3-3h4.25c2.071 0 3.75 1.679 3.75 3.75v1.5h1c1.657 0 3 1.343 3 3v3.75c0 1.657-1.343 3-3 3h-4.5c-1.381 0-2.5-1.119-2.5-2.5v-2.25c0-1.381 1.119-2.5 2.5-2.5h3.75v-1c0-1.105-.895-2-2-2H9.75v8.75a1 1 0 0 1-1.707.707L5.207 16.62A3.98 3.98 0 0 1 4.5 14.121V7.5Z' />
      <path d='M7.75 8.25h3.5' />
      <path d='M7.75 11.75h2.5' />
      <path d='M13.5 15.5h2.75' />
    </svg>
  )
}
