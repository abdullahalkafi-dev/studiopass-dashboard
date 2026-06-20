"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const schema = z.object({
  stationName: z.string().min(1, "Station name is required"),
  stationType: z.string().min(1, "Station type is required"),
  country: z.string().min(1, "Country is required"),
  partner: z.string().min(1, "Partner is required"),
  stationCode: z.string().min(1, "Station code is required"),
  status: z.string().min(1, "Status is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda", "South Africa", "Ethiopia"];
const PARTNERS = ["Capital FM Group", "Radio Uganda Ltd", "Joy Media Ghana", "Tanzania Media Corp", "Peace FM Group"];
const TYPES = ["Radio", "TV", "Channel"];

export default function CreateStationPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
    toast.success("Station created successfully");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Create Station</h1>
        <p className="text-sm text-muted-foreground mt-1">Register a new station on the platform</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Station Name<span className="text-red-500 ml-0.5">*</span></label>
              <Input placeholder="e.g. Capital FM" {...register("stationName")} />
              {errors.stationName && <p className="text-xs text-red-500 mt-1">{errors.stationName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Station Type<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("stationType")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Type</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.stationType && <p className="text-xs text-red-500 mt-1">{errors.stationType.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Country</label>
              <select {...register("country")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Partner<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("partner")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Partner</option>
                {PARTNERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.partner && <p className="text-xs text-red-500 mt-1">{errors.partner.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Station Code<span className="text-red-500 ml-0.5">*</span></label>
              <Input placeholder="e.g. CAP-FM-KE" {...register("stationCode")} />
              {errors.stationCode && <p className="text-xs text-red-500 mt-1">{errors.stationCode.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Status</label>
              <select {...register("status")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Login Credentials</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Username<span className="text-red-500 ml-0.5">*</span></label>
                <Input placeholder="e.g. john.doe" {...register("username")} />
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Password<span className="text-red-500 ml-0.5">*</span></label>
                <Input type="password" placeholder="Min 8 characters" {...register("password")} />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Station Logo</label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-[#02B2FF]/50 transition-colors cursor-pointer">
              <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-semibold text-foreground">Click to upload logo</p>
              <p className="text-xs text-muted-foreground mt-0.5">PNG, SVG up to 2MB</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
              <Plus size={15} className="mr-2" /> Create Station
            </Button>
            <Link href="/">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
