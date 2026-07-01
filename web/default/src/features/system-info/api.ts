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
import { api, getCommonHeaders } from '@/lib/api'
import type { SystemInstanceListResponse, SystemRealtimeResponse } from './types'

export async function listSystemInstances() {
  const res = await api.get<SystemInstanceListResponse>(
    '/api/system-info/instances'
  )
  return res.data
}

export async function listSystemRealtime(windowSeconds = 15 * 60) {
  const res = await api.get<SystemRealtimeResponse>('/api/system-info/realtime', {
    params: {
      window_seconds: windowSeconds,
    },
  })
  return res.data
}

export async function postSystemPresenceHeartbeat(path: string) {
  const headers = getCommonHeaders()

  if (!headers['New-Api-User']) {
    return {
      success: false,
      message: 'missing user id',
    }
  }

  const res = await fetch('/api/system-info/presence/heartbeat', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ path }),
  })

  if (!res.ok) {
    return {
      success: false,
      message: `heartbeat failed: ${res.status}`,
    }
  }

  return res.json()
}
