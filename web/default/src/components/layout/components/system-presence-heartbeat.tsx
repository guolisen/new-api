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
import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { postSystemPresenceHeartbeat } from '@/features/system-info/api'
import { getOptionValue, useSystemOptions } from '@/features/system-settings/hooks/use-system-options'
import { useAuthStore } from '@/stores/auth-store'

const HEARTBEAT_INTERVAL_MS = 30_000

export function SystemPresenceHeartbeat() {
  const userId = useAuthStore((state) => state.auth.user?.id)
  const systemOptionsQuery = useSystemOptions()
  const realtimeSettings = getOptionValue(systemOptionsQuery.data?.data, {
    SystemRealtimeMonitoringEnabled: true,
  })
  const monitoringEnabled = realtimeSettings.SystemRealtimeMonitoringEnabled
  const currentPath = useLocation({
    select: (location) => location.href,
  })

  useEffect(() => {
    if (!userId || !monitoringEnabled) return

    const sendHeartbeat = () => {
      void postSystemPresenceHeartbeat(currentPath).catch(() => {
        // Heartbeat failures should not interrupt the dashboard experience.
      })
    }

    window.setTimeout(sendHeartbeat, 0)
    const timer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [currentPath, monitoringEnabled, userId])

  return null
}
