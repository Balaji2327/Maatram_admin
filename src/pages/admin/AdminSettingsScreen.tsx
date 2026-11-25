"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  EnvelopeIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  QrCodeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { adminApi, getAdminToken, getStoredAdminUser } from "../../lib/api";
import AdminSidebar from "../../components/AdminSidebar";
import SignOutModal from "../../components/SignOutModal";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "reviewer";
  twoFactorEnabled: boolean;
  createdAt: string;
}

export default function AdminSettingsScreen() {
  const router = useRouter();

  // Auth Guard
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

  // Sign out modal state
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Client mount state to guarantee zero hydration mismatch between SSR & client
  const [isMounted, setIsMounted] = useState(false);

  // Admin account info
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState("admin");
  const [twoFactorSecret, setTwoFactorSecret] = useState("MAAT-RAM2-5SEC-UR99");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Administrators list state
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Form states for "Add New Admin"
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"super_admin" | "admin" | "reviewer">("admin");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState("");
  const [adminErrorMsg, setAdminErrorMsg] = useState("");

  // 2FA portal toggle & setup states
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFaSuccessMsg, setTwoFaSuccessMsg] = useState("");
  const [twoFaErrorMsg, setTwoFaErrorMsg] = useState("");
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Load current admin profile & active administrators from backend API
  const fetchSettingsData = async () => {
    try {
      setIsLoadingAdmins(true);
      const profRes = await adminApi.getProfile();

      if (profRes.success && profRes.data) {
        const email = profRes.data.email || "";
        setAdminEmail(email);
        setAdminRole(profRes.data.role || "admin");
        setIs2FAEnabled(!!profRes.data.twoFactorEnabled);
        if (profRes.data.twoFactorSecret) {
          setTwoFactorSecret(profRes.data.twoFactorSecret);
        }
        if (profRes.data.qrCodeUrl) {
          setQrCodeUrl(profRes.data.qrCodeUrl);
        }

        // Only fetch administrators if the current user is a super admin
        if (profRes.data?.role === "super_admin" || email.toLowerCase() === "admin@maatram.com") {
          try {
            const adminsRes = await adminApi.getAdministrators();
            if (adminsRes.success && Array.isArray(adminsRes.data)) {
              const formatted: AdminUser[] = adminsRes.data.map((item: any) => ({
                id: item.id,
                name: item.name,
                email: item.email,
                role: item.role,
                twoFactorEnabled: !!item.two_factor_enabled || !!item.twoFactorEnabled,
                createdAt: item.created_at ? item.created_at.split("T")[0] : "Recent",
              }));
              setAdminList(formatted);
            }
          } catch (admErr) {
            console.error("Failed to load admin list:", admErr);
          }
        } else {
          setAdminList([]);
        }
      }
    } catch (err: any) {
      console.error("Failed to load settings data from database:", err);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredAdminUser();
    if (stored?.email) {
      setAdminEmail(stored.email);
    }
    if (stored?.role) {
      setAdminRole(stored.role);
    }
    fetchSettingsData();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg("");
    setAdminErrorMsg("");

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setAdminErrorMsg("Please fill in all required fields.");
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const res = await adminApi.addAdministrator({
        name: newAdminName.trim(),
        email: newAdminEmail.trim(),
        password: newAdminPassword.trim(),
        role: newAdminRole,
      });

      if (!res.success) {
        setAdminErrorMsg(res.message || "Failed to add administrator.");
        setIsSubmittingAdmin(false);
        return;
      }

      setAdminSuccessMsg(res.message || `New admin "${newAdminName}" has been successfully added.`);
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminRole("admin");

      // Refresh database administrator list
      await fetchSettingsData();
      setTimeout(() => setAdminSuccessMsg(""), 5000);
    } catch (err: any) {
      setAdminErrorMsg(err.message || "Server error adding administrator.");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleToggle2FA = async () => {
    setTwoFaSuccessMsg("");
    setTwoFaErrorMsg("");

    if (!is2FAEnabled) {
      if (!qrCodeUrl) {
        await fetchSettingsData();
      }
      setShowQrModal(true);
    } else {
      if (!confirm("Are you sure you want to disable Two-Factor Authentication?")) {
        return;
      }
      setIsToggling2FA(true);
      try {
        const res = await adminApi.toggle2FA({ enable: false });
        if (res.success) {
          setIs2FAEnabled(false);
          setTwoFaSuccessMsg("Two-Factor Authentication has been disabled for your portal account.");
          setTimeout(() => setTwoFaSuccessMsg(""), 4000);
        } else {
          setTwoFaErrorMsg(res.message || "Failed to disable 2FA.");
        }
      } catch (err: any) {
        setTwoFaErrorMsg(err.message || "Error disabling 2FA.");
      } finally {
        setIsToggling2FA(false);
      }
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim().length !== 6) {
      alert("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsToggling2FA(true);
    try {
      const res = await adminApi.toggle2FA({
        enable: true,
        verificationCode: verificationCode.trim(),
      });

      if (res.success) {
        setIs2FAEnabled(true);
        setShowQrModal(false);
        setVerificationCode("");
        setTwoFaSuccessMsg("Two-Factor Authentication is now active and protecting your portal.");
        setTimeout(() => setTwoFaSuccessMsg(""), 5000);
      } else {
        alert(res.message || "Verification failed. Please check the code.");
      }
    } catch (err: any) {
      alert(err.message || "Error enabling Two-Factor Authentication.");
    } finally {
      setIsToggling2FA(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPasswordError("Please enter both current and new passwords.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await adminApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (!res.success) {
        setPasswordError(res.message || "Failed to update password.");
        setIsSavingPassword(false);
        return;
      }

      setPasswordMsg(res.message || "Password updated successfully in database.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg("");
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || "Server error updating password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const trimmed = newEmailInput.trim();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (trimmed.toLowerCase() === adminEmail.toLowerCase()) {
      setEmailError("New email must be different from current email.");
      return;
    }

    setIsSavingEmail(true);
    try {
      const res = await adminApi.changeEmail({ newEmail: trimmed });
      if (!res.success) {
        setEmailError(res.message || "Failed to update email address.");
        setIsSavingEmail(false);
        return;
      }

      setAdminEmail(trimmed);
      setShowEmailModal(false);
      setNewEmailInput("");
      setEmailUpdateSuccess("Login email updated successfully in database.");
      await fetchSettingsData();
      setTimeout(() => setEmailUpdateSuccess(""), 4000);
    } catch (err: any) {
      setEmailError(err.message || "Server error updating email.");
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleRevokeAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to revoke administrator access for ${adminName}?`)) {
      return;
    }

    try {
      const res = await adminApi.deleteAdministrator(adminId);
      if (!res.success) {
        alert(res.message || "Failed to revoke administrator.");
        return;
      }

      setAdminList((prev) => prev.filter((a) => a.id !== adminId));
      setAdminSuccessMsg(`Administrator access for "${adminName}" has been revoked.`);
      setTimeout(() => setAdminSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.message || "Server error revoking administrator.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Yellow & White Sidebar */}
      <AdminSidebar
        activeTab="settings"
        onSignOutClick={() => setIsSignOutModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Account & Security Settings
              </h1>
              <p className="font-primary text-xs sm:text-sm text-black mt-1">
                Manage login credentials, authentication methods, recovery options, and account security.
              </p>
            </div>
          </div>

          {emailUpdateSuccess && (
            <div className="p-4 rounded-lg bg-brand/15 border border-brand/60 text-black text-xs font-semibold">
              {emailUpdateSuccess}
            </div>
          )}

          {/* 1. SECTION: LOGIN & ACCOUNT ACCESS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-black">
                Login & Account Access
              </h2>
              <p className="font-primary text-xs text-black/65 mt-1">
                Manage the credentials used to access your administrator portal.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-black/15 rounded-xl p-6 lg:p-7 space-y-5">
              {/* Login Email Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-black/15">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/65 mb-1">
                    LOGIN EMAIL
                  </p>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs sm:text-sm text-black">
                      {adminEmail}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmailInput(adminEmail);
                      setEmailError("");
                      setShowEmailModal(true);
                    }}
                    className="px-4 py-2 rounded-md text-xs font-heading font-bold text-black bg-white hover:bg-black/5 border border-black/15 hover:border-black/15 transition cursor-pointer"
                  >
                    Change login email
                  </button>
                </div>
              </div>

              {/* Change Password Row */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-white hover:bg-black/5 border border-black/15 hover:border-black/15 transition cursor-pointer"
                >
                  <LockClosedIcon className="w-4 h-4 text-brand stroke-[2]" />
                  <span>Change password</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. SECTION: MULTI-FACTOR AUTHENTICATION */}
          <div>
            {twoFaSuccessMsg && (
              <div className="mb-4 p-4 rounded-lg bg-brand/15 border border-brand/60 text-black text-xs font-semibold">
                {twoFaSuccessMsg}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4">
                <h2 className="font-heading font-bold text-sm text-black">
                  Multi-Factor Authentication
                </h2>
                <p className="font-primary text-xs text-black/65 mt-1">
                  Add an extra layer of protection to your account.
                </p>
              </div>

              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Authenticator app card */}
                <div className="bg-white border border-black/15 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-md bg-brand/15 border border-brand/60 flex items-center justify-center text-black">
                        <DevicePhoneMobileIcon className="w-4 h-4 text-brand stroke-[2]" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${is2FAEnabled
                          ? "bg-brand/15 text-black border border-brand/60"
                          : "bg-black/5 text-black border border-black/15"
                          }`}
                      >
                        {is2FAEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-black">
                      Authenticator app
                    </h3>
                    <p className="text-[11px] text-black/65 mt-0.5">
                      Primary two-factor authentication method.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-black/15">
                    <button
                      type="button"
                      onClick={handleToggle2FA}
                      className="w-full py-2 rounded-md text-xs font-heading font-bold text-black bg-black/5 hover:bg-black/10 border border-black/15 transition cursor-pointer"
                    >
                      {is2FAEnabled ? "Disable" : "Manage"}
                    </button>
                  </div>
                </div>

                {/* Email 2FA card */}
                <div className="bg-white border border-black/15 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-md bg-brand/15 border border-brand/60 flex items-center justify-center text-black">
                        <EnvelopeIcon className="w-4 h-4 text-brand stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand/15 text-black border border-brand/60">
                        Enabled
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-black">
                      Email
                    </h3>
                    <p className="text-[11px] text-black/65 mt-0.5">
                      Secondary two-factor authentication method.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-black/15">
                    <button
                      type="button"
                      onClick={() => alert("Email verification is linked to your login email.")}
                      className="w-full py-2 rounded-md text-xs font-heading font-bold text-black bg-black/5 hover:bg-black/10 border border-black/15 transition cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 & 4. SECTIONS: ADD NEW ADMINISTRATOR & ACTIVE ADMINISTRATORS (Accessible to Super Administrators) */}
          {isMounted && (adminRole === "super_admin" || adminEmail.toLowerCase() === "admin@maatram.com") && (
            <>
              {/* 3. SECTION: ADD NEW ADMINISTRATOR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4">
                  <h2 className="font-heading font-bold text-sm text-black">
                    Add New Administrator
                  </h2>
                  <p className="font-primary text-xs text-black/65 mt-1">
                    Grant dashboard access to new foundation staff, coordinators, or reviewers.
                  </p>
                </div>

                <div className="lg:col-span-8 bg-white border border-black/15 rounded-xl p-6 lg:p-7 space-y-5">
                  {adminSuccessMsg && (
                    <div className="p-4 rounded-lg bg-brand/15 border border-brand/60 text-black text-xs font-semibold">
                      {adminSuccessMsg}
                    </div>
                  )}

                  {adminErrorMsg && (
                    <div className="p-4 rounded-lg bg-brand/15 border border-brand/60 text-black text-xs font-semibold">
                      {adminErrorMsg}
                    </div>
                  )}

                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-heading font-bold text-black mb-1.5">
                          Full Name <span className="text-black/65">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                        />
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-heading font-bold text-black mb-1.5">
                          Email Address <span className="text-black/65">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="admin@maatramedu.org"
                          className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                        />
                      </div>

                      {/* Temporary Password */}
                      <div>
                        <label className="block text-xs font-heading font-bold text-black mb-1.5">
                          Temporary Password <span className="text-black/65">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-xs font-heading font-bold text-black mb-1.5">
                          Admin Role
                        </label>
                        <select
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                        >
                          <option value="admin">Admin (Full Access)</option>
                          <option value="reviewer">Reviewer (View & Verify Only)</option>
                          <option value="super_admin">Super Admin (All Privileges)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t border-black/15">
                      <button
                        type="submit"
                        disabled={isSubmittingAdmin}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand"
                      >
                        <span>{isSubmittingAdmin ? "Adding Admin..." : "Add Administrator"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* 4. SECTION: ACTIVE ADMINISTRATORS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4">
                  <h2 className="font-heading font-bold text-sm text-black">
                    Active Administrators
                  </h2>
                  <p className="font-primary text-xs text-black/65 mt-1">
                    List of authorized admin accounts on the Maatram Portal.
                  </p>
                </div>

                <div className="lg:col-span-8 bg-white border border-black/15 rounded-xl p-6 lg:p-7">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/15 text-black/65 font-heading text-[11px] uppercase tracking-wider bg-black/5">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">2FA Status</th>
                          <th className="py-3 px-4">Date Added</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/15 font-medium">
                        {adminList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-black/65 text-xs">
                              No administrators added yet. Use the form above to add a new administrator.
                            </td>
                          </tr>
                        ) : (
                          adminList.map((admin) => (
                            <tr key={admin.id} className="hover:bg-brand/15 transition">
                              <td className="py-3.5 px-4 font-bold text-black">
                                {admin.name}
                              </td>
                              <td className="py-3.5 px-4 text-black font-mono text-[11px]">
                                {admin.email}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${admin.role === "super_admin"
                                    ? "bg-brand/15 text-black border border-brand/60"
                                    : admin.role === "admin"
                                      ? "bg-brand/15 text-black border border-brand/60"
                                      : "bg-brand/15 text-black border border-brand/60"
                                    }`}
                                >
                                  {admin.role.replace("_", " ")}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {admin.twoFactorEnabled ? (
                                  <span className="text-black font-semibold text-[11px]">
                                    Enabled
                                  </span>
                                ) : (
                                  <span className="text-black/65 font-semibold text-[11px]">
                                    Disabled
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-black/65 font-mono text-[11px]">
                                {admin.createdAt}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {admin.role !== "super_admin" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeAdmin(admin.id, admin.name)}
                                    className="text-black hover:text-black font-bold hover:underline cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                ) : (
                                  <span className="text-black/65 text-[11px]">Primary Owner</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* 2FA SETUP MODAL (QR CODE) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-brand/60 shadow-sm max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-black/15">
              <h3 className="font-heading font-bold text-base text-black">Set Up Authenticator App</h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-black/65 hover:text-black cursor-pointer font-bold text-sm"
              >
                <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
              </button>
            </div>

            <p className="text-xs text-black">
              Scan this QR code with Google Authenticator or Microsoft Authenticator, then enter the 6-digit code below.
            </p>

            {/* QR Code Graphic */}
            <div className="flex flex-col items-center justify-center p-6 bg-brand/15 rounded-lg border-2 border-dashed border-brand/60">
              <div className="w-44 h-44 bg-white rounded-lg border border-black/15 p-2 flex items-center justify-center overflow-hidden">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Authenticator QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <QrCodeIcon className="w-12 h-12 text-black/65 mx-auto mb-1 stroke-1" />
                    <p className="text-[10px] text-black/65 font-mono">Generating QR...</p>
                  </div>
                )}
              </div>
              <p className="text-[11px] font-mono font-bold text-black mt-3 tracking-wider bg-white px-3 py-1 rounded-lg border border-black/15 select-all">
                KEY: {twoFactorSecret}
              </p>
            </div>

            {/* Verification Code Form */}
            <form onSubmit={handleConfirm2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-lg font-bold py-2.5 rounded-md border border-black/15 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2 text-xs font-heading font-bold text-black hover:bg-black/5 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand"
                >
                  Verify & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-black/15 shadow-sm max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-black/15">
              <h3 className="font-heading font-bold text-base text-black">Change Password</h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setPasswordMsg("");
                }}
                className="text-black/65 hover:text-black cursor-pointer font-bold text-sm"
              >
                <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
              </button>
            </div>

            {passwordMsg && (
              <div className="p-3.5 rounded-md bg-brand/15 border border-brand/60 text-black text-xs font-semibold">
                {passwordMsg}
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-md bg-brand/15 border border-brand/60 text-black text-xs font-semibold">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  Current Password <span className="text-black/65">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  New Password <span className="text-black/65">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  Confirm New Password <span className="text-black/65">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError("");
                    setPasswordMsg("");
                  }}
                  className="px-4 py-2 text-xs font-heading font-bold text-black hover:bg-black/5 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand"
                >
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE LOGIN EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-black/15 shadow-sm max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-black/15">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-brand/15 border border-brand/60 flex items-center justify-center text-black">
                  <EnvelopeIcon className="w-4 h-4 text-brand stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">
                    Change Login Email
                  </h3>
                  <p className="text-[11px] text-black/65">
                    Update your primary administrator credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailError("");
                }}
                className="text-black/65 hover:text-black cursor-pointer font-bold text-sm w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center"
              >
                <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
              </button>
            </div>

            {emailError && (
              <div className="p-3.5 rounded-md bg-brand/15 border border-brand/60 text-black text-xs font-semibold">
                {emailError}
              </div>
            )}

            <form onSubmit={handleSaveEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  Current Email
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-black/5 text-xs text-black font-mono">
                  {adminEmail}
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  New Login Email <span className="text-black/65">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={newEmailInput}
                  onChange={(e) => {
                    setNewEmailInput(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="new.admin@maatramedu.org"
                  className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
                <p className="text-[11px] text-black/65 mt-1">
                  You will use this email address to sign in to the Maatram Portal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailError("");
                  }}
                  className="px-4 py-2 text-xs font-heading font-bold text-black hover:bg-black/5 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEmail}
                  className="px-5 py-2 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand disabled:opacity-50"
                >
                  {isSavingEmail ? "Saving..." : "Update Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
      />
    </div>
  );
}
