"use client";

import { useState, useEffect, useRef } from "react";
import { User, Bell, Upload, Eye, EyeOff, Save, Loader2, ShieldCheck, Lock, X, KeyRound } from "lucide-react";
import { useRole } from "@/contexts/role-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  useGetStationByIdQuery,
  useUploadStationLogoMutation,
  useUploadStationCoverImageMutation,
  useUpdateStationMutation,
} from "@/features/station/stationApi";
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from "@/features/user/userApi";
import {
  useChangePasswordMutation,
  useInit2FASetupMutation,
  useSetup2FAEnableMutation,
  useDisable2FAMutation,
} from "@/features/auth/authApi";
import { updateUser } from "@/features/auth/authSlice";
import { toast } from "sonner";
import { resolveUrl } from "@/lib/utils";
import { PasswordStrengthInput, PasswordInput, evaluatePassword } from "@/components/shared/password-strength-input";
import { TwoFactorSetupModal } from "@/components/auth/two-factor-setup-modal";
import { ImageCropModal } from "@/components/shared/image-crop-modal";

type SettingsTab = "account" | "notification";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Account Settings", icon: <User size={18} /> },
  { id: "notification", label: "Notification Settings", icon: <Bell size={18} /> },
];

export default function SettingsContent() {
  const role = useRole();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isStationAdmin = role === "station_admin";
  const stationId = user?.stationId;

  const initials = (user?.fullName || role)
    .split("_")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  // Fetch live profile from backend
  const { data: profileData } = useGetMyProfileQuery();

  // Fetch station data for station_admin
  const { data: stationData, isLoading: stationLoading } = useGetStationByIdQuery(
    stationId || "",
    { skip: !isStationAdmin || !stationId }
  );

  // Mutations
  const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadStationLogoMutation();
  const [uploadCoverImage, { isLoading: isUploadingCover }] = useUploadStationCoverImageMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateMyProfileMutation();
  const [updateStation, { isLoading: isUpdatingStation }] = useUpdateStationMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [init2FASetup, { isLoading: isInitializing2FA }] = useInit2FASetupMutation();
  const [setup2FAEnable, { isLoading: isEnabling2FA }] = useSetup2FAEnableMutation();
  const [disable2FA, { isLoading: isDisabling2FA }] = useDisable2FAMutation();

  // 2FA state
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{
    secret: string;
    qrCode: string;
    recoveryCodes: string[];
  } | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const handleStart2FASetup = async () => {
    try {
      const result = await init2FASetup().unwrap();
      if (result.success && result.data) {
        setTwoFactorSetupData(result.data);
        setShow2FASetupModal(true);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to initialize 2FA setup");
    }
  };

  const handleVerify2FASetup = async (code: string) => {
    try {
      const result = await setup2FAEnable({
        code,
        recoveryCodes: twoFactorSetupData?.recoveryCodes,
      }).unwrap();
      if (result.success) {
        dispatch(updateUser({ twoFactorEnabled: true }));
        setShow2FASetupModal(false);
        setTwoFactorSetupData(null);
        toast.success("Two-Factor Authentication is now enabled!");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid verification code");
    }
  };

  const handleDisable2FA = async () => {
    try {
      const result = await disable2FA({
        password: disablePassword,
        code: disableCode,
      }).unwrap();
      if (result.success) {
        dispatch(updateUser({ twoFactorEnabled: false }));
        setShow2FADisableModal(false);
        setDisablePassword("");
        setDisableCode("");
        toast.success("Two-Factor Authentication has been disabled");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to disable 2FA. Please check your credentials");
    }
  };

  // Account settings state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Station fields (station_admin only)
  const [stationName, setStationName] = useState("");
  const [stationDescription, setStationDescription] = useState("");
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const logoFileRef = useRef<File | null>(null);
  const coverFileRef = useRef<File | null>(null);
  const avatarFileRef = useRef<File | null>(null);
  const [logoDirty, setLogoDirty] = useState(false);
  const [coverDirty, setCoverDirty] = useState(false);
  const [avatarDirty, setAvatarDirty] = useState(false);

  // Image Crop Modal State
  const [cropConfig, setCropConfig] = useState<{
    isOpen: boolean;
    imageSrc: string | null;
    file: File | null;
    aspect: number;
    cropShape: "rect" | "round";
    title: string;
    recommendedHint: string;
    target: "avatar" | "logo" | "cover";
  }>({
    isOpen: false,
    imageSrc: null,
    file: null,
    aspect: 1,
    cropShape: "round",
    title: "",
    recommendedHint: "",
    target: "avatar",
  });

  // Pre-fill station data when fetched
  useEffect(() => {
    if (stationData?.data) {
      const station = stationData.data;
      setStationName(station.name || "");
      setStationDescription(station.description || "");
      if (station.logo) setLogoPreview(station.logo);
      if (station.coverImage) setCoverPhotoPreview(station.coverImage);
    }
  }, [stationData]);

  // Pre-fill user data when profile is fetched or user changes
  useEffect(() => {
    const profile = profileData?.data || user;
    if (profile) {
      if (profile.fullName) setFullName(profile.fullName);
      if (profile.email) setEmail(profile.email);
      if (profile.phone) setPhone(profile.phone);
      if (profile.avatar) setAvatarPreview(profile.avatar);
    }
  }, [profileData, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must not exceed 20MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropConfig({
          isOpen: true,
          imageSrc: ev.target?.result as string,
          file,
          aspect: 1,
          cropShape: "round",
          title: "Crop Profile Avatar",
          recommendedHint: "Recommended: 500 × 500 px (1:1 aspect ratio)",
          target: "avatar",
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must not exceed 20MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropConfig({
          isOpen: true,
          imageSrc: ev.target?.result as string,
          file,
          aspect: 1,
          cropShape: "rect",
          title: "Crop Station Logo",
          recommendedHint: "Recommended: 500 × 500 px (1:1 aspect ratio, transparent PNG)",
          target: "logo",
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must not exceed 20MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropConfig({
          isOpen: true,
          imageSrc: ev.target?.result as string,
          file,
          aspect: 16 / 9,
          cropShape: "rect",
          title: "Crop Cover Photo",
          recommendedHint: "Recommended: 1600 × 900 px (16:9 aspect ratio)",
          target: "cover",
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    if (cropConfig.target === "avatar") {
      avatarFileRef.current = croppedFile;
      setAvatarPreview(previewUrl);
      setAvatarDirty(true);
    } else if (cropConfig.target === "logo") {
      logoFileRef.current = croppedFile;
      setLogoPreview(previewUrl);
      setLogoDirty(true);
    } else if (cropConfig.target === "cover") {
      coverFileRef.current = croppedFile;
      setCoverPhotoPreview(previewUrl);
      setCoverDirty(true);
    }
    setCropConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSaveLogo = async () => {
    if (!stationId || !logoFileRef.current) return;
    try {
      await uploadLogo({ id: stationId, file: logoFileRef.current }).unwrap();
      logoFileRef.current = null;
      setLogoDirty(false);
      toast.success("Logo updated");
    } catch {
      toast.error("Failed to upload logo");
    }
  };

  const handleCancelLogo = () => {
    const original = stationData?.data?.logo || null;
    setLogoPreview(original);
    logoFileRef.current = null;
    setLogoDirty(false);
  };

  const handleSaveCover = async () => {
    if (!stationId || !coverFileRef.current) return;
    try {
      await uploadCoverImage({ id: stationId, file: coverFileRef.current }).unwrap();
      coverFileRef.current = null;
      setCoverDirty(false);
      toast.success("Cover photo updated");
    } catch {
      toast.error("Failed to upload cover photo");
    }
  };

  const handleCancelCover = () => {
    const original = stationData?.data?.coverImage || null;
    setCoverPhotoPreview(original);
    coverFileRef.current = null;
    setCoverDirty(false);
  };

  const handleSaveAccountSettings = async () => {
    let hasSuccess = false;
    try {
      // 1. Update User Profile (with avatar if updated)
      if (avatarDirty && avatarFileRef.current) {
        const formData = new FormData();
        if (fullName) formData.append("fullName", fullName);
        if (email.trim()) formData.append("email", email.trim());
        if (phone.trim()) formData.append("phone", phone.trim());
        formData.append("avatar", avatarFileRef.current);
        const res = await updateProfile(formData).unwrap();
        if (res?.data?.avatar) setAvatarPreview(res.data.avatar);
        setAvatarDirty(false);
        avatarFileRef.current = null;
      } else {
        await updateProfile({
          fullName,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }).unwrap();
      }

      dispatch(updateUser({ fullName, email, phone }));
      hasSuccess = true;

      // 2. Change password if filled
      if (newPassword) {
        if (!currentPassword) {
          toast.error("Please enter your current password to set a new password.");
          return;
        }
        const evalResult = evaluatePassword(newPassword);
        if (!evalResult.isValid) {
          toast.error("Please ensure your new password satisfies all 5 security requirements.");
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("New password and confirm password do not match.");
          return;
        }
        await changePassword({ currentPassword, newPassword }).unwrap();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password updated successfully.");
      }

      // 3. Update Station Info for station_admin
      if (isStationAdmin && stationId) {
        await updateStation({
          id: stationId,
          name: stationName,
          description: stationDescription,
        }).unwrap();
      }

      // 4. Upload logo or cover if dirty
      if (logoDirty && logoFileRef.current && stationId) {
        await handleSaveLogo();
      }
      if (coverDirty && coverFileRef.current && stationId) {
        await handleSaveCover();
      }

      if (hasSuccess) {
        toast.success("Account settings saved successfully");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save account settings");
    }
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
          <div className="rounded-xl border bg-card p-2 shadow-sm">
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
        <div className="flex-1 rounded-xl border bg-card p-8 shadow-sm">
          {activeTab === "account" ? (
            <AccountSettings
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showCurrentPassword={showCurrentPassword}
              setShowCurrentPassword={setShowCurrentPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              initials={initials}
              role={role}
              avatarPreview={avatarPreview}
              onAvatarChange={handleAvatarChange}
              coverPhotoPreview={coverPhotoPreview}
              logoPreview={logoPreview}
              onLogoChange={handleLogoChange}
              onCoverChange={handleCoverChange}
              stationName={stationName}
              setStationName={setStationName}
              stationDescription={stationDescription}
              setStationDescription={setStationDescription}
              logoDirty={logoDirty}
              coverDirty={coverDirty}
              onSaveLogo={handleSaveLogo}
              onCancelLogo={handleCancelLogo}
              onSaveCover={handleSaveCover}
              onCancelCover={handleCancelCover}
              isUploadingLogo={isUploadingLogo}
              isUploadingCover={isUploadingCover}
              onSaveAccountSettings={handleSaveAccountSettings}
              isSavingAccountSettings={
                isUpdatingProfile || isUpdatingStation || isChangingPassword || isUploadingLogo || isUploadingCover
              }
              user={user}
              handleStart2FASetup={handleStart2FASetup}
              isInitializing2FA={isInitializing2FA}
              show2FASetupModal={show2FASetupModal}
              setShow2FASetupModal={setShow2FASetupModal}
              twoFactorSetupData={twoFactorSetupData}
              isEnabling2FA={isEnabling2FA}
              handleVerify2FASetup={handleVerify2FASetup}
              show2FADisableModal={show2FADisableModal}
              setShow2FADisableModal={setShow2FADisableModal}
              disablePassword={disablePassword}
              setDisablePassword={setDisablePassword}
              disableCode={disableCode}
              setDisableCode={setDisableCode}
              handleDisable2FA={handleDisable2FA}
              isDisabling2FA={isDisabling2FA}
            />
          ) : (
            <NotificationSettings onSave={() => {}} />
          )}
        </div>
      </div>

      <ImageCropModal
        isOpen={cropConfig.isOpen}
        imageSrc={cropConfig.imageSrc}
        file={cropConfig.file}
        aspect={cropConfig.aspect}
        cropShape={cropConfig.cropShape}
        title={cropConfig.title}
        recommendedHint={cropConfig.recommendedHint}
        onCropComplete={handleCropComplete}
        onCancel={() => setCropConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

/* ─── Account Settings ─── */

function AccountSettings({
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  initials,
  role,
  avatarPreview,
  onAvatarChange,
  coverPhotoPreview,
  logoPreview,
  onLogoChange,
  onCoverChange,
  stationName,
  setStationName,
  stationDescription,
  setStationDescription,
  logoDirty,
  coverDirty,
  onSaveLogo,
  onCancelLogo,
  onSaveCover,
  onCancelCover,
  isUploadingLogo,
  isUploadingCover,
  onSaveAccountSettings,
  isSavingAccountSettings,
  user,
  handleStart2FASetup,
  isInitializing2FA,
  show2FASetupModal,
  setShow2FASetupModal,
  twoFactorSetupData,
  isEnabling2FA,
  handleVerify2FASetup,
  show2FADisableModal,
  setShow2FADisableModal,
  disablePassword,
  setDisablePassword,
  disableCode,
  setDisableCode,
  handleDisable2FA,
  isDisabling2FA,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  initials: string;
  role: string;
  avatarPreview: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  coverPhotoPreview: string | null;
  logoPreview: string | null;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  stationName: string;
  setStationName: (v: string) => void;
  stationDescription: string;
  setStationDescription: (v: string) => void;
  logoDirty: boolean;
  coverDirty: boolean;
  onSaveLogo: () => Promise<void>;
  onCancelLogo: () => void;
  onSaveCover: () => Promise<void>;
  onCancelCover: () => void;
  isUploadingLogo: boolean;
  isUploadingCover: boolean;
  onSaveAccountSettings: () => Promise<void>;
  isSavingAccountSettings: boolean;
  user: any;
  handleStart2FASetup: () => Promise<void>;
  isInitializing2FA: boolean;
  show2FASetupModal: boolean;
  setShow2FASetupModal: (v: boolean) => void;
  twoFactorSetupData: { secret: string; qrCode: string; recoveryCodes: string[] } | null;
  isEnabling2FA: boolean;
  handleVerify2FASetup: (code: string) => Promise<void>;
  show2FADisableModal: boolean;
  setShow2FADisableModal: (v: boolean) => void;
  disablePassword: string;
  setDisablePassword: (v: string) => void;
  disableCode: string;
  setDisableCode: (v: string) => void;
  handleDisable2FA: () => Promise<void>;
  isDisabling2FA: boolean;
}) {
  const isStationAdmin = role === "station_admin";

  const resolvedAvatarUrl = resolveUrl(avatarPreview);
  const resolvedCoverUrl = resolveUrl(coverPhotoPreview);
  const resolvedLogoUrl = resolveUrl(logoPreview);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update your personal account information and credentials.
        </p>
      </div>

      {/* Personal Profile Photo */}
      <div>
        <label className="text-sm font-semibold">Personal Profile Picture</label>
        <p className="text-xs text-muted-foreground mt-0.5">Your personal avatar shown in header & user lists.</p>
        <div className="mt-3">
          {resolvedAvatarUrl ? (
            <div className="relative w-32 h-32">
              <img
                src={resolvedAvatarUrl}
                alt="Avatar preview"
                className="w-32 h-32 rounded-full object-cover border border-border"
              />
              <label className="absolute right-0 bottom-0 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-background/90 p-2 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-background border border-border">
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onAvatarChange}
                />
              </label>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-border w-32 h-32 transition-colors hover:border-[#02B2FF] hover:bg-muted/50">
              <Upload size={20} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Upload Avatar</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onAvatarChange}
              />
            </label>
          )}
          <p className="text-[11px] text-muted-foreground mt-1.5">Recommended: 500 × 500 px (1:1 aspect ratio)</p>
        </div>
      </div>

      {/* Station Logo (station_admin only) */}
      {isStationAdmin && (
        <div>
          <label className="text-sm font-semibold">Station Logo</label>
          <p className="text-xs text-muted-foreground mt-0.5">Station branding logo shown across player & directory.</p>
          <div className="mt-3">
            {resolvedLogoUrl ? (
              <div>
                <div className="relative w-40 h-40">
                  <img
                    src={resolvedLogoUrl}
                    alt="Logo preview"
                    className="w-40 h-40 rounded-lg object-cover"
                  />
                  <label className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-background">
                    Change Logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={onLogoChange}
                    />
                  </label>
                </div>
                {logoDirty && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={onSaveLogo}
                      disabled={isUploadingLogo}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#02B2FF] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#02B2FF]/90 disabled:opacity-50"
                    >
                      {isUploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save Logo
                    </button>
                    <button
                      onClick={onCancelLogo}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border w-40 h-40 transition-colors hover:border-[#02B2FF] hover:bg-muted/50">
                <Upload size={24} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Upload Logo
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Recommended: 500 × 500 px (1:1, transparent PNG)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onLogoChange}
                />
              </label>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5">Recommended: 500 × 500 px (1:1 aspect ratio, transparent PNG)</p>
          </div>
        </div>
      )}

      {/* Cover Photo (station_admin only) */}
      {isStationAdmin && (
        <>
          <hr className="border-border" />
          <div>
            <label className="text-sm font-semibold">Cover Photo</label>
            <div className="mt-3">
              {resolvedCoverUrl ? (
                <div>
                  <div className="relative w-full aspect-[16/9] max-w-2xl rounded-xl overflow-hidden border border-border">
                    <img
                      src={resolvedCoverUrl}
                      alt="Cover photo preview"
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-background border border-border">
                      Change Photo
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={onCoverChange}
                      />
                    </label>
                  </div>
                  {coverDirty && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={onSaveCover}
                        disabled={isUploadingCover}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#02B2FF] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#02B2FF]/90 disabled:opacity-50"
                      >
                        {isUploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save
                      </button>
                      <button
                        onClick={onCancelCover}
                        className="rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border aspect-[16/9] max-w-2xl w-full transition-colors hover:border-[#02B2FF] hover:bg-muted/50">
                  <Upload size={24} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Upload Cover Photo
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    Recommended: 1600 × 900 px (16:9 aspect ratio)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={onCoverChange}
                  />
                </label>
              )}
              <p className="text-[11px] text-muted-foreground mt-1.5">Recommended: 1600 × 900 px (16:9 aspect ratio, up to 20MB)</p>
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
                className="rounded-lg border bg-background px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Station Description</label>
              <textarea
                value={stationDescription}
                onChange={(e) => setStationDescription(e.target.value)}
                placeholder="Tell listeners about your station..."
                rows={3}
                className="rounded-lg border bg-background px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF] resize-none"
              />
            </div>
          </div>
          <hr className="border-border" />
        </>
      )}

      {/* Full Name + Email + Phone */}
      <div className="grid grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border bg-background px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional"
            className="rounded-lg border bg-background px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
            className="rounded-lg border bg-background px-4 py-2.5 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
          />
        </div>
      </div>

      <hr className="border-border" />

      {/* Password */}
      <div>
        <h3 className="text-sm font-semibold">Change Password</h3>
        <p className="text-xs text-muted-foreground">
          Update your account password below. Passwords must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                className="w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm shadow-sm focus:border-[#02B2FF] focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <PasswordStrengthInput
              value={newPassword}
              onChange={setNewPassword}
              label="New Password"
              placeholder="Enter strong new password"
            />
          </div>

          {newPassword.length > 0 && (
            <div className="flex flex-col gap-2 md:col-start-2">
              <label className="text-xs font-medium text-muted-foreground">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-border focus:border-[#02B2FF] focus:ring-[#02B2FF]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <hr className="border-border" />

      {/* Two-Factor Authentication (2FA) */}
      <div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#02B2FF]" />
              <h3 className="text-sm font-semibold">Two-Factor Authentication (2FA)</h3>
              {user?.twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Enabled
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  Not Configured
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Protect your account using standard Time-based One-Time Passwords (TOTP) compatible with Google Authenticator, Microsoft Authenticator, and Authy.
            </p>
          </div>

          <div>
            {user?.twoFactorEnabled ? (
              <button
                type="button"
                onClick={() => setShow2FADisableModal(true)}
                className="px-3.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart2FASetup}
                disabled={isInitializing2FA}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#02B2FF] hover:bg-[#029de0] rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isInitializing2FA ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                Set Up Authenticator
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetupModal && twoFactorSetupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-card p-6 border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShow2FASetupModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={18} />
            </button>
            <TwoFactorSetupModal
              qrCode={twoFactorSetupData.qrCode}
              secret={twoFactorSetupData.secret}
              recoveryCodes={twoFactorSetupData.recoveryCodes}
              isLoading={isEnabling2FA}
              onVerify={handleVerify2FASetup}
              isSettingsMode={true}
            />
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {show2FADisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-card p-6 border border-border shadow-2xl space-y-4">
            <button
              onClick={() => {
                setShow2FADisableModal(false);
                setDisablePassword("");
                setDisableCode("");
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Disable 2FA</h3>
                <p className="text-xs text-muted-foreground">
                  Confirm your password and current authenticator code.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <PasswordInput
                  label="Current Password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center font-mono text-xl font-bold tracking-widest rounded-lg border bg-background px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShow2FADisableModal(false);
                  setDisablePassword("");
                  setDisableCode("");
                }}
                className="flex-1 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisable2FA}
                disabled={isDisabling2FA || !disablePassword || disableCode.length !== 6}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDisabling2FA ? <Loader2 size={13} className="animate-spin" /> : null}
                Confirm Disable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Actions */}
      <div className="flex items-center justify-end pt-4 border-t border-border">
        <button
          onClick={onSaveAccountSettings}
          disabled={isSavingAccountSettings}
          className="inline-flex items-center gap-2 rounded-lg bg-[#02B2FF] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#029de0] disabled:opacity-50"
        >
          {isSavingAccountSettings ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ─── Notification Settings ─── */

function NotificationSettings({
  onSave,
}: {
  onSave: () => void;
}) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(false);

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
          checked ? "bg-[#02B2FF]" : "bg-gray-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-foreground shadow-sm ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
