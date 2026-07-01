package controller

import (
	"errors"
	"io"
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

type systemPresenceHeartbeatRequest struct {
	Path string `json:"path"`
}

func HeartbeatSystemPresence(c *gin.Context) {
	if !service.IsSystemRealtimeMonitoringEnabled() {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "system realtime monitoring disabled",
		})
		return
	}

	var req systemPresenceHeartbeatRequest
	if err := c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
		common.ApiError(c, err)
		return
	}

	service.RecordSystemPresence(
		common.GetContextKeyInt(c, constant.ContextKeyUserId),
		common.GetContextKeyString(c, constant.ContextKeyUserName),
		c.GetInt("role"),
		common.GetContextKeyString(c, constant.ContextKeyUserGroup),
		req.Path,
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func GetSystemRealtime(c *gin.Context) {
	windowSeconds := common.String2Int(c.Query("window_seconds"))
	snapshot := service.BuildSystemRealtimeSnapshot(windowSeconds)
	snapshot.Summary.ActiveHTTPConnections = middleware.GetStats().ActiveConnections

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    snapshot,
	})
}
