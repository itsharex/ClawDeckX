package openclaw

import (
	"ClawDeckX/internal/executil"
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

var (
	discoveryMu    sync.RWMutex
	discoveredPath string
	discoveryDone  bool
)

func InvalidateDiscoveryCache() {
	discoveryMu.Lock()
	discoveredPath = ""
	discoveryDone = false
	discoveryMu.Unlock()
}

func discoverOpenClawBinary() string {
	if p, err := exec.LookPath("openclaw"); err == nil {
		return p
	}
	if p := probeNpmGlobalBin("openclaw"); p != "" {
		return p
	}
	for _, c := range getOpenClawPaths() {
		if c != "" {
			if fi, err := os.Stat(c); err == nil && !fi.IsDir() {
				if verifyBinary(c) {
					return c
				}
			}
		}
	}
	if runtime.GOOS != "windows" {
		if p := shellWhichOpenClaw(); p != "" {
			return p
		}
	}
	return ""
}

func verifyBinary(path string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, path, "--version")
	executil.HideWindow(cmd)
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	v := strings.TrimSpace(string(out))
	return v != "" && v[0] >= '0' && v[0] <= '9'
}

func probeNpmGlobalBin(name string) string {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "npm", "prefix", "-g")
	executil.HideWindow(cmd)
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	prefix := strings.TrimSpace(string(out))
	if prefix == "" {
		return ""
	}
	if runtime.GOOS == "windows" {
		for _, ext := range []string{".cmd", ""} {
			c := filepath.Join(prefix, name+ext)
			if _, e := os.Stat(c); e == nil {
				return c
			}
		}
	} else {
		c := filepath.Join(prefix, "bin", name)
		if _, e := os.Stat(c); e == nil {
			return c
		}
	}
	return ""
}

func shellWhichOpenClaw() string {
	for _, s := range []string{
		"source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null; which openclaw 2>/dev/null",
		"source ~/.bash_profile 2>/dev/null; which openclaw 2>/dev/null",
	} {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		cmd := exec.CommandContext(ctx, "sh", "-c", s)
		executil.HideWindow(cmd)
		out, err := cmd.Output()
		cancel()
		if err == nil {
			p := strings.TrimSpace(string(out))
			if p != "" && !strings.Contains(p, "not found") && verifyBinary(p) {
				return p
			}
		}
	}
	return ""
}
