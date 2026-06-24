"use client";

import { useState } from "react";
import { User, Bell, Upload, Eye, EyeOff, Save } from "lucide-react";
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

  // Station fields (station_admin only)
  const [stationName, setStationName] = useState("");
  const [stationDescription, setStationDescription] = useState("");

  // Cover photo (station_admin only)
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(false);

  const handleSave = () => {
    // TODO: wire to real API
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
              role={role}
              coverPhoto={coverPhoto}
              setCoverPhoto={setCoverPhoto}
              stationName={stationName}
              setStationName={setStationName}
              stationDescription={stationDescription}
              setStationDescription={setStationDescription}
              onSave={handleSave}
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
  role,
  coverPhoto,
  setCoverPhoto,
  stationName,
  setStationName,
  stationDescription,
  setStationDescription,
  onSave,
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
  role: string;
  coverPhoto: string | null;
  setCoverPhoto: (v: string | null) => void;
  stationName: string;
  setStationName: (v: string) => void;
  stationDescription: string;
  setStationDescription: (v: string) => void;
  onSave: () => void;
}) {
  const isStationAdmin = role === "station_admin";
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
        <label className="text-sm font-semibold">
          {isStationAdmin ? "Profile Photo / Logo" : "Profile Photo"}
        </label>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#02B2FF] text-2xl font-bold text-white">
            {initials}
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
              <Upload size={16} />
              Upload Photo
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // TODO: wire to API upload
                    console.log("Logo file selected:", file.name);
                  }
                }}
              />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG up to 8MB. Recommended 256×256px.
            </p>
          </div>
        </div>
      </div>

      {/* Cover Photo (station_admin only) */}
      {isStationAdmin && (
        <>
          <hr className="border-border" />
          <div>
            <label className="text-sm font-semibold">Cover Photo</label>
            <div className="mt-3">
              {coverPhoto ? (
                <div className="relative">
                  <img
                    src={coverPhoto}
                    alt="Cover photo preview"
                    className="h-48 w-full rounded-lg object-cover"
                  />
                  <button
                    onClick={() => setCoverPhoto(null)}
                    className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-white"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-10 transition-colors hover:border-[#02B2FF] hover:bg-muted/50">
                  <Upload size={24} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Upload Cover Photo
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG up to 8MB. Recommended 1200×300px.
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setCoverPhoto(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </>
      )}

      <hr className="border-border" />

      {/* Station Name + Description (station_admin only) */}
      {isStationAdmin && (
        <>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Station Name</label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                placeholder="e.g. Capital FM Kenya"
                className="rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Station Description</label>
              <textarea
                value={stationDescription}
                onChange={(e) => setStationDescription(e.target.value)}
                placeholder="Tell listeners about your station..."
                rows={3}
                className="rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF] resize-none"
              />
            </div>
          </div>
          <hr className="border-border" />
        </>
      )}

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
      <div className="flex items-center justify-end pt-4">
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
      <div className="flex items-center justify-end pt-4">
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
