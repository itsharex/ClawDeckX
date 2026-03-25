package openclaw

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

func getOpenClawPaths() []string {
	home, _ := os.UserHomeDir()
	switch runtime.GOOS {
	case "darwin":
		return darwinPaths(home)
	case "linux":
		return linuxPaths(home)
	case "windows":
		return winPaths(home)
	}
	return nil
}

func darwinPaths(home string) []string {
	p := []string{
		"/opt/homebrew/bin/openclaw",
		"/usr/local/bin/openclaw",
		"/usr/bin/openclaw",
	}
	if home == "" {
		return p
	}
	p = append(p, nvmBinPaths(home, "openclaw")...)
	return append(p, unixHomePaths(home, "openclaw")...)
}

func linuxPaths(home string) []string {
	p := []string{
		"/usr/local/bin/openclaw",
		"/usr/bin/openclaw",
		"/usr/lib/node_modules/openclaw/bin/openclaw",
		"/usr/local/lib/node_modules/openclaw/bin/openclaw",
	}
	if home == "" {
		return p
	}
	p = append(p, nvmBinPaths(home, "openclaw")...)
	return append(p, unixHomePaths(home, "openclaw")...)
}

func unixHomePaths(home, name string) []string {
	return []string{
		filepath.Join(home, ".fnm", "aliases", "default", "bin", name),
		filepath.Join(home, ".volta", "bin", name),
		filepath.Join(home, ".asdf", "shims", name),
		filepath.Join(home, ".local", "share", "mise", "shims", name),
		filepath.Join(home, ".local", "share", "pnpm", name),
		filepath.Join(home, "Library", "pnpm", name),
		filepath.Join(home, ".yarn", "bin", name),
		filepath.Join(home, ".bun", "bin", name),
		filepath.Join(home, ".npm-global", "bin", name),
		filepath.Join(home, ".npm-packages", "bin", name),
	}
}

func winPaths(home string) []string {
	ad := os.Getenv("APPDATA")
	lad := os.Getenv("LOCALAPPDATA")
	pf := os.Getenv("ProgramFiles")
	if pf == "" {
		pf = `C:\Program Files`
	}
	var p []string
	if ad != "" {
		p = append(p,
			filepath.Join(ad, "npm", "openclaw.cmd"),
			filepath.Join(ad, "npm", "openclaw"),
		)
	}
	if home != "" {
		p = append(p,
			filepath.Join(home, "AppData", "Roaming", "npm", "openclaw.cmd"),
		)
	}
	p = append(p, filepath.Join(pf, "nodejs", "openclaw.cmd"))
	if home == "" {
		p = append(p, `C:\ProgramData\chocolatey\bin\openclaw.cmd`)
		return p
	}
	if ns := os.Getenv("NVM_SYMLINK"); ns != "" {
		p = append(p, filepath.Join(ns, "openclaw.cmd"))
	}
	if nh := os.Getenv("NVM_HOME"); nh != "" {
		p = append(p, nvmWinPaths(nh, "openclaw")...)
	}
	p = append(p,
		filepath.Join(home, "AppData", "Roaming", "fnm", "aliases", "default", "openclaw.cmd"),
		filepath.Join(home, "AppData", "Local", "fnm", "aliases", "default", "openclaw.cmd"),
		filepath.Join(home, ".fnm", "aliases", "default", "openclaw.cmd"),
	)
	if lad != "" {
		p = append(p,
			filepath.Join(lad, "Volta", "bin", "openclaw.exe"),
			filepath.Join(lad, "pnpm", "openclaw.cmd"),
			filepath.Join(lad, "Yarn", "bin", "openclaw.cmd"),
		)
	}
	p = append(p,
		filepath.Join(home, "scoop", "shims", "openclaw.cmd"),
		filepath.Join(home, ".bun", "bin", "openclaw.exe"),
		`C:\ProgramData\chocolatey\bin\openclaw.cmd`,
	)
	return p
}

func nvmBinPaths(home, name string) []string {
	var paths []string
	nvmDir := filepath.Join(home, ".nvm")
	af := filepath.Join(nvmDir, "alias", "default")
	if data, err := os.ReadFile(af); err == nil {
		v := strings.TrimSpace(string(data))
		if v != "" {
			paths = append(paths, filepath.Join(nvmDir, "versions", "node", "v"+v, "bin", name))
		}
	}
	vd := filepath.Join(nvmDir, "versions", "node")
	if entries, err := os.ReadDir(vd); err == nil {
		for _, e := range entries {
			if e.IsDir() && strings.HasPrefix(e.Name(), "v") {
				paths = append(paths, filepath.Join(vd, e.Name(), "bin", name))
			}
		}
	}
	return paths
}

func nvmWinPaths(nvmHome, name string) []string {
	var paths []string
	sp := filepath.Join(nvmHome, "settings.txt")
	if data, err := os.ReadFile(sp); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "current:") {
				v := strings.TrimSpace(strings.TrimPrefix(line, "current:"))
				if v != "" {
					paths = append(paths, filepath.Join(nvmHome, "v"+v, name+".cmd"))
				}
			}
		}
	}
	if entries, err := os.ReadDir(nvmHome); err == nil {
		for _, e := range entries {
			if e.IsDir() && strings.HasPrefix(e.Name(), "v") {
				paths = append(paths, filepath.Join(nvmHome, e.Name(), name+".cmd"))
			}
		}
	}
	return paths
}
