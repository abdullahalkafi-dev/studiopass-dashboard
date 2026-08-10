"use client";

import { useState } from "react";
import { X, User, CreditCard, FileText, Radio, ShieldAlert, CheckCircle, AlertCircle, Edit2, Loader2, Clock, MapPin, Calendar, Building2 } from "lucide-react";
import { useUpdateUserMutation, useDeactivateUserMutation, useReactivateUserMutation } from "@/features/user/userApi";
import { useAppSelector } from "@/store/hooks";
import { Avatar } from "@/components/shared/section-header";
import { toast } from "sonner";

interface EntityDetailsModalProps {
  entity: any | null;
  onClose: () => void;
}

export function EntityDetailsModal({ entity, onClose }: EntityDetailsModalProps) {
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const isCustomerCare = currentRole === "customer_care";

  if (!entity) return null;

  const entityType =
    entity.entityType ||
    (entity.ticket ? "statement" : entity.paymentReference ? "transaction" : entity.code ? "station" : "user");

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(entity.fullName || entity.name || "");
  const [email, setEmail] = useState(entity.email || "");
  const [phone, setPhone] = useState(entity.phone || "");

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deactivateUser, { isLoading: isDeactivating }] = useDeactivateUserMutation();
  const [reactivateUser, { isLoading: isReactivating }] = useReactivateUserMutation();

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCustomerCare) return;
    try {
      const res = await updateUser({
        id: entity._id || entity.id,
        fullName,
        email: email || undefined,
        phone: phone || undefined,
      });

      if ("error" in res) {
        toast.error("Failed to update user details");
        return;
      }
      toast.success("User profile updated successfully");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update user profile");
    }
  };

  const handleToggleStatus = async () => {
    if (isCustomerCare) return;
    const userId = entity._id || entity.id;
    try {
      if (entity.isBlocked) {
        await reactivateUser(userId).unwrap();
        toast.success("User reactivated");
      } else {
        await deactivateUser(userId).unwrap();
        toast.success("User blocked/deactivated");
      }
      onClose();
    } catch {
      toast.error("Failed to change user status");
    }
  };

  const formatDate = (dateVal?: string | Date) => {
    if (!dateVal) return "N/A";
    return new Date(dateVal).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getAvatar = () => {
    return entity.avatar || entity.user?.avatar;
  };

  const getCountryName = () => {
    if (entity.countryName) return entity.countryName;
    if (typeof entity.countryId === "object" && entity.countryId?.name) return entity.countryId.name;
    if (typeof entity.country === "object" && entity.country?.name) return entity.country.name;
    if (typeof entity.user === "object" && entity.user) {
      if (entity.user.countryName) return entity.user.countryName;
      if (typeof entity.user.countryId === "object" && entity.user.countryId?.name) return entity.user.countryId.name;
    }
    return "N/A";
  };

  const getTimezone = () => {
    if (entity.timezone) return entity.timezone;
    if (typeof entity.countryId === "object" && entity.countryId?.timezone) return entity.countryId.timezone;
    if (typeof entity.country === "object" && entity.country?.timezone) return entity.country.timezone;
    if (typeof entity.user === "object" && entity.user) {
      if (entity.user.timezone) return entity.user.timezone;
      if (typeof entity.user.countryId === "object" && entity.user.countryId?.timezone) return entity.user.countryId.timezone;
    }
    return "N/A";
  };

  const getMemberSince = () => {
    const dateVal = entity.createdAt || entity.user?.createdAt;
    if (!dateVal) return "N/A";
    return formatDate(dateVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            {entityType === "user" && <User size={20} className="text-[#02B2FF]" />}
            {entityType === "transaction" && <CreditCard size={20} className="text-emerald-500" />}
            {entityType === "statement" && <FileText size={20} className="text-amber-500" />}
            {entityType === "station" && <Radio size={20} className="text-purple-500" />}
            <span className="font-bold text-foreground capitalize">
              {entityType === "user" ? "User Profile Details" : `${entityType} Details`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* USER ENTITY */}
          {entityType === "user" && (
            <div>
              {!isCustomerCare && isEditing ? (
                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#02B2FF]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#02B2FF]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#02B2FF]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border border-input hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#02B2FF] text-white hover:bg-[#02B2FF]/90 flex items-center gap-2"
                    >
                      {isUpdating && <Loader2 size={14} className="animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={getAvatar()}
                        initials={(entity.fullName || entity.email || "U")[0]}
                        size="md"
                      />
                      <div>
                        <p className="font-bold text-foreground text-sm">{entity.fullName || "N/A"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{entity.role || "user"}</p>
                      </div>
                    </div>
                    {!isCustomerCare && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin size={12} /> Country
                      </span>
                      <span className="font-semibold text-foreground">
                        {getCountryName()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Clock size={12} /> Timezone
                      </span>
                      <span className="font-semibold text-foreground">
                        {getTimezone()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-xs text-muted-foreground block mb-1">Email</span>
                      <span className="font-semibold text-foreground truncate block">{entity.email || "N/A"}</span>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-xs text-muted-foreground block mb-1">Phone</span>
                      <span className="font-semibold text-foreground">{entity.phone || "N/A"}</span>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Calendar size={12} /> Member Since
                      </span>
                      <span className="font-medium text-xs text-foreground">{getMemberSince()}</span>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-xs text-muted-foreground block mb-1">Account Status</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          entity.isBlocked ? "text-rose-500" : "text-emerald-500"
                        }`}
                      >
                        {entity.isBlocked ? <AlertCircle size={13} /> : <CheckCircle size={13} />}
                        {entity.isBlocked ? "Blocked / Inactive" : "Active"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card col-span-2">
                      <span className="text-xs text-muted-foreground block mb-1">Account ID</span>
                      <span className="font-mono text-xs text-foreground truncate block">{entity._id || entity.id}</span>
                    </div>
                  </div>

                  {!isCustomerCare && (
                    <div className="pt-2">
                      <button
                        onClick={handleToggleStatus}
                        disabled={isDeactivating || isReactivating}
                        className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                          entity.isBlocked
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                            : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                        }`}
                      >
                        {isDeactivating || isReactivating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ShieldAlert size={14} />
                        )}
                        {entity.isBlocked ? "Reactivate User Account" : "Block User Account"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TRANSACTION ENTITY */}
          {entityType === "transaction" && (
            <div className="space-y-3 text-sm">
              <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 font-medium text-xs">
                Transaction Record Details
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Transaction ID</span>
                  <span className="font-mono text-xs font-semibold text-foreground truncate block">{entity._id || entity.id}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Amount</span>
                  <span className="font-bold text-foreground">{entity.amount} {entity.currency || "Credits"}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Payment Provider</span>
                  <span className="font-semibold text-foreground capitalize">{entity.paymentProvider || "Mobile Money"}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Payment Reference</span>
                  <span className="font-mono text-xs text-foreground truncate block">{entity.paymentReference || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin size={12} /> Country
                  </span>
                  <span className="font-semibold text-foreground">{getCountryName()}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Calendar size={12} /> Date
                  </span>
                  <span className="font-medium text-xs text-foreground">{formatDate(entity.createdAt)}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card col-span-2">
                  <span className="text-xs text-muted-foreground block mb-1">Associated User</span>
                  <span className="font-semibold text-foreground">{entity.user?.fullName || entity.user?.phone || entity.user || "N/A"}</span>
                </div>
              </div>
            </div>
          )}

          {/* STATEMENT ENTITY */}
          {entityType === "statement" && (
            <div className="space-y-3 text-sm">
              <div className="p-3.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 font-medium text-xs">
                Listener Statement Record
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Ticket Code</span>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{entity.ticket}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">MSISDN / Phone</span>
                  <span className="font-semibold text-foreground">{entity.msisdn || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Interaction Type</span>
                  <span className="font-semibold text-foreground capitalize">{entity.type || "Call/Message"}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Station Ref</span>
                  <span className="font-semibold text-foreground">{entity.stationRef || entity.station?.name || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin size={12} /> Country
                  </span>
                  <span className="font-semibold text-foreground">{getCountryName()}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Calendar size={12} /> Created At
                  </span>
                  <span className="font-medium text-xs text-foreground">{formatDate(entity.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STATION ENTITY */}
          {entityType === "station" && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Station Name</span>
                  <span className="font-bold text-foreground">{entity.name}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Station Code</span>
                  <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">{entity.code}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Building2 size={12} /> Category
                  </span>
                  <span className="font-semibold text-foreground capitalize">{entity.type || "Radio"}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin size={12} /> Country
                  </span>
                  <span className="font-semibold text-foreground">{getCountryName()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
