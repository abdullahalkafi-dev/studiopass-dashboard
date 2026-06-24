"use client";

import { useState } from "react";
import { User, Bell, Upload, Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { useRole } from "@/contexts/role-context";

type SettingsTab = "account" | "notification";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Account Settings", icon: <User size={18} /> },
  { id: "notification", label: "Notification Settings", icon: <Bell size={18} /> },
];

export default function SettingsContent() {
  const role = useRole();
  const initials = role
    .split("_")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  // Account settings state
  const [fullName, setFullName] = useState("Super Admin");
  const [email, setEmail] = useState("admin@studiopass.io");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(false);

  const handleSave = () => {
    // TODO: wire to real API
  };

  const handleReset = () => {
    setFullName("Super Admin");
    setEmail("admin@studiopass.io");
    setCurrentPassword("");
    setNewPassword("");
    setEmailNotifications(true);
    setSystemNotifications(true);
    setLoginAlerts(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and notifications.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left Tab Sidebar */}
        <div className="w-56 shrink-0">
          <div className="rounded-xl border bg-white p-2 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#02B2FF] text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 rounded-xl border bg-white p-8 shadow-sm">
          {activeTab === "account" ? (
            <AccountSettings
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              showCurrentPassword={showCurrentPassword}
              setShowCurrentPassword={setShowCurrentPassword}
              showNewPassword={showNewPassword}
              setShowNewPassword={setShowNewPassword}
              initials={initials}
              onSave={handleSave}
              onReset={handleReset}
            />
          ) : (
            <NotificationSettings
              emailNotifications={emailNotifications}
              setEmailNotifications={setEmailNotifications}
              systemNotifications={systemNotifications}
              setSystemNotifications={setSystemNotifications}
              loginAlerts={loginAlerts}
              setLoginAlerts={setLoginAlerts}
              onSave={handleSave}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Account Settings ─── */

function AccountSettings({
  fullName,
  setFullName,
  email,
  setEmail,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  initials,
  onSave,
  onReset,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  initials: string;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update your personal account information and credentials.
        </p>
      </div>

      {/* Profile Photo */}
      <div>
        <label className="text-sm font-semibold">Profile Photo</label>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#02B2FF] text-2xl font-bold text-white">
            {initials}
          </div>
          <div>
            <button className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
              <Upload size={16} />
              Upload Photo
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG up to 2MB. Recommended 256×256px.
            </p>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Full Name + Email */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
          />
        </div>
      </div>

      <hr className="border-border" />

      {/* Password */}
      <div>
        <h3 className="text-sm font-semibold">Password</h3>
        <p className="text-xs text-muted-foreground">
          Update your account password below.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <RotateCcw size={16} />
          Reset Changes
        </button>
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg bg-[#02B2FF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#029de0]"
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ─── Notification Settings ─── */

function NotificationSettings({
  emailNotifications,
  setEmailNotifications,
  systemNotifications,
  setSystemNotifications,
  loginAlerts,
  setLoginAlerts,
  onSave,
  onReset,
}: {
  emailNotifications: boolean;
  setEmailNotifications: (v: boolean) => void;
  systemNotifications: boolean;
  setSystemNotifications: (v: boolean) => void;
  loginAlerts: boolean;
  setLoginAlerts: (v: boolean) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold">Notification Settings</h2>
        <p className="text-sm text-muted-foreground">
          Control how and when you receive notifications.
        </p>
      </div>

      <div className="flex flex-col gap-0">
        <ToggleRow
          title="Email Notifications"
          description="Receive activity summaries and alerts via email."
          checked={emailNotifications}
          onChange={setEmailNotifications}
        />
        <hr className="border-border" />
        <ToggleRow
          title="System Notifications"
          description="Get in-app alerts for important platform events."
          checked={systemNotifications}
          onChange={setSystemNotifications}
        />
        <hr className="border-border" />
        <ToggleRow
          title="Login Alerts"
          description="Be notified whenever your account is accessed from a new device."
          checked={loginAlerts}
          onChange={setLoginAlerts}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <RotateCcw size={16} />
          Reset Changes
        </button>
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg bg-[#02B2FF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#029de0]"
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ─── Toggle Row ─── */

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-5">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-[#02B2FF]" : "bg-gray-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
