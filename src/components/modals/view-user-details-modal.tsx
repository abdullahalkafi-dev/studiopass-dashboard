import { useState } from "react";
import { X, Mail, Phone, MapPin, Building2, Radio, Calendar, ShieldCheck, User as UserIcon } from "lucide-react";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { ImageLightboxModal } from "@/components/modals/image-lightbox-modal";
import { resolveUrl } from "@/lib/utils";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

interface ViewUserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title?: string;
}

export function ViewUserDetailsModal({ isOpen, onClose, data, title }: ViewUserDetailsModalProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const timezone = useTimezone();
  if (!isOpen || !data) return null;

  const fullName = data.fullName || data.name || "User";
  const email = data.email && data.email !== "N/A" ? data.email : null;
  const phone = data.phone && data.phone !== "N/A" ? data.phone : null;
  const roleLabel = data.role ? data.role.replace("_", " ").toUpperCase() : (title || "User Account");
  const avatarUrl = data.avatar ? resolveUrl(data.avatar) : null;
  const countryName = data.countryName || data.country || (typeof data.countryId === "object" ? data.countryId?.name : null);
  const isBlocked = data.isBlocked !== undefined ? data.isBlocked : data.status === "Inactive";
  const createdAt = data.createdAt;

  // Station info (presenter/media station)
  const station = typeof data.station === "object" ? data.station : (typeof data.stationId === "object" ? data.stationId : null);
  const stationLogoUrl = station?.logo ? resolveUrl(station.logo) : null;

  const displayImage = avatarUrl || stationLogoUrl;

  // Partner info
  const partnerName = typeof data.partner === "object" ? data.partner?.name : (typeof data.partnerId === "object" ? data.partnerId?.name : (data.partnerName || null));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Profile Section */}
        <div className="relative bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-4">
            <div
              onClick={() => displayImage && setLightboxSrc(displayImage)}
              className={`w-16 h-16 rounded-2xl border-2 border-white/20 bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-foreground font-bold text-xl shadow-lg ${
                displayImage ? "cursor-pointer hover:scale-105 transition-transform" : ""
              }`}
              title={displayImage ? "Click to zoom avatar" : fullName}
            >
              {displayImage ? (
                <img src={displayImage} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <Avatar initials={fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U"} size="lg" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{fullName}</h2>
                <StatusBadge
                  label={!isBlocked ? "Active" : "Inactive"}
                  variant={sv(!isBlocked ? "Active" : "Inactive")}
                />
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/15 text-white/90 text-[10px] font-semibold tracking-wider uppercase">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Contact Details Card */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <UserIcon size={14} className="text-[#02B2FF]" />
              Contact Information
            </span>

            <div className="space-y-2 bg-muted/20 border border-border p-3.5 rounded-xl">
              <div className="flex items-center gap-3 text-xs text-foreground">
                <Mail size={15} className="text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{email || "No email address registered"}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-foreground">
                <Phone size={15} className="text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{phone || "No phone number registered"}</span>
              </div>

              {countryName && (
                <div className="flex items-center gap-3 text-xs text-foreground">
                  <MapPin size={15} className="text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{countryName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Station / Organization Section */}
          {(station || partnerName) && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Building2 size={14} className="text-[#02B2FF]" />
                Assigned Organization
              </span>

              <div className="bg-muted/20 border border-border p-3.5 rounded-xl space-y-2.5">
                {station && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-border bg-background overflow-hidden flex items-center justify-center font-bold text-xs text-muted-foreground">
                      {stationLogoUrl ? (
                        <img src={stationLogoUrl} alt={station.name} className="w-full h-full object-cover" />
                      ) : (
                        <Radio size={18} className="text-[#02B2FF]" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{station.name}</div>
                      {station.stationCode && (
                        <div className="text-[11px] text-muted-foreground font-mono">Code: {station.stationCode}</div>
                      )}
                    </div>
                  </div>
                )}

                {partnerName && (
                  <div className="flex items-center gap-2 text-xs text-foreground border-t border-border/50 pt-2">
                    <Building2 size={13} className="text-muted-foreground flex-shrink-0" />
                    <span>Partner: <strong className="font-semibold">{partnerName}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Metadata */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#02B2FF]" />
              Account Status & Security
            </span>

            <div className="bg-muted/20 border border-border p-3.5 rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[11px] text-muted-foreground font-medium">Status</div>
                <div className="font-semibold text-foreground mt-0.5">{!isBlocked ? "Active & Verified" : "Deactivated / Blocked"}</div>
              </div>

              <div>
                <div className="text-[11px] text-muted-foreground font-medium">Joined Date</div>
                <div className="font-mono text-foreground mt-0.5">
                  {createdAt ? formatDate(createdAt, timezone) : "—"}
                </div>
              </div>
            </div>
          </div>
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
        title={fullName}
      />
    </div>
  );
}
