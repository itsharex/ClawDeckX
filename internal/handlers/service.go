package handlers

import (
	"net/http"

	"ClawDeckX/internal/constants"
	"ClawDeckX/internal/database"
	"ClawDeckX/internal/logger"
	"ClawDeckX/internal/openclaw"
	"ClawDeckX/internal/service"
	"ClawDeckX/internal/web"
)

type ServiceHandler struct {
	auditRepo *database.AuditLogRepo
}

func NewServiceHandler(auditRepo *database.AuditLogRepo) *ServiceHandler {
	return &ServiceHandler{auditRepo: auditRepo}
}

func (h *ServiceHandler) writeAudit(r *http.Request, action, result, detail string) {
	h.auditRepo.Create(&database.AuditLog{
		UserID:   web.GetUserID(r),
		Username: web.GetUsername(r),
		Action:   action,
		Result:   result,
		Detail:   detail,
		IP:       r.RemoteAddr,
	})
}

type serviceStatusResponse struct {
	OpenClawInstalled bool `json:"openclaw_installed"`
	ClawDeckXInstalled bool `json:"clawdeckx_installed"`
}

func (h *ServiceHandler) Status(w http.ResponseWriter, r *http.Request) {
	svc := openclaw.NewService()
	status := svc.DaemonStatus()

	web.OK(w, r, serviceStatusResponse{
		OpenClawInstalled: status.Installed,
		ClawDeckXInstalled: service.IsInstalled(),
	})
}

func (h *ServiceHandler) InstallOpenClaw(w http.ResponseWriter, r *http.Request) {
	svc := openclaw.NewService()
	if err := svc.DaemonInstall(); err != nil {
		web.Fail(w, r, "INSTALL_FAILED", err.Error(), http.StatusInternalServerError)
		return
	}
	web.OK(w, r, map[string]string{"message": "OpenClaw service installed"})
}

func (h *ServiceHandler) UninstallOpenClaw(w http.ResponseWriter, r *http.Request) {
	svc := openclaw.NewService()
	if err := svc.DaemonUninstall(); err != nil {
		web.Fail(w, r, "UNINSTALL_FAILED", err.Error(), http.StatusInternalServerError)
		return
	}
	web.OK(w, r, map[string]string{"message": "OpenClaw service uninstalled"})
}

func (h *ServiceHandler) InstallClawDeckX(w http.ResponseWriter, r *http.Request) {
	logger.Log.Info().
		Str("user", web.GetUsername(r)).
		Str("ip", r.RemoteAddr).
		Msg("user requested ClawDeckX service install")

	if err := service.Install(18791); err != nil {
		h.writeAudit(r, constants.ActionServiceInstall, "failed", "ClawDeckX install: "+err.Error())
		logger.Log.Error().Err(err).Msg("ClawDeckX service install failed")
		web.Fail(w, r, "INSTALL_FAILED", err.Error(), http.StatusInternalServerError)
		return
	}

	h.writeAudit(r, constants.ActionServiceInstall, "success", "ClawDeckX service installed")
	logger.Log.Info().Msg("ClawDeckX service installed")
	web.OK(w, r, map[string]bool{"installed": service.IsInstalled()})
}

func (h *ServiceHandler) UninstallClawDeckX(w http.ResponseWriter, r *http.Request) {
	logger.Log.Info().
		Str("user", web.GetUsername(r)).
		Str("ip", r.RemoteAddr).
		Msg("user requested ClawDeckX service uninstall")

	if err := service.Uninstall(); err != nil {
		h.writeAudit(r, constants.ActionServiceUninstall, "failed", "ClawDeckX uninstall: "+err.Error())
		logger.Log.Error().Err(err).Msg("ClawDeckX service uninstall failed")
		web.Fail(w, r, "UNINSTALL_FAILED", err.Error(), http.StatusInternalServerError)
		return
	}

	h.writeAudit(r, constants.ActionServiceUninstall, "success", "ClawDeckX service uninstalled")
	logger.Log.Info().Msg("ClawDeckX service uninstalled")
	web.OK(w, r, map[string]bool{"installed": service.IsInstalled()})
}
