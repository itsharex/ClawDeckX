package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"ClawDeckX/internal/web"
)

// SkillFileHandler handles reading and writing SKILL.md files for locally installed skills.
type SkillFileHandler struct{}

func NewSkillFileHandler() *SkillFileHandler {
	return &SkillFileHandler{}
}

// allowedSkillsRoots returns the canonical paths of allowed skill directories.
// Note: clawhub CLI ignores --dir parameter and always installs to ~/.openclaw/workspace,
// so we must allow workspace directory for SKILL.md editing.
// ~/.openclaw/skills is kept for legacy compatibility.
func allowedSkillsRoots() ([]string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	return []string{
		filepath.Clean(filepath.Join(home, ".openclaw", "workspace")),
		filepath.Clean(filepath.Join(home, ".openclaw", "skills")),
	}, nil
}

// validateSkillFilePath checks that the requested path:
//  1. Is an absolute path.
//  2. Resolves within ~/.openclaw/workspace/ or ~/.openclaw/skills/.
//  3. Has exactly the filename "SKILL.md" (case-insensitive on Windows, exact on Unix).
func validateSkillFilePath(rawPath string) (string, error) {
	cleaned := filepath.Clean(rawPath)

	roots, err := allowedSkillsRoots()
	if err != nil {
		return "", err
	}

	// Find which root this path belongs to
	var matchedRoot string
	for _, root := range roots {
		if strings.HasPrefix(cleaned, root+string(os.PathSeparator)) || cleaned == root {
			matchedRoot = root
			break
		}
	}
	if matchedRoot == "" {
		return "", os.ErrPermission
	}

	// Must be exactly one level deep (skillDir/SKILL.md)
	rel, err := filepath.Rel(matchedRoot, cleaned)
	if err != nil {
		return "", os.ErrPermission
	}
	parts := strings.Split(rel, string(os.PathSeparator))
	if len(parts) != 2 {
		return "", os.ErrPermission
	}
	if !strings.EqualFold(parts[1], "SKILL.md") {
		return "", os.ErrPermission
	}

	return cleaned, nil
}

// ReadSkillMd reads the SKILL.md content for a given skill baseDir.
// GET /api/v1/skills/file?baseDir=<path>
func (h *SkillFileHandler) ReadSkillMd(w http.ResponseWriter, r *http.Request) {
	baseDir := r.URL.Query().Get("baseDir")
	if baseDir == "" {
		web.FailErr(w, r, web.ErrInvalidParam)
		return
	}

	filePath := filepath.Join(baseDir, "SKILL.md")
	validPath, err := validateSkillFilePath(filePath)
	if err != nil {
		web.FailErr(w, r, web.ErrForbidden)
		return
	}

	data, err := os.ReadFile(validPath)
	if err != nil {
		if os.IsNotExist(err) {
			web.OK(w, r, map[string]interface{}{
				"content": "",
				"exists":  false,
				"path":    validPath,
			})
			return
		}
		web.FailErr(w, r, web.ErrConfigReadFailed, err.Error())
		return
	}

	web.OK(w, r, map[string]interface{}{
		"content": string(data),
		"exists":  true,
		"path":    validPath,
	})
}

// WriteSkillMd writes updated SKILL.md content for a given skill baseDir.
// PUT /api/v1/skills/file
func (h *SkillFileHandler) WriteSkillMd(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BaseDir string `json:"baseDir"`
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		web.FailErr(w, r, web.ErrInvalidBody)
		return
	}
	if req.BaseDir == "" {
		web.FailErr(w, r, web.ErrInvalidParam)
		return
	}

	filePath := filepath.Join(req.BaseDir, "SKILL.md")
	validPath, err := validateSkillFilePath(filePath)
	if err != nil {
		web.FailErr(w, r, web.ErrForbidden)
		return
	}

	if err := os.WriteFile(validPath, []byte(req.Content), 0o644); err != nil {
		web.FailErr(w, r, web.ErrConfigWriteFailed, err.Error())
		return
	}

	web.OK(w, r, map[string]interface{}{
		"saved": true,
		"path":  validPath,
	})
}
