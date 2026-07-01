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
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { getOptionValue, useSystemOptions } from '@/features/system-settings/hooks/use-system-options'
import { useUpdateOption } from '@/features/system-settings/hooks/use-update-option'
import { SystemInstancesPanel } from './components/system-instances-panel'
import { SystemRealtimePanel } from './components/system-realtime-panel'
import { SystemTasksPanel } from './components/system-tasks-panel'

export function SystemInfo() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const updateOption = useUpdateOption()
  const systemOptionsQuery = useSystemOptions()
  const realtimeSettings = getOptionValue(systemOptionsQuery.data?.data, {
    SystemRealtimeMonitoringEnabled: true,
  })
  const monitoringEnabled = realtimeSettings.SystemRealtimeMonitoringEnabled

  const handleRealtimeToggle = async (checked: boolean) => {
    await updateOption.mutateAsync({
      key: 'SystemRealtimeMonitoringEnabled',
      value: checked,
    })

    if (!checked) {
      queryClient.removeQueries({ queryKey: ['system-info', 'realtime'] })
    } else {
      void queryClient.invalidateQueries({ queryKey: ['system-info', 'realtime'] })
    }
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <span className='inline-flex min-w-0 items-center gap-2'>
          <span className='truncate'>{t('System Info')}</span>
          <Badge variant='outline' className='shrink-0'>
            Root
          </Badge>
        </span>
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='space-y-4'>
          <section className='bg-card rounded-lg border p-4 shadow-xs'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-1'>
                <h3 className='text-sm font-semibold'>
                  {t('Realtime Monitoring Control')}
                </h3>
                <p className='text-muted-foreground text-xs'>
                  {t(
                    'Turn off live presence tracking, request sampling, and channel metrics collection to reduce runtime overhead.'
                  )}
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <Badge variant={monitoringEnabled ? 'default' : 'outline'}>
                  {monitoringEnabled ? t('Enabled') : t('Disabled')}
                </Badge>
                <Switch
                  checked={monitoringEnabled}
                  onCheckedChange={(checked) => void handleRealtimeToggle(checked)}
                  disabled={updateOption.isPending || systemOptionsQuery.isLoading}
                  aria-label={t('Realtime Monitoring Control')}
                />
              </div>
            </div>
          </section>
          <SystemRealtimePanel />
          <SystemInstancesPanel />
          <SystemTasksPanel />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
