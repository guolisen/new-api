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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='relative grid min-h-svh max-w-none overflow-hidden bg-transparent'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'radial-gradient(circle at 12% 12%, rgba(255,255,255,0.7), transparent 24%), radial-gradient(circle at 88% 10%, rgba(130,213,187,0.28), transparent 24%), radial-gradient(circle at 50% 100%, rgba(247,205,103,0.2), transparent 22%)',
        }}
      />
      <Link
        to='/'
        className='absolute top-5 left-5 z-10 flex items-center gap-3 rounded-full bg-white/60 px-3 py-2 shadow-[0_6px_18px_rgba(121,79,39,0.08)] backdrop-blur-sm transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
      >
        <div className='relative h-8 w-8'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-full' />
          ) : (
            <img src={logo} alt={t('Logo')} className='h-8 w-8 rounded-xl object-cover' />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <h1 className='text-xl font-extrabold tracking-[0.02em]'>{systemName}</h1>
        )}
      </Link>
      <div className='container relative z-10 flex items-center justify-center px-4 py-24 sm:py-12'>
        <div className='bg-card/92 ring-border/75 mx-auto flex w-full max-w-[520px] flex-col justify-center space-y-2 rounded-[32px] border-2 border-transparent px-5 py-8 shadow-[0_24px_60px_rgba(121,79,39,0.12)] backdrop-blur-md sm:p-10'>
          {children}
        </div>
      </div>
    </div>
  )
}
