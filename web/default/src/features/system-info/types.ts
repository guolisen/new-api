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
export type SystemInstanceStatus = 'online' | 'stale'

export type SystemInstanceInfo = {
  schema_version?: number
  node?: {
    name?: string
    source?: string
    manually_configured?: boolean
    should_configure_manually?: boolean
    [key: string]: unknown
  }
  role?: {
    is_master?: boolean
    [key: string]: unknown
  }
  runtime?: {
    version?: string
    goos?: string
    goarch?: string
    started_at?: number
    [key: string]: unknown
  }
  host?: {
    hostname?: string
    [key: string]: unknown
  }
  resources?: {
    cpu?: {
      usage_percent?: number
      [key: string]: unknown
    }
    memory?: {
      usage_percent?: number
      [key: string]: unknown
    }
    storage?: {
      total_bytes?: number
      used_bytes?: number
      free_bytes?: number
      used_percent?: number
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type SystemInstance = {
  node_name: string
  status: SystemInstanceStatus
  stale_after_seconds: number
  started_at: number
  last_seen_at: number
  info?: SystemInstanceInfo
}

export type SystemInstanceListResponse = {
  success: boolean
  message: string
  data?: SystemInstance[]
}

export type SystemRealtimePresenceUser = {
  user_id: number
  username: string
  role: number
  role_name: string
  group: string
  current_path: string
  client_ip: string
  last_seen_at: number
}

export type SystemRealtimePresenceSnapshot = {
  online_count: number
  stale_after_seconds: number
  users: SystemRealtimePresenceUser[]
}

export type SystemRealtimeSummary = {
  online_users: number
  active_requests: number
  active_http_connections: number
  recent_request_count: number
  success_count: number
  error_count: number
  success_rate: number
  avg_latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  quota: number
  rpm_1m: number
  tpm_1m: number
}

export type SystemRealtimeActiveRequest = {
  monitor_id: string
  request_id: string
  user_id: number
  username: string
  token_id: number
  channel_id: number
  channel_name: string
  model_name: string
  group: string
  request_path: string
  client_ip: string
  started_at: number
  duration_seconds: number
  is_stream: boolean
  attempt: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  quota: number
}

export type SystemRealtimeChannelPoint = {
  bucket_at: number
  request_count: number
  success_count: number
  error_count: number
  avg_latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  quota: number
}

export type SystemRealtimeChannelSnapshot = {
  channel_id: number
  channel_name: string
  active_requests: number
  recent_request_count: number
  success_count: number
  error_count: number
  success_rate: number
  avg_latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  quota: number
  rpm_1m: number
  tpm_1m: number
  series: SystemRealtimeChannelPoint[]
}

export type SystemRealtimeSnapshot = {
  generated_at: number
  window_seconds: number
  presence: SystemRealtimePresenceSnapshot
  summary: SystemRealtimeSummary
  active_requests: SystemRealtimeActiveRequest[]
  channels: SystemRealtimeChannelSnapshot[]
}

export type SystemRealtimeResponse = {
  success: boolean
  message: string
  data?: SystemRealtimeSnapshot
}
