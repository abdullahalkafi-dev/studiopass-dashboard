"use client";

import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const schema = z.object({
  partnerName: z.string().min(1, "Partner name is required"),
  country: z.string().min(1, "Country is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone number is required"),
  status: z.string().min(1, "Status is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda", "South Africa", "Ethiopia"];

export default function CreatePartnerAdminPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
    toast.success("Partner admin created successfully");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/users/partner-admins" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Partner Admins
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Create Partner Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new partner organisation to the platform</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Partner Name<span className="text-red-500 ml-0.5">*</span></label>
              <Input placeholder="e.g. Capital FM Group" {...register("partnerName")} />
              {errors.partnerName && <p className="text-xs text-red-500 mt-1">{errors.partnerName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Country<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("country")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Contact Person<span className="text-red-500 ml-0.5">*</span></label>
              <Input placeholder="Full name" {...register("contactPerson")} />
              {errors.contactPerson && <p className="text-xs text-red-500 mt-1">{errors.contactPerson.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address<span className="text-red-500 ml-0.5">*</span></label>
              <Input type="email" placeholder="contact@partner.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number<span className="text-red-500 ml-0.5">*</span></label>
              <Input placeholder="+254 700 000 000" {...register("phone")} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
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

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
              <Plus size={15} className="mr-2" /> Create Partner Admin
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
