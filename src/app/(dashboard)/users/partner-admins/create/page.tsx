"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useCreatePartnerMutation } from "@/features/partner/partnerApi";
import { useGetCountriesQuery } from "@/features/country/countryApi";

const schema = z.object({
  partnerName: z.string().min(1, "Partner name is required"),
  countryId: z.string().min(1, "Country is required"),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  adminFullName: z.string().min(1, "Admin full name is required"),
  adminUsername: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function CreatePartnerAdminPage() {
  const router = useRouter();
  const { data: countriesData, isLoading: countriesLoading } = useGetCountriesQuery();
  const [createPartner, { isLoading }] = useCreatePartnerMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const countries = countriesData?.data || [];

  const onSubmit = async (data: FormData) => {
    try {
      await createPartner({
        partnerName: data.partnerName,
        countryId: data.countryId,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        adminFullName: data.adminFullName,
        adminUsername: data.adminUsername,
        adminPassword: data.adminPassword,
      }).unwrap();

      toast.success("Partner and admin created successfully");
      router.push("/users/partner-admins");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create partner");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/users/partner-admins"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors"
      >
        <ArrowLeft size={13} /> Back to Partner Admins
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Create Partner Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new partner organisation and assign an admin
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Partner Info */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Partner Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Partner Name<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input placeholder="e.g. Capital FM Group" {...register("partnerName")} />
                {errors.partnerName && (
                  <p className="text-xs text-red-500 mt-1">{errors.partnerName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Country<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  {...register("countryId")}
                  disabled={countriesLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
                >
                  <option value="">
                    {countriesLoading ? "Loading..." : "Select Country"}
                  </option>
                  {countries.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {errors.countryId && (
                  <p className="text-xs text-red-500 mt-1">{errors.countryId.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Contact Email
                </label>
                <Input type="email" placeholder="contact@partner.com" {...register("contactEmail")} />
                {errors.contactEmail && (
                  <p className="text-xs text-red-500 mt-1">{errors.contactEmail.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Contact Phone
                </label>
                <Input placeholder="+880 171 234 5678" {...register("contactPhone")} />
              </div>
            </div>
          </div>

          {/* Admin Credentials */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Admin Account
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Admin Full Name<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input placeholder="e.g. Rahim Uddin" {...register("adminFullName")} />
                {errors.adminFullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.adminFullName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Username<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input placeholder="e.g. rahim" {...register("adminUsername")} />
                {errors.adminUsername && (
                  <p className="text-xs text-red-500 mt-1">{errors.adminUsername.message}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Password<span className="text-red-500 ml-0.5">*</span>
              </label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                {...register("adminPassword")}
              />
              {errors.adminPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.adminPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
              {isLoading ? (
                <Loader2 size={15} className="mr-2 animate-spin" />
              ) : (
                <Plus size={15} className="mr-2" />
              )}
              {isLoading ? "Creating..." : "Create Partner Admin"}
            </Button>
            <Link href="/users/partner-admins">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
