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
import type { TopNavLink } from '../types'
import { PublicHeader, type PublicHeaderProps } from './public-header'

type PublicLayoutProps = {
  children: React.ReactNode
  showMainContainer?: boolean
  navContent?: React.ReactNode
  headerProps?: Omit<PublicHeaderProps, 'navContent'>
  navLinks?: TopNavLink[]
  showThemeSwitch?: boolean
  showAuthButtons?: boolean
  showNotifications?: boolean
  logo?: React.ReactNode
  siteName?: string
}

export function PublicLayout(props: PublicLayoutProps) {
  return (
    <div className='bg-background text-foreground relative min-h-svh overflow-x-clip'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-70'
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.75), transparent 24%), radial-gradient(circle at 100% 0%, rgba(130,213,187,0.24), transparent 28%), radial-gradient(circle at 50% 100%, rgba(247,205,103,0.18), transparent 22%)',
        }}
      />
      <PublicHeader
        navContent={props.navContent}
        navLinks={props.navLinks}
        showThemeSwitch={props.showThemeSwitch}
        showAuthButtons={props.showAuthButtons}
        showNotifications={props.showNotifications}
        logo={props.logo}
        siteName={props.siteName}
        {...props.headerProps}
      />

      {props.showMainContainer !== false ? (
        <main className='container relative z-10 px-4 py-6 pt-24 md:px-4'>
          {props.children}
        </main>
      ) : (
        props.children
      )}
    </div>
  )
}
