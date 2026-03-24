package web

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"sync"
)

type contextKey string

const (
	requestIDKey contextKey = "request_id"
	userIDKey    contextKey = "user_id"
	usernameKey  contextKey = "username"
	roleKey      contextKey = "role"
)

// cookieName is the port-specific cookie name used for auth tokens.
// This prevents cross-instance cookie collision when multiple ClawDeckX
// instances run on the same host with different ports.
var (
	cookieName     string = "claw_token"
	cookieNameOnce sync.Once
)

// InitCookieName sets the auth cookie name based on the server port.
// Must be called once during startup before any auth middleware runs.
func InitCookieName(port int) {
	cookieNameOnce.Do(func() {
		cookieName = fmt.Sprintf("claw_token_%d", port)
	})
}

// CookieName returns the current auth cookie name.
func CookieName() string {
	return cookieName
}

func SetRequestID(r *http.Request, id string) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), requestIDKey, id))
}

func GetRequestID(r *http.Request) string {
	if v, ok := r.Context().Value(requestIDKey).(string); ok {
		return v
	}
	return ""
}

func SetUserInfo(r *http.Request, userID uint, username, role string) *http.Request {
	ctx := r.Context()
	ctx = context.WithValue(ctx, userIDKey, userID)
	ctx = context.WithValue(ctx, usernameKey, username)
	ctx = context.WithValue(ctx, roleKey, role)
	return r.WithContext(ctx)
}

func GetUserID(r *http.Request) uint {
	if v, ok := r.Context().Value(userIDKey).(uint); ok {
		return v
	}
	return 0
}

func GetUsername(r *http.Request) string {
	if v, ok := r.Context().Value(usernameKey).(string); ok {
		return v
	}
	return ""
}

func GetRole(r *http.Request) string {
	if v, ok := r.Context().Value(roleKey).(string); ok {
		return v
	}
	return ""
}

func GenerateRequestID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return "req_" + hex.EncodeToString(b)
}
