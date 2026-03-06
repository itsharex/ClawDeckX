package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func IsInstalled() bool {
	switch runtime.GOOS {
	case "linux":
		return fileExists("/etc/systemd/system/clawdeckx.service") ||
			fileExists(filepath.Join(os.Getenv("HOME"), ".config/systemd/user/clawdeckx.service"))
	case "darwin":
		return fileExists(filepath.Join(os.Getenv("HOME"), "Library/LaunchAgents/ai.clawdeckx.plist"))
	case "windows":
		out, _ := exec.Command("sc", "query", "ClawDeckX").Output()
		return len(out) > 0
	}
	return false
}

func Install(port int) error {
	switch runtime.GOOS {
	case "linux":
		return installLinux(port)
	case "darwin":
		return installDarwin(port)
	case "windows":
		return installWindows(port)
	}
	return fmt.Errorf("unsupported OS: %s", runtime.GOOS)
}

func Uninstall() error {
	switch runtime.GOOS {
	case "linux":
		return uninstallLinux()
	case "darwin":
		return uninstallDarwin()
	case "windows":
		return uninstallWindows()
	}
	return fmt.Errorf("unsupported OS: %s", runtime.GOOS)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func installLinux(port int) error {
	exe, _ := os.Executable()
	absExe, _ := filepath.Abs(exe)

	unit := fmt.Sprintf(`[Unit]
Description=ClawDeckX Web Service
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=%s --port %d
Restart=always
RestartSec=5
WorkingDirectory=%s

[Install]
WantedBy=default.target
`, absExe, port, filepath.Dir(absExe))

	// Try user service first
	userPath := filepath.Join(os.Getenv("HOME"), ".config/systemd/user/clawdeckx.service")
	if err := os.MkdirAll(filepath.Dir(userPath), 0755); err == nil {
		if err := os.WriteFile(userPath, []byte(unit), 0644); err == nil {
			exec.Command("systemctl", "--user", "daemon-reload").Run()
			exec.Command("systemctl", "--user", "enable", "clawdeckx").Run()
			return nil
		}
	}

	// Fallback to system service
	tmpFile := "/tmp/clawdeckx.service"
	os.WriteFile(tmpFile, []byte(unit), 0644)
	exec.Command("sudo", "mv", tmpFile, "/etc/systemd/system/clawdeckx.service").Run()
	exec.Command("sudo", "systemctl", "daemon-reload").Run()
	exec.Command("sudo", "systemctl", "enable", "clawdeckx").Run()
	return nil
}

func installDarwin(port int) error {
	exe, _ := os.Executable()
	absExe, _ := filepath.Abs(exe)

	plist := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>ai.clawdeckx</string>
	<key>ProgramArguments</key>
	<array>
		<string>%s</string>
		<string>--port</string>
		<string>%d</string>
	</array>
	<key>RunAtLoad</key>
	<true/>
	<key>KeepAlive</key>
	<true/>
	<key>WorkingDirectory</key>
	<string>%s</string>
</dict>
</plist>`, absExe, port, filepath.Dir(absExe))

	plistPath := filepath.Join(os.Getenv("HOME"), "Library/LaunchAgents/ai.clawdeckx.plist")
	if err := os.MkdirAll(filepath.Dir(plistPath), 0755); err != nil {
		return err
	}
	if err := os.WriteFile(plistPath, []byte(plist), 0644); err != nil {
		return err
	}
	exec.Command("launchctl", "load", plistPath).Run()
	return nil
}

func installWindows(port int) error {
	return nil // Windows support later
}

func uninstallLinux() error {
	// Try user service
	userPath := filepath.Join(os.Getenv("HOME"), ".config/systemd/user/clawdeckx.service")
	if fileExists(userPath) {
		exec.Command("systemctl", "--user", "stop", "clawdeckx").Run()
		exec.Command("systemctl", "--user", "disable", "clawdeckx").Run()
		os.Remove(userPath)
		exec.Command("systemctl", "--user", "daemon-reload").Run()
	}

	// Try system service
	systemPath := "/etc/systemd/system/clawdeckx.service"
	if fileExists(systemPath) {
		exec.Command("sudo", "systemctl", "stop", "clawdeckx").Run()
		exec.Command("sudo", "systemctl", "disable", "clawdeckx").Run()
		exec.Command("sudo", "rm", "-f", systemPath).Run()
		exec.Command("sudo", "systemctl", "daemon-reload").Run()
	}
	return nil
}

func uninstallDarwin() error {
	plistPath := filepath.Join(os.Getenv("HOME"), "Library/LaunchAgents/ai.clawdeckx.plist")
	if fileExists(plistPath) {
		exec.Command("launchctl", "unload", plistPath).Run()
		os.Remove(plistPath)
	}
	return nil
}

func uninstallWindows() error {
	return nil // Windows support later
}
