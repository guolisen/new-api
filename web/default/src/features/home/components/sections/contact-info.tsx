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
import { Mail, MessageSquareMore } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Markdown } from '@/components/ui/markdown'
import { AnimateInView } from '@/components/animate-in-view'

interface ContactInfoSectionProps {
  content?: string
}

export function ContactInfoSection({ content }: ContactInfoSectionProps) {
  const { t } = useTranslation()
  const trimmed = content?.trim()

  if (!trimmed) {
    return null
  }

  return (
    <section className='relative z-10 px-6 pb-24'>
      <AnimateInView
        className='bg-card/85 border-border/60 mx-auto max-w-4xl rounded-[28px] border px-8 py-10 shadow-[0_18px_44px_rgba(121,79,39,0.08)] backdrop-blur-md'
        animation='slide-up'
      >
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='max-w-lg'>
            <div className='text-muted-foreground mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-[0.24em] uppercase'>
              <MessageSquareMore className='h-4 w-4' />
              {t('Contact Us')}
            </div>
            <h3 className='text-2xl font-semibold tracking-tight'>
              {t('Need help or want to get in touch?')}
            </h3>
            <p className='text-muted-foreground mt-3 text-sm leading-7'>
              {t(
                'Use the contact details below to reach the team, ask questions, or request support.'
              )}
            </p>
          </div>

          <div className='bg-muted/35 border-border/50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm'>
            <Mail className='text-primary h-4 w-4 shrink-0' />
            <span className='text-muted-foreground'>
              {t('Configured from System Settings')}
            </span>
          </div>
        </div>

        <div className='bg-background/60 border-border/40 mt-6 rounded-2xl border p-5'>
          <Markdown className='prose prose-sm dark:prose-invert max-w-none text-sm leading-7'>
            {trimmed}
          </Markdown>
        </div>
      </AnimateInView>
    </section>
  )
}
