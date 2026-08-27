"use client";

import { useState, useEffect } from "react";
import { X, Edit2, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import {
  useUpdateStationMutation,
  useUploadStationLogoMutation,
  useUploadStationCoverImageMutation,
} from "@/features/station/stationApi";
import { useUpdateUserMutation } from "@/features/user/userApi";
import { toast } from "sonner";
import { resolveUrl } from "@/lib/utils";
import { PasswordInput, evaluatePassword } from "@/components/shared/password-strength-input";
import { ImageCropModal } from "@/components/shared/image-crop-modal";

interface EditStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationData: {
    id: string;
    name: string;
    stationCode: string;
    description?: string;
    website?: string;
    logo?: string;
    coverImage?: string;
    adminUser?: {
      id: string;
      fullName?: string;
      email?: string;
      phone?: string;
    } | null;
  } | null;
}

export function EditStationModal({ isOpen, onClose, stationData }: EditStationModalProps) {
  const [name, setName] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  const [adminFullName, setAdminFullName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Crop modal state
  const [cropConfig, setCropConfig] = useState<{
    isOpen: boolean;
    imageSrc: string | null;
    file: File | null;
    aspect: number;
    cropShape: "rect" | "round";
    title: string;
    recommendedHint: string;
    target: "logo" | "cover";
  }>({
    isOpen: false,
    imageSrc: null,
    file: null,
    aspect: 1,
    cropShape: "rect",
    title: "",
    recommendedHint: "",
    target: "logo",
  });

  const [updateStation, { isLoading: isUpdatingStation }] = useUpdateStationMutation();
  const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadStationLogoMutation();
  const [uploadCover, { isLoading: isUploadingCover }] = useUploadStationCoverImageMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();

  useEffect(() => {
    if (stationData) {
      setName(stationData.name || "");
      setStationCode(stationData.stationCode || "");
      setDescription(stationData.description || "");
      setWebsite(stationData.website || "");
      setAdminFullName(stationData.adminUser?.fullName || "");
      setAdminEmail(stationData.adminUser?.email || "");
      setAdminPhone(stationData.adminUser?.phone || "");
      setAdminPassword("");
      setLogoFile(null);
      setCoverFile(null);
      setLogoPreview(resolveUrl(stationData.logo) || null);
      setCoverPreview(resolveUrl(stationData.coverImage) || null);
    }
  }, [stationData]);

  if (!isOpen || !stationData) return null;

  const isSubmitting = isUpdatingStation || isUploadingLogo || isUploadingCover || isUpdatingUser;

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
          title: "Crop Station Banner",
          recommendedHint: "Recommended: 1600 × 900 px (16:9 aspect ratio)",
          target: "cover",
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    if (cropConfig.target === "logo") {
      setLogoFile(croppedFile);
      setLogoPreview(previewUrl);
    } else {
      setCoverFile(croppedFile);
      setCoverPreview(previewUrl);
    }
    setCropConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Update station details
      const resStation = await updateStation({
        id: stationData.id,
        name,
        description: description || undefined,
        website: website || undefined,
      });
      if ("error" in resStation) {
        const errData = resStation.error as any;
        toast.error(errData?.data?.message || errData?.message || "Failed to update station info");
        return;
      }

      // 2. Upload logo if changed
      if (logoFile) {
        const resLogo = await uploadLogo({ id: stationData.id, file: logoFile });
        if ("error" in resLogo) {
          const errData = resLogo.error as any;
          toast.error(errData?.data?.message || errData?.message || "Failed to upload logo");
          return;
        }
      }

      // 3. Upload cover image / banner if changed
      if (coverFile) {
        const resCover = await uploadCover({ id: stationData.id, file: coverFile });
        if ("error" in resCover) {
          const errData = resCover.error as any;
          toast.error(errData?.data?.message || errData?.message || "Failed to upload banner");
          return;
        }
      }

      // 4. Update station admin credentials if admin profile exists
      if (stationData.adminUser?.id) {
        if (adminPassword) {
          const evalResult = evaluatePassword(adminPassword);
          if (!evalResult.isValid) {
            toast.error("Please ensure the new password satisfies all 5 security requirements.");
            return;
          }
        }

        const userPayload: any = { id: stationData.adminUser.id };
        if (adminFullName) userPayload.fullName = adminFullName;
        if (adminEmail) userPayload.email = adminEmail;
        if (adminPhone) userPayload.phone = adminPhone;
        if (adminPassword) userPayload.password = adminPassword;

        const resUser = await updateUser(userPayload);
        if ("error" in resUser) {
          const errData = resUser.error as any;
          toast.error(errData?.data?.message || errData?.message || "Failed to update admin account");
          return;
        }
      }

      toast.success("Station & Admin updated successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update station");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 font-bold text-foreground text-sm">
            <Edit2 size={16} className="text-[#02B2FF]" />
            Edit Station & Station Admin
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Banner & Logo Media Section */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Station Branding & Media
            </span>
            <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden w-full aspect-[16/9] mb-3">
              {coverPreview ? (
                <img src={coverPreview} alt="Station Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                  <ImageIcon size={20} />
                  <span>No Banner Image</span>
                </div>
              )}
              <label className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 backdrop-blur-sm transition-colors">
                <Upload size={12} />
                <span>Upload Banner</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverChange} />
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">Recommended: 1600 × 900 px (16:9 aspect ratio, up to 20MB)</p>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl border-2 border-border bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Station Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">{name?.charAt(0) || "S"}</span>
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-border">
                  <Upload size={13} />
                  Upload Station Logo
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                </label>
                <p className="text-[11px] text-muted-foreground mt-1">Recommended: 500 × 500 px (1:1, transparent PNG)</p>
              </div>
            </div>
          </div>

          {/* Station Details */}
          <div className="border-t border-border pt-4 space-y-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
              Station Info
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Station Name<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Station Code
                </label>
                <input
                  type="text"
                  disabled
                  value={stationCode}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Website URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Station description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] resize-none"
              />
            </div>
          </div>

          {/* Station Admin Account Details */}
          <div className="border-t border-border pt-4 space-y-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
              Station Admin Credentials
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Admin Full Name</label>
                <input
                  type="text"
                  placeholder="Admin Name"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@station.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+254 700 000000"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>
              <div>
                <PasswordInput
                  label="New Password"
                  placeholder="Enter strong new password"
                  hint="Optional: leave blank to keep current"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  showStrength={adminPassword.length > 0}
                  showChecklist={adminPassword.length > 0}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#02B2FF] hover:bg-[#00A0E8] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
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
