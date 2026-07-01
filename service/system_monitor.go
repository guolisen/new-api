package service

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"

	"github.com/gin-gonic/gin"
)

const (
	systemMonitorPresenceTTL      = 90 * time.Second
	systemMonitorBucketSize       = 10 * time.Second
	systemMonitorRetention        = 30 * time.Minute
	systemMonitorDefaultWindowSec = 15 * 60
	systemMonitorContextRequestID = "system_monitor_request_id"
)

type SystemRealtimePresenceUser struct {
	UserID      int    `json:"user_id"`
	Username    string `json:"username"`
	Role        int    `json:"role"`
	RoleName    string `json:"role_name"`
	Group       string `json:"group"`
	CurrentPath string `json:"current_path"`
	ClientIP    string `json:"client_ip"`
	LastSeenAt  int64  `json:"last_seen_at"`
}

type SystemRealtimePresenceSnapshot struct {
	OnlineCount       int                          `json:"online_count"`
	StaleAfterSeconds int                          `json:"stale_after_seconds"`
	Users             []SystemRealtimePresenceUser `json:"users"`
}

type SystemRealtimeSummary struct {
	OnlineUsers           int     `json:"online_users"`
	ActiveRequests        int     `json:"active_requests"`
	ActiveHTTPConnections int64   `json:"active_http_connections"`
	RecentRequestCount    int     `json:"recent_request_count"`
	SuccessCount          int     `json:"success_count"`
	ErrorCount            int     `json:"error_count"`
	SuccessRate           float64 `json:"success_rate"`
	AvgLatencyMs          float64 `json:"avg_latency_ms"`
	PromptTokens          int     `json:"prompt_tokens"`
	CompletionTokens      int     `json:"completion_tokens"`
	TotalTokens           int     `json:"total_tokens"`
	Quota                 int     `json:"quota"`
	RPM1m                 float64 `json:"rpm_1m"`
	TPM1m                 float64 `json:"tpm_1m"`
}

type SystemRealtimeActiveRequest struct {
	MonitorID        string `json:"monitor_id"`
	RequestID        string `json:"request_id"`
	UserID           int    `json:"user_id"`
	Username         string `json:"username"`
	TokenID          int    `json:"token_id"`
	ChannelID        int    `json:"channel_id"`
	ChannelName      string `json:"channel_name"`
	ModelName        string `json:"model_name"`
	Group            string `json:"group"`
	RequestPath      string `json:"request_path"`
	ClientIP         string `json:"client_ip"`
	StartedAt        int64  `json:"started_at"`
	DurationSeconds  int64  `json:"duration_seconds"`
	IsStream         bool   `json:"is_stream"`
	Attempt          int    `json:"attempt"`
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
	TotalTokens      int    `json:"total_tokens"`
	Quota            int    `json:"quota"`
}

type SystemRealtimeChannelPoint struct {
	BucketAt         int64   `json:"bucket_at"`
	RequestCount     int     `json:"request_count"`
	SuccessCount     int     `json:"success_count"`
	ErrorCount       int     `json:"error_count"`
	AvgLatencyMs     float64 `json:"avg_latency_ms"`
	PromptTokens     int     `json:"prompt_tokens"`
	CompletionTokens int     `json:"completion_tokens"`
	TotalTokens      int     `json:"total_tokens"`
	Quota            int     `json:"quota"`
}

type SystemRealtimeChannelSnapshot struct {
	ChannelID          int                          `json:"channel_id"`
	ChannelName        string                       `json:"channel_name"`
	ActiveRequests     int                          `json:"active_requests"`
	RecentRequestCount int                          `json:"recent_request_count"`
	SuccessCount       int                          `json:"success_count"`
	ErrorCount         int                          `json:"error_count"`
	SuccessRate        float64                      `json:"success_rate"`
	AvgLatencyMs       float64                      `json:"avg_latency_ms"`
	PromptTokens       int                          `json:"prompt_tokens"`
	CompletionTokens   int                          `json:"completion_tokens"`
	TotalTokens        int                          `json:"total_tokens"`
	Quota              int                          `json:"quota"`
	RPM1m              float64                      `json:"rpm_1m"`
	TPM1m              float64                      `json:"tpm_1m"`
	Series             []SystemRealtimeChannelPoint `json:"series"`
}

type SystemRealtimeSnapshot struct {
	GeneratedAt    int64                           `json:"generated_at"`
	WindowSeconds  int                             `json:"window_seconds"`
	Presence       SystemRealtimePresenceSnapshot  `json:"presence"`
	Summary        SystemRealtimeSummary           `json:"summary"`
	ActiveRequests []SystemRealtimeActiveRequest   `json:"active_requests"`
	Channels       []SystemRealtimeChannelSnapshot `json:"channels"`
}

type systemMonitorPresenceRecord struct {
	UserID      int
	Username    string
	Role        int
	Group       string
	CurrentPath string
	ClientIP    string
	LastSeenAt  time.Time
}

type systemMonitorActiveRequest struct {
	MonitorID        string
	RequestID        string
	UserID           int
	Username         string
	TokenID          int
	ChannelID        int
	ChannelName      string
	ModelName        string
	Group            string
	RequestPath      string
	ClientIP         string
	StartedAt        time.Time
	IsStream         bool
	Attempt          int
	PromptTokens     int
	CompletionTokens int
	TotalTokens      int
	Quota            int
}

type systemMonitorAggregate struct {
	RequestCount     int64
	SuccessCount     int64
	ErrorCount       int64
	TotalLatencyMs   int64
	PromptTokens     int64
	CompletionTokens int64
	TotalTokens      int64
	Quota            int64
}

type systemMonitorBucketChannel struct {
	ChannelID   int
	ChannelName string
	Aggregate   systemMonitorAggregate
}

type systemMonitorState struct {
	mu             sync.RWMutex
	presence       map[int]*systemMonitorPresenceRecord
	activeRequests map[string]*systemMonitorActiveRequest
	buckets        map[int64]map[int]*systemMonitorBucketChannel
}

type systemMonitorChannelState struct {
	ChannelID       int
	ChannelName     string
	ActiveRequests  int
	RecentAggregate systemMonitorAggregate
	LastMinute      systemMonitorAggregate
	Points          map[int64]SystemRealtimeChannelPoint
}

var globalSystemMonitor = &systemMonitorState{
	presence:       make(map[int]*systemMonitorPresenceRecord),
	activeRequests: make(map[string]*systemMonitorActiveRequest),
	buckets:        make(map[int64]map[int]*systemMonitorBucketChannel),
}

var systemRealtimeMonitoringEnabledState atomic.Bool

func IsSystemRealtimeMonitoringEnabled() bool {
	common.OptionMapRWMutex.RLock()
	value, ok := common.OptionMap["SystemRealtimeMonitoringEnabled"]
	common.OptionMapRWMutex.RUnlock()

	enabled := true
	if ok && strings.TrimSpace(value) != "" {
		parsed, err := strconv.ParseBool(value)
		if err == nil {
			enabled = parsed
		}
	}

	if enabled {
		systemRealtimeMonitoringEnabledState.Store(true)
		return true
	}

	if systemRealtimeMonitoringEnabledState.Swap(false) {
		ResetSystemRealtimeMonitor()
	}
	return false
}

func ResetSystemRealtimeMonitor() {
	globalSystemMonitor.mu.Lock()
	defer globalSystemMonitor.mu.Unlock()

	globalSystemMonitor.presence = make(map[int]*systemMonitorPresenceRecord)
	globalSystemMonitor.activeRequests = make(map[string]*systemMonitorActiveRequest)
	globalSystemMonitor.buckets = make(map[int64]map[int]*systemMonitorBucketChannel)
}

func RecordSystemPresence(userID int, username string, role int, group string, currentPath string, clientIP string) {
	if userID <= 0 || !IsSystemRealtimeMonitoringEnabled() {
		return
	}

	now := time.Now()

	globalSystemMonitor.mu.Lock()
	defer globalSystemMonitor.mu.Unlock()

	globalSystemMonitor.cleanupLocked(now)
	globalSystemMonitor.presence[userID] = &systemMonitorPresenceRecord{
		UserID:      userID,
		Username:    fallbackUsername(userID, username),
		Role:        role,
		Group:       strings.TrimSpace(group),
		CurrentPath: strings.TrimSpace(currentPath),
		ClientIP:    strings.TrimSpace(clientIP),
		LastSeenAt:  now,
	}
}

func StartRelayMonitorRequest(c *gin.Context, relayInfo *relaycommon.RelayInfo, channel *model.Channel, attempt int) string {
	if c == nil || relayInfo == nil || channel == nil || !IsSystemRealtimeMonitoringEnabled() {
		return ""
	}

	now := time.Now()
	monitorID := fmt.Sprintf("%s:%d:%d", relayInfo.RequestId, attempt, channel.Id)

	requestPath := relayInfo.RequestURLPath
	if requestPath == "" && c.Request != nil && c.Request.URL != nil {
		requestPath = c.Request.URL.Path
	}

	record := &systemMonitorActiveRequest{
		MonitorID:   monitorID,
		RequestID:   relayInfo.RequestId,
		UserID:      relayInfo.UserId,
		Username:    fallbackUsername(relayInfo.UserId, c.GetString("username")),
		TokenID:     relayInfo.TokenId,
		ChannelID:   channel.Id,
		ChannelName: fallbackChannelName(channel.Id, channel.Name),
		ModelName:   relayInfo.OriginModelName,
		Group:       strings.TrimSpace(relayInfo.UsingGroup),
		RequestPath: requestPath,
		ClientIP:    strings.TrimSpace(c.ClientIP()),
		StartedAt:   now,
		IsStream:    relayInfo.IsStream,
		Attempt:     attempt,
	}

	globalSystemMonitor.mu.Lock()
	defer globalSystemMonitor.mu.Unlock()

	globalSystemMonitor.cleanupLocked(now)
	globalSystemMonitor.activeRequests[monitorID] = record
	c.Set(systemMonitorContextRequestID, monitorID)

	return monitorID
}

func UpdateRelayMonitorUsageByContext(c *gin.Context, promptTokens int, completionTokens int, totalTokens int, quota int) {
	if c == nil {
		return
	}
	monitorID := c.GetString(systemMonitorContextRequestID)
	if monitorID == "" {
		return
	}
	UpdateRelayMonitorUsage(monitorID, promptTokens, completionTokens, totalTokens, quota)
}

func UpdateRelayMonitorUsage(monitorID string, promptTokens int, completionTokens int, totalTokens int, quota int) {
	if monitorID == "" || !IsSystemRealtimeMonitoringEnabled() {
		return
	}

	globalSystemMonitor.mu.Lock()
	defer globalSystemMonitor.mu.Unlock()

	record, ok := globalSystemMonitor.activeRequests[monitorID]
	if !ok {
		return
	}

	record.PromptTokens = maxInt(promptTokens, 0)
	record.CompletionTokens = maxInt(completionTokens, 0)
	record.TotalTokens = maxInt(totalTokens, 0)
	record.Quota = quota
}

func FinishRelayMonitorRequest(monitorID string, success bool) {
	if monitorID == "" || !IsSystemRealtimeMonitoringEnabled() {
		return
	}

	now := time.Now()

	globalSystemMonitor.mu.Lock()
	defer globalSystemMonitor.mu.Unlock()

	record, ok := globalSystemMonitor.activeRequests[monitorID]
	if !ok {
		return
	}
	delete(globalSystemMonitor.activeRequests, monitorID)

	globalSystemMonitor.cleanupLocked(now)

	bucketAt := now.Unix() - (now.Unix() % int64(systemMonitorBucketSize/time.Second))
	channelBuckets, ok := globalSystemMonitor.buckets[bucketAt]
	if !ok {
		channelBuckets = make(map[int]*systemMonitorBucketChannel)
		globalSystemMonitor.buckets[bucketAt] = channelBuckets
	}

	channelBucket, ok := channelBuckets[record.ChannelID]
	if !ok {
		channelBucket = &systemMonitorBucketChannel{
			ChannelID:   record.ChannelID,
			ChannelName: fallbackChannelName(record.ChannelID, record.ChannelName),
		}
		channelBuckets[record.ChannelID] = channelBucket
	} else if channelBucket.ChannelName == "" && record.ChannelName != "" {
		channelBucket.ChannelName = record.ChannelName
	}

	aggregate := &channelBucket.Aggregate
	aggregate.RequestCount++
	if success {
		aggregate.SuccessCount++
	} else {
		aggregate.ErrorCount++
	}
	aggregate.TotalLatencyMs += maxInt64(now.Sub(record.StartedAt).Milliseconds(), 0)
	aggregate.PromptTokens += int64(maxInt(record.PromptTokens, 0))
	aggregate.CompletionTokens += int64(maxInt(record.CompletionTokens, 0))
	aggregate.TotalTokens += int64(maxInt(record.TotalTokens, 0))
	aggregate.Quota += int64(record.Quota)
}

func BuildSystemRealtimeSnapshot(windowSeconds int) *SystemRealtimeSnapshot {
	if !IsSystemRealtimeMonitoringEnabled() {
		return &SystemRealtimeSnapshot{
			GeneratedAt:   time.Now().Unix(),
			WindowSeconds: windowSeconds,
			Presence: SystemRealtimePresenceSnapshot{
				OnlineCount:       0,
				StaleAfterSeconds: int(systemMonitorPresenceTTL / time.Second),
				Users:             []SystemRealtimePresenceUser{},
			},
			Summary: SystemRealtimeSummary{},
			ActiveRequests: []SystemRealtimeActiveRequest{},
			Channels:       []SystemRealtimeChannelSnapshot{},
		}
	}

	if windowSeconds <= 0 {
		windowSeconds = systemMonitorDefaultWindowSec
	}

	now := time.Now()
	windowStart := now.Add(-time.Duration(windowSeconds) * time.Second)
	lastMinuteStart := now.Add(-time.Minute)
	bucketSizeSeconds := int64(systemMonitorBucketSize / time.Second)
	windowBucketStart := windowStart.Unix() - (windowStart.Unix() % bucketSizeSeconds)
	currentBucketStart := now.Unix() - (now.Unix() % bucketSizeSeconds)
	lastMinuteBucketStart := lastMinuteStart.Unix() - (lastMinuteStart.Unix() % bucketSizeSeconds)

	globalSystemMonitor.mu.Lock()
	defer globalSystemMonitor.mu.Unlock()

	globalSystemMonitor.cleanupLocked(now)

	presenceUsers := make([]SystemRealtimePresenceUser, 0, len(globalSystemMonitor.presence))
	for _, record := range globalSystemMonitor.presence {
		presenceUsers = append(presenceUsers, SystemRealtimePresenceUser{
			UserID:      record.UserID,
			Username:    record.Username,
			Role:        record.Role,
			RoleName:    roleName(record.Role),
			Group:       record.Group,
			CurrentPath: record.CurrentPath,
			ClientIP:    record.ClientIP,
			LastSeenAt:  record.LastSeenAt.Unix(),
		})
	}
	sort.Slice(presenceUsers, func(i, j int) bool {
		if presenceUsers[i].LastSeenAt == presenceUsers[j].LastSeenAt {
			return presenceUsers[i].UserID < presenceUsers[j].UserID
		}
		return presenceUsers[i].LastSeenAt > presenceUsers[j].LastSeenAt
	})

	activeRequests := make([]SystemRealtimeActiveRequest, 0, len(globalSystemMonitor.activeRequests))
	channelStates := make(map[int]*systemMonitorChannelState)
	for _, record := range globalSystemMonitor.activeRequests {
		channelState := ensureSystemMonitorChannelState(channelStates, record.ChannelID, record.ChannelName)
		channelState.ActiveRequests++

		activeRequests = append(activeRequests, SystemRealtimeActiveRequest{
			MonitorID:        record.MonitorID,
			RequestID:        record.RequestID,
			UserID:           record.UserID,
			Username:         record.Username,
			TokenID:          record.TokenID,
			ChannelID:        record.ChannelID,
			ChannelName:      fallbackChannelName(record.ChannelID, record.ChannelName),
			ModelName:        record.ModelName,
			Group:            record.Group,
			RequestPath:      record.RequestPath,
			ClientIP:         record.ClientIP,
			StartedAt:        record.StartedAt.Unix(),
			DurationSeconds:  maxInt64(int64(now.Sub(record.StartedAt)/time.Second), 0),
			IsStream:         record.IsStream,
			Attempt:          record.Attempt,
			PromptTokens:     record.PromptTokens,
			CompletionTokens: record.CompletionTokens,
			TotalTokens:      record.TotalTokens,
			Quota:            record.Quota,
		})
	}
	sort.Slice(activeRequests, func(i, j int) bool {
		if activeRequests[i].DurationSeconds == activeRequests[j].DurationSeconds {
			return activeRequests[i].StartedAt < activeRequests[j].StartedAt
		}
		return activeRequests[i].DurationSeconds > activeRequests[j].DurationSeconds
	})

	var recentAggregate systemMonitorAggregate
	var lastMinuteAggregate systemMonitorAggregate

	for bucketAt := windowBucketStart; bucketAt <= currentBucketStart; bucketAt += bucketSizeSeconds {
		channelBuckets := globalSystemMonitor.buckets[bucketAt]
		if len(channelBuckets) == 0 {
			continue
		}
		for channelID, bucket := range channelBuckets {
			channelState := ensureSystemMonitorChannelState(channelStates, channelID, bucket.ChannelName)
			channelState.RecentAggregate = mergeSystemMonitorAggregate(channelState.RecentAggregate, bucket.Aggregate)
			channelState.Points[bucketAt] = systemMonitorPointFromAggregate(bucketAt, bucket.Aggregate)
			recentAggregate = mergeSystemMonitorAggregate(recentAggregate, bucket.Aggregate)

			if bucketAt >= lastMinuteBucketStart {
				channelState.LastMinute = mergeSystemMonitorAggregate(channelState.LastMinute, bucket.Aggregate)
				lastMinuteAggregate = mergeSystemMonitorAggregate(lastMinuteAggregate, bucket.Aggregate)
			}
		}
	}

	channels := make([]SystemRealtimeChannelSnapshot, 0, len(channelStates))
	for _, channelState := range channelStates {
		series := make([]SystemRealtimeChannelPoint, 0, int((currentBucketStart-windowBucketStart)/bucketSizeSeconds)+1)
		for bucketAt := windowBucketStart; bucketAt <= currentBucketStart; bucketAt += bucketSizeSeconds {
			point, ok := channelState.Points[bucketAt]
			if !ok {
				point = SystemRealtimeChannelPoint{BucketAt: bucketAt}
			}
			series = append(series, point)
		}

		channels = append(channels, SystemRealtimeChannelSnapshot{
			ChannelID:          channelState.ChannelID,
			ChannelName:        fallbackChannelName(channelState.ChannelID, channelState.ChannelName),
			ActiveRequests:     channelState.ActiveRequests,
			RecentRequestCount: int(channelState.RecentAggregate.RequestCount),
			SuccessCount:       int(channelState.RecentAggregate.SuccessCount),
			ErrorCount:         int(channelState.RecentAggregate.ErrorCount),
			SuccessRate:        calculateSystemMonitorRate(channelState.RecentAggregate.SuccessCount, channelState.RecentAggregate.RequestCount),
			AvgLatencyMs:       calculateSystemMonitorAverage(channelState.RecentAggregate.TotalLatencyMs, channelState.RecentAggregate.RequestCount),
			PromptTokens:       int(channelState.RecentAggregate.PromptTokens),
			CompletionTokens:   int(channelState.RecentAggregate.CompletionTokens),
			TotalTokens:        int(channelState.RecentAggregate.TotalTokens),
			Quota:              int(channelState.RecentAggregate.Quota),
			RPM1m:              float64(channelState.LastMinute.RequestCount),
			TPM1m:              float64(channelState.LastMinute.TotalTokens),
			Series:             series,
		})
	}

	sort.Slice(channels, func(i, j int) bool {
		left := channels[i]
		right := channels[j]
		if left.ActiveRequests != right.ActiveRequests {
			return left.ActiveRequests > right.ActiveRequests
		}
		if left.RecentRequestCount != right.RecentRequestCount {
			return left.RecentRequestCount > right.RecentRequestCount
		}
		if left.TotalTokens != right.TotalTokens {
			return left.TotalTokens > right.TotalTokens
		}
		return left.ChannelName < right.ChannelName
	})

	return &SystemRealtimeSnapshot{
		GeneratedAt:   now.Unix(),
		WindowSeconds: windowSeconds,
		Presence: SystemRealtimePresenceSnapshot{
			OnlineCount:       len(presenceUsers),
			StaleAfterSeconds: int(systemMonitorPresenceTTL / time.Second),
			Users:             presenceUsers,
		},
		Summary: SystemRealtimeSummary{
			OnlineUsers:        len(presenceUsers),
			ActiveRequests:     len(activeRequests),
			RecentRequestCount: int(recentAggregate.RequestCount),
			SuccessCount:       int(recentAggregate.SuccessCount),
			ErrorCount:         int(recentAggregate.ErrorCount),
			SuccessRate:        calculateSystemMonitorRate(recentAggregate.SuccessCount, recentAggregate.RequestCount),
			AvgLatencyMs:       calculateSystemMonitorAverage(recentAggregate.TotalLatencyMs, recentAggregate.RequestCount),
			PromptTokens:       int(recentAggregate.PromptTokens),
			CompletionTokens:   int(recentAggregate.CompletionTokens),
			TotalTokens:        int(recentAggregate.TotalTokens),
			Quota:              int(recentAggregate.Quota),
			RPM1m:              float64(lastMinuteAggregate.RequestCount),
			TPM1m:              float64(lastMinuteAggregate.TotalTokens),
		},
		ActiveRequests: activeRequests,
		Channels:       channels,
	}
}

func (m *systemMonitorState) cleanupLocked(now time.Time) {
	presenceCutoff := now.Add(-systemMonitorPresenceTTL)
	for userID, record := range m.presence {
		if record == nil || record.LastSeenAt.Before(presenceCutoff) {
			delete(m.presence, userID)
		}
	}

	retentionCutoff := now.Add(-systemMonitorRetention).Unix()
	for bucketAt := range m.buckets {
		if bucketAt < retentionCutoff {
			delete(m.buckets, bucketAt)
		}
	}
}

func ensureSystemMonitorChannelState(states map[int]*systemMonitorChannelState, channelID int, channelName string) *systemMonitorChannelState {
	state, ok := states[channelID]
	if ok {
		if state.ChannelName == "" && channelName != "" {
			state.ChannelName = channelName
		}
		return state
	}

	state = &systemMonitorChannelState{
		ChannelID:   channelID,
		ChannelName: channelName,
		Points:      make(map[int64]SystemRealtimeChannelPoint),
	}
	states[channelID] = state
	return state
}

func mergeSystemMonitorAggregate(left systemMonitorAggregate, right systemMonitorAggregate) systemMonitorAggregate {
	left.RequestCount += right.RequestCount
	left.SuccessCount += right.SuccessCount
	left.ErrorCount += right.ErrorCount
	left.TotalLatencyMs += right.TotalLatencyMs
	left.PromptTokens += right.PromptTokens
	left.CompletionTokens += right.CompletionTokens
	left.TotalTokens += right.TotalTokens
	left.Quota += right.Quota
	return left
}

func systemMonitorPointFromAggregate(bucketAt int64, aggregate systemMonitorAggregate) SystemRealtimeChannelPoint {
	return SystemRealtimeChannelPoint{
		BucketAt:         bucketAt,
		RequestCount:     int(aggregate.RequestCount),
		SuccessCount:     int(aggregate.SuccessCount),
		ErrorCount:       int(aggregate.ErrorCount),
		AvgLatencyMs:     calculateSystemMonitorAverage(aggregate.TotalLatencyMs, aggregate.RequestCount),
		PromptTokens:     int(aggregate.PromptTokens),
		CompletionTokens: int(aggregate.CompletionTokens),
		TotalTokens:      int(aggregate.TotalTokens),
		Quota:            int(aggregate.Quota),
	}
}

func calculateSystemMonitorRate(success int64, total int64) float64 {
	if total <= 0 {
		return 0
	}
	return float64(success) * 100 / float64(total)
}

func calculateSystemMonitorAverage(total int64, count int64) float64 {
	if count <= 0 {
		return 0
	}
	return float64(total) / float64(count)
}

func fallbackUsername(userID int, username string) string {
	username = strings.TrimSpace(username)
	if username != "" {
		return username
	}
	if userID > 0 {
		return fmt.Sprintf("user-%d", userID)
	}
	return "unknown"
}

func fallbackChannelName(channelID int, channelName string) string {
	channelName = strings.TrimSpace(channelName)
	if channelName != "" {
		return channelName
	}
	if channelID > 0 {
		return fmt.Sprintf("Channel #%d", channelID)
	}
	return "Unknown channel"
}

func roleName(role int) string {
	switch role {
	case common.RoleRootUser:
		return "root"
	case common.RoleAdminUser:
		return "admin"
	case common.RoleCommonUser:
		return "user"
	default:
		return "guest"
	}
}

func maxInt(value int, min int) int {
	if value < min {
		return min
	}
	return value
}

func maxInt64(value int64, min int64) int64 {
	if value < min {
		return min
	}
	return value
}
