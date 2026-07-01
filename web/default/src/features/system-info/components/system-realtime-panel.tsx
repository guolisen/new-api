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
import { useMemo, useState, type ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Clock3,
  Gauge,
  RefreshCw,
  Users,
  Waypoints,
  Zap,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import {
  formatCompactNumber,
  formatNumber,
  formatPercent,
  formatQuota,
  formatTimeStr,
  formatTimestampRelative,
  formatTimestampToDate,
  formatTokens,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/components/error-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getOptionValue, useSystemOptions } from '@/features/system-settings/hooks/use-system-options'
import { listSystemRealtime } from '../api'
import type {
  SystemRealtimeActiveRequest,
  SystemRealtimeChannelPoint,
  SystemRealtimeChannelSnapshot,
  SystemRealtimeSnapshot,
} from '../types'

const REALTIME_WINDOW_SECONDS = 15 * 60
const REALTIME_POLL_INTERVAL_MS = 5_000
const MAX_CHART_CHANNELS = 6
const CHANNEL_COLORS = [
  '#0f766e',
  '#2563eb',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#059669',
]

type RealtimeMetric = 'requests' | 'tokens' | 'latency'

type RealtimeChartRow = {
  bucket_at: number
  label: string
} & Record<string, number | string>

function makeChannelSeriesKey(channelId: number) {
  return `channel_${channelId}`
}

function roleLabel(roleName: string) {
  switch (roleName) {
    case 'root':
      return 'Root'
    case 'admin':
      return 'Admin'
    case 'user':
      return 'User'
    default:
      return 'Guest'
  }
}

function formatLatency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '-'
  if (value < 1000) return `${formatNumber(value)} ms`
  return `${formatNumber(value / 1000)} s`
}

function formatMetricValue(value: number, metric: RealtimeMetric) {
  switch (metric) {
    case 'tokens':
      return formatTokens(value)
    case 'latency':
      return formatLatency(value)
    default:
      return formatNumber(value)
  }
}

function getMetricValue(point: SystemRealtimeChannelPoint, metric: RealtimeMetric) {
  switch (metric) {
    case 'tokens':
      return point.total_tokens
    case 'latency':
      return point.avg_latency_ms
    default:
      return point.request_count
  }
}

function metricTitle(metric: RealtimeMetric) {
  switch (metric) {
    case 'tokens':
      return 'Tokens'
    case 'latency':
      return 'Latency'
    default:
      return 'Requests'
  }
}

function metricDescription(metric: RealtimeMetric) {
  switch (metric) {
    case 'tokens':
      return 'Recent total tokens by channel'
    case 'latency':
      return 'Average latency by channel'
    default:
      return 'Recent request count by channel'
  }
}

type StatCardProps = {
  title: string
  value: string
  description: string
  icon: ComponentType<{ className?: string }>
}

function StatCard(props: StatCardProps) {
  const Icon = props.icon

  return (
    <div className='bg-muted/20 rounded-xl border p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='text-muted-foreground text-xs'>{props.title}</div>
          <div className='mt-1 text-2xl font-semibold tracking-tight'>
            {props.value}
          </div>
        </div>
        <span className='bg-background text-muted-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg border'>
          <Icon className='size-4' aria-hidden='true' />
        </span>
      </div>
      <p className='text-muted-foreground mt-3 text-xs'>{props.description}</p>
    </div>
  )
}

function SystemRealtimePanelLoading() {
  return (
    <div className='space-y-4 p-4 sm:p-5'>
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className='h-28 rounded-xl' />
        ))}
      </div>
      <Skeleton className='h-80 rounded-xl' />
      <div className='grid gap-4 xl:grid-cols-2'>
        <Skeleton className='h-72 rounded-xl' />
        <Skeleton className='h-72 rounded-xl' />
      </div>
      <Skeleton className='h-80 rounded-xl' />
    </div>
  )
}

function SystemRealtimeOverview(props: { snapshot: SystemRealtimeSnapshot }) {
  const summary = props.snapshot.summary

  return (
    <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
      <StatCard
        title='Online users'
        value={formatCompactNumber(summary.online_users)}
        description='Logged-in dashboard users with a recent heartbeat'
        icon={Users}
      />
      <StatCard
        title='Active relay requests'
        value={formatCompactNumber(summary.active_requests)}
        description='In-flight upstream requests on this node'
        icon={Activity}
      />
      <StatCard
        title='HTTP active connections'
        value={formatCompactNumber(summary.active_http_connections)}
        description='Current HTTP requests being processed'
        icon={Waypoints}
      />
      <StatCard
        title='1-minute RPM'
        value={formatCompactNumber(summary.rpm_1m)}
        description='Completed upstream attempts in the last minute'
        icon={Zap}
      />
      <StatCard
        title='1-minute TPM'
        value={formatTokens(summary.tpm_1m)}
        description='Prompt + completion tokens settled in the last minute'
        icon={Gauge}
      />
      <StatCard
        title='Recent success rate'
        value={formatPercent(summary.success_rate)}
        description={`Avg latency ${formatLatency(summary.avg_latency_ms)}`}
        icon={Clock3}
      />
    </div>
  )
}

function SystemRealtimeChart(props: {
  snapshot: SystemRealtimeSnapshot
  metric: RealtimeMetric
  onMetricChange: (metric: RealtimeMetric) => void
}) {
  const { t } = useTranslation()

  const chartChannels = useMemo(
    () =>
      props.snapshot.channels
        .filter(
          (channel) =>
            channel.active_requests > 0 || channel.recent_request_count > 0
        )
        .slice(0, MAX_CHART_CHANNELS),
    [props.snapshot.channels]
  )

  const chartConfig = useMemo<ChartConfig>(() => {
    const entries = chartChannels.map((channel, index) => [
      makeChannelSeriesKey(channel.channel_id),
      {
        label: channel.channel_name,
        color: CHANNEL_COLORS[index % CHANNEL_COLORS.length],
      },
    ])
    return Object.fromEntries(entries)
  }, [chartChannels])

  const chartData = useMemo<RealtimeChartRow[]>(() => {
    if (chartChannels.length === 0) return []

    return chartChannels[0].series.map((point, index) => {
      const row: RealtimeChartRow = {
        bucket_at: point.bucket_at,
        label: formatTimeStr(new Date(point.bucket_at * 1000)),
      }
      for (const channel of chartChannels) {
        const seriesPoint = channel.series[index]
        row[makeChannelSeriesKey(channel.channel_id)] = seriesPoint
          ? getMetricValue(seriesPoint, props.metric)
          : 0
      }
      return row
    })
  }, [chartChannels, props.metric])

  return (
    <div className='bg-background rounded-xl border p-4'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h4 className='text-sm font-semibold'>{metricTitle(props.metric)}</h4>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {metricDescription(props.metric)}
          </p>
        </div>
        <Tabs
          value={props.metric}
          onValueChange={(value) => props.onMetricChange(value as RealtimeMetric)}
        >
          <TabsList className='bg-muted/50 h-8 p-0.5'>
            <TabsTrigger value='requests' className='h-7 px-3 text-xs'>
              {t('Requests')}
            </TabsTrigger>
            <TabsTrigger value='tokens' className='h-7 px-3 text-xs'>
              {t('Tokens')}
            </TabsTrigger>
            <TabsTrigger value='latency' className='h-7 px-3 text-xs'>
              {t('Latency')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {chartChannels.length === 0 ? (
        <div className='text-muted-foreground mt-6 rounded-lg border border-dashed px-4 py-12 text-center text-sm'>
          {t('No realtime channel traffic yet.')}
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className='mt-5 h-80 w-full'
          initialDimension={{ width: 960, height: 320 }}
        >
          <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={72}
              tickFormatter={(value: number) =>
                formatMetricValue(Number(value), props.metric)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator='line'
                  labelFormatter={(_, payload) => {
                    const bucketAt = payload?.[0]?.payload?.bucket_at
                    return typeof bucketAt === 'number'
                      ? formatTimestampToDate(bucketAt)
                      : ''
                  }}
                  formatter={(value, name) => (
                    <>
                      <span className='text-muted-foreground'>
                        {chartConfig[String(name)]?.label ?? String(name)}
                      </span>
                      <span className='font-mono font-medium'>
                        {formatMetricValue(Number(value), props.metric)}
                      </span>
                    </>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {chartChannels.map((channel) => {
              const dataKey = makeChannelSeriesKey(channel.channel_id)
              return (
                <Line
                  key={dataKey}
                  type='monotone'
                  dataKey={dataKey}
                  stroke={`var(--color-${dataKey})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )
            })}
          </LineChart>
        </ChartContainer>
      )}
    </div>
  )
}

function ActiveUsersTable(props: { snapshot: SystemRealtimeSnapshot }) {
  const { t, i18n } = useTranslation()

  return (
    <div className='bg-background rounded-xl border p-4'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <div>
          <h4 className='text-sm font-semibold'>{t('Active Users')}</h4>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {t('Users recently active in the dashboard on this node.')}
          </p>
        </div>
        <Badge variant='outline'>{props.snapshot.presence.online_count}</Badge>
      </div>

      {props.snapshot.presence.users.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm'>
          {t('No online users right now.')}
        </div>
      ) : (
        <div className='overflow-x-auto rounded-md border'>
          <Table className='min-w-[760px]'>
            <TableHeader>
              <TableRow className='bg-muted/40 hover:bg-muted/40'>
                <TableHead className='h-9 px-4 text-xs'>{t('User')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Role')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Group')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Current Page')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('IP')}</TableHead>
                <TableHead className='h-9 pr-4 text-xs'>{t('Last Seen')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.snapshot.presence.users.map((user) => (
                <TableRow key={user.user_id} className='hover:bg-muted/30'>
                  <TableCell className='px-4 py-3 align-middle'>
                    <div className='space-y-0.5'>
                      <div className='font-medium'>{user.username}</div>
                      <div className='text-muted-foreground font-mono text-[11px]'>
                        ID: {user.user_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='py-3 align-middle'>
                    <Badge variant='secondary'>{roleLabel(user.role_name)}</Badge>
                  </TableCell>
                  <TableCell className='py-3 align-middle'>
                    <span className='font-mono text-xs'>{user.group || '-'}</span>
                  </TableCell>
                  <TableCell className='text-muted-foreground max-w-[240px] truncate py-3 font-mono text-xs align-middle'>
                    {user.current_path || '-'}
                  </TableCell>
                  <TableCell className='text-muted-foreground py-3 font-mono text-xs align-middle'>
                    {user.client_ip || '-'}
                  </TableCell>
                  <TableCell
                    className='text-muted-foreground py-3 pr-4 text-xs whitespace-nowrap align-middle'
                    title={formatTimestampToDate(user.last_seen_at)}
                  >
                    {formatTimestampRelative(
                      user.last_seen_at,
                      'seconds',
                      i18n.language
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function ActiveRequestsTable(props: { requests: SystemRealtimeActiveRequest[] }) {
  const { t } = useTranslation()

  return (
    <div className='bg-background rounded-xl border p-4'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <div>
          <h4 className='text-sm font-semibold'>{t('In-flight Requests')}</h4>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {t('Current upstream attempts running on this node.')}
          </p>
        </div>
        <Badge variant='outline'>{props.requests.length}</Badge>
      </div>

      {props.requests.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm'>
          {t('No active requests right now.')}
        </div>
      ) : (
        <div className='overflow-x-auto rounded-md border'>
          <Table className='min-w-[980px]'>
            <TableHeader>
              <TableRow className='bg-muted/40 hover:bg-muted/40'>
                <TableHead className='h-9 px-4 text-xs'>{t('User')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Channel')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Model')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Path')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Duration')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Tokens')}</TableHead>
                <TableHead className='h-9 pr-4 text-xs'>{t('Quota')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.requests.map((request) => (
                <TableRow key={request.monitor_id} className='hover:bg-muted/30'>
                  <TableCell className='px-4 py-3 align-middle'>
                    <div className='space-y-0.5'>
                      <div className='font-medium'>{request.username}</div>
                      <div className='text-muted-foreground font-mono text-[11px]'>
                        {request.group || '-'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='py-3 align-middle'>
                    <div className='space-y-0.5'>
                      <div className='font-medium'>{request.channel_name}</div>
                      <div className='text-muted-foreground font-mono text-[11px]'>
                        #{request.channel_id} · {request.is_stream ? 'stream' : 'sync'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='max-w-[220px] truncate py-3 font-mono text-xs align-middle'>
                    {request.model_name || '-'}
                  </TableCell>
                  <TableCell className='text-muted-foreground max-w-[240px] truncate py-3 font-mono text-xs align-middle'>
                    {request.request_path || '-'}
                  </TableCell>
                  <TableCell className='py-3 align-middle'>
                    <div className='space-y-0.5'>
                      <div className='font-mono text-xs'>
                        {request.duration_seconds}s
                      </div>
                      <div className='text-muted-foreground text-[11px]'>
                        {formatTimestampToDate(request.started_at)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='py-3 font-mono text-xs align-middle'>
                    {request.total_tokens > 0 ? formatTokens(request.total_tokens) : '-'}
                  </TableCell>
                  <TableCell className='py-3 pr-4 font-mono text-xs align-middle'>
                    {request.quota > 0 ? formatQuota(request.quota) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function ChannelSummaryTable(props: { channels: SystemRealtimeChannelSnapshot[] }) {
  const { t } = useTranslation()

  return (
    <div className='bg-background rounded-xl border p-4'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <div>
          <h4 className='text-sm font-semibold'>{t('Channel Usage')}</h4>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {t('Recent request volume and settled usage by channel.')}
          </p>
        </div>
        <Badge variant='outline'>{props.channels.length}</Badge>
      </div>

      {props.channels.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm'>
          {t('No recent channel activity yet.')}
        </div>
      ) : (
        <div className='overflow-x-auto rounded-md border'>
          <Table className='min-w-[1120px]'>
            <TableHeader>
              <TableRow className='bg-muted/40 hover:bg-muted/40'>
                <TableHead className='h-9 px-4 text-xs'>{t('Channel')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Active')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('15m Requests')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('1m RPM')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('1m TPM')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Success')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Avg Latency')}</TableHead>
                <TableHead className='h-9 text-xs'>{t('Tokens')}</TableHead>
                <TableHead className='h-9 pr-4 text-xs'>{t('Quota')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.channels.map((channel) => (
                <TableRow key={channel.channel_id} className='hover:bg-muted/30'>
                  <TableCell className='px-4 py-3 align-middle'>
                    <div className='space-y-0.5'>
                      <div className='font-medium'>{channel.channel_name}</div>
                      <div className='text-muted-foreground font-mono text-[11px]'>
                        #{channel.channel_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='py-3 align-middle'>
                    <Badge
                      variant='secondary'
                      className={cn(
                        channel.active_requests > 0 &&
                          'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      )}
                    >
                      {channel.active_requests}
                    </Badge>
                  </TableCell>
                  <TableCell className='py-3 font-mono text-xs align-middle'>
                    {formatNumber(channel.recent_request_count)}
                  </TableCell>
                  <TableCell className='py-3 font-mono text-xs align-middle'>
                    {formatNumber(channel.rpm_1m)}
                  </TableCell>
                  <TableCell className='py-3 font-mono text-xs align-middle'>
                    {formatTokens(channel.tpm_1m)}
                  </TableCell>
                  <TableCell className='py-3 font-mono text-xs align-middle'>
                    {formatPercent(channel.success_rate)}
                  </TableCell>
                  <TableCell className='py-3 font-mono text-xs align-middle'>
                    {formatLatency(channel.avg_latency_ms)}
                  </TableCell>
                  <TableCell className='py-3 font-mono text-xs align-middle'>
                    {formatTokens(channel.total_tokens)}
                  </TableCell>
                  <TableCell className='py-3 pr-4 font-mono text-xs align-middle'>
                    {channel.quota > 0 ? formatQuota(channel.quota) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export function SystemRealtimePanel() {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<RealtimeMetric>('requests')
  const systemOptionsQuery = useSystemOptions()
  const realtimeSettings = getOptionValue(systemOptionsQuery.data?.data, {
    SystemRealtimeMonitoringEnabled: true,
  })
  const monitoringEnabled = realtimeSettings.SystemRealtimeMonitoringEnabled

  const realtimeQuery = useQuery({
    queryKey: ['system-info', 'realtime', REALTIME_WINDOW_SECONDS],
    queryFn: async () => {
      const res = await listSystemRealtime(REALTIME_WINDOW_SECONDS)
      if (!res.success || !res.data) {
        throw new Error(res.message || t('We could not load realtime system data.'))
      }
      return res.data
    },
    staleTime: REALTIME_POLL_INTERVAL_MS,
    retry: false,
    refetchInterval: monitoringEnabled ? REALTIME_POLL_INTERVAL_MS : false,
    enabled: monitoringEnabled,
  })

  const snapshot = realtimeQuery.data
  const refreshing = realtimeQuery.isFetching && !realtimeQuery.isLoading

  return (
    <section className='bg-card overflow-hidden rounded-lg border shadow-xs'>
      <div className='flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <span className='bg-muted text-muted-foreground inline-flex size-7 items-center justify-center rounded-md'>
              <Activity className='size-4' aria-hidden='true' />
            </span>
            <div className='min-w-0'>
              <h3 className='text-sm font-semibold'>{t('System Realtime')}</h3>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {t(
                  'Single-node live view of online users, in-flight requests, and recent channel traffic.'
                )}
              </p>
            </div>
          </div>
        </div>
        <div className='flex shrink-0 items-center gap-3'>
          <span className='text-muted-foreground text-xs' aria-live='polite'>
            {t('Auto-refreshing every {{seconds}}s', {
              seconds: REALTIME_POLL_INTERVAL_MS / 1000,
            })}
          </span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => void realtimeQuery.refetch()}
            disabled={realtimeQuery.isFetching}
            aria-label={t('Refresh')}
          >
            <RefreshCw
              data-icon='inline-start'
              className={cn('size-3.5', refreshing && 'animate-spin')}
              aria-hidden='true'
            />
            {refreshing ? t('Refreshing...') : t('Refresh')}
          </Button>
        </div>
      </div>

      <div aria-busy={realtimeQuery.isFetching}>
        {!monitoringEnabled ? (
          <div className='text-muted-foreground flex min-h-[280px] items-center justify-center px-6 py-12 text-center text-sm'>
            {t(
              'Realtime monitoring is currently disabled. Enable it in System Settings or from the switch above to resume live metrics collection.'
            )}
          </div>
        ) : realtimeQuery.isLoading ? (
          <SystemRealtimePanelLoading />
        ) : realtimeQuery.isError ? (
          <ErrorState
            title={t('We could not load realtime system data.')}
            description={
              realtimeQuery.error instanceof Error
                ? realtimeQuery.error.message
                : undefined
            }
            onRetry={() => {
              void realtimeQuery.refetch()
            }}
            className='min-h-[360px]'
          />
        ) : snapshot ? (
          <div className='space-y-4 p-4 sm:p-5'>
            <SystemRealtimeOverview snapshot={snapshot} />
            <SystemRealtimeChart
              snapshot={snapshot}
              metric={metric}
              onMetricChange={setMetric}
            />
            <div className='grid gap-4 xl:grid-cols-2'>
              <ActiveUsersTable snapshot={snapshot} />
              <ActiveRequestsTable requests={snapshot.active_requests} />
            </div>
            <ChannelSummaryTable channels={snapshot.channels} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
