import { useState } from "react";
import { X, ExternalLink, Globe, Radio, Tv, Layers, Calendar, User, Mail, Phone, ShieldCheck, MapPin, Building2, Image as ImageIcon } from "lucide-react";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { ImageLightboxModal } from "@/components/modals/image-lightbox-modal";
import { resolveUrl } from "@/lib/utils";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

interface ViewStationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export function ViewStationDetailsModal({ isOpen, onClose, data }: ViewStationDetailsModalProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const timezone = useTimezone();
  if (!isOpen || !data) return null;

  // Normalize station & admin info whether passed from station list or station-admin list
  const isStationAdminRow = data.role === "station_admin" || !!data.stationId;
  
  const stationObj = isStationAdminRow
    ? (typeof data.stationId === "object" ? data.stationId : null)
    : data;

  const adminObj = isStationAdminRow
    ? data
    : data.adminUser || null;

  const name = stationObj?.name || data.name || "Station";
  const stationCode = stationObj?.stationCode || data.stationCode || "—";
  const category = stationObj?.category || data.category || "station";
  const logo = stationObj?.logo || data.logo;
  const coverImage = stationObj?.coverImage || data.coverImage;
  const description = stationObj?.description || data.description;
  const website = stationObj?.website || data.website;
  const partnerName =
    (typeof stationObj?.partner === "object" ? stationObj?.partner?.name : null) ||
    (typeof data?.partnerId === "object" ? data?.partnerId?.name : null) ||
    (typeof data?.partner === "object" ? data?.partner?.name : null) ||
    (typeof stationObj?.partnerId === "object" ? stationObj?.partnerId?.name : null) ||
    (typeof data?.partnerId === "string" ? data?.partnerId : null) ||
    data?.partnerName ||
    "—";

  const countryName =
    (typeof stationObj?.country === "object" ? stationObj?.country?.name : null) ||
    (typeof data?.countryId === "object" ? data?.countryId?.name : null) ||
    (typeof data?.country === "object" ? data?.country?.name : null) ||
    (typeof stationObj?.countryId === "object" ? stationObj?.countryId?.name : null) ||
    data?.countryName ||
    "—";
  const isActive = stationObj?.isActive !== undefined ? stationObj.isActive : (data.isActive !== undefined ? data.isActive : !data.isBlocked);

  const logoUrl = logo ? resolveUrl(logo) : null;
  const coverUrl = coverImage ? resolveUrl(coverImage) : null;

  const CategoryIcon = category === "tv" ? Tv : category === "channel" ? Layers : Radio;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Banner & Header */}
        <div className="relative h-40 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={name}
              onClick={() => setLightboxSrc(coverUrl)}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              title="Click to zoom cover banner"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-xs gap-2">
              <ImageIcon size={24} />
              <span>No Cover Banner</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors z-10"
          >
            <X size={16} />
          </button>

          {/* Station Logo & Title Overlay */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <div
                onClick={() => logoUrl && setLightboxSrc(logoUrl)}
                className={`w-16 h-16 rounded-2xl border-2 border-background bg-popover overflow-hidden shadow-lg flex-shrink-0 flex items-center justify-center text-foreground font-bold text-2xl ${
                  logoUrl ? "cursor-pointer hover:scale-105 transition-transform" : ""
                }`}
                title={logoUrl ? "Click to zoom logo" : name}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="text-white pb-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold drop-shadow-sm">{name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[11px] font-mono font-medium backdrop-blur-md uppercase">
                    {stationCode}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
                  <span className="capitalize flex items-center gap-1">
                    <CategoryIcon size={13} className="text-[#02B2FF]" />
                    {category} Station
                  </span>
                </div>
              </div>
            </div>
            <div className="pb-1">
              <StatusBadge
                label={isActive ? "Active" : "Inactive"}
                variant={sv(isActive ? "Active" : "Inactive")}
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Overview Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Building2 size={14} className="text-[#02B2FF]" />
              Station Information
            </div>

            {description && (
              <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border">
                {description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/20">
                <Building2 size={16} className="text-muted-foreground" />
                <div>
                  <div className="text-[11px] text-muted-foreground font-medium">Partner Organization</div>
                  <div className="text-xs font-semibold text-foreground">{partnerName}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/20">
                <MapPin size={16} className="text-muted-foreground" />
                <div>
                  <div className="text-[11px] text-muted-foreground font-medium">Country / Region</div>
                  <div className="text-xs font-semibold text-foreground">{countryName}</div>
                </div>
              </div>

              {website && (
                <div className="col-span-2 flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <Globe size={16} className="text-[#02B2FF]" />
                    <div>
                      <div className="text-[11px] text-muted-foreground font-medium">Official Website</div>
                      <a
                        href={website.startsWith("http") ? website : `https://${website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#02B2FF] hover:underline flex items-center gap-1 mt-0.5"
                      >
                        {website}
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Account Section (if present) */}
          {adminObj && (
            <div className="border-t border-border pt-5 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#02B2FF]" />
                Station Admin Contact Account
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar initials={adminObj.fullName?.charAt(0) || "A"} size="md" />
                    <div>
                      <div className="text-sm font-bold text-foreground">{adminObj.fullName || "Admin"}</div>
                      <div className="text-xs text-muted-foreground font-mono">Role: Station Admin</div>
                    </div>
                  </div>
                  <StatusBadge
                    label={!adminObj.isBlocked ? "Active Account" : "Blocked"}
                    variant={sv(!adminObj.isBlocked ? "Active" : "Inactive")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                  {adminObj.email && (
                    <div className="flex items-center gap-2 text-xs text-foreground">
                      <Mail size={13} className="text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{adminObj.email}</span>
                    </div>
                  )}
                  {adminObj.phone && (
                    <div className="flex items-center gap-2 text-xs text-foreground">
                      <Phone size={13} className="text-muted-foreground flex-shrink-0" />
                      <span>{adminObj.phone}</span>
                    </div>
                  )}
                  {adminObj.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono col-span-2">
                      <Calendar size={13} className="text-muted-foreground flex-shrink-0" />
                      <span>Created {formatDate(adminObj.createdAt, timezone)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/20">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-accent rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <ImageLightboxModal
        isOpen={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
        src={lightboxSrc}
        title={name}
      />
    </div>
  );
}
