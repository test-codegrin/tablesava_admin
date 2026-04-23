import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateVendorProfileApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { Icon, ICONS } from "../config/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  subdomain: string;
};

type FormErrors = Partial<Record<keyof ProfileForm, string>>;

function FormField({
  label,
  id,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </Label>
      <Input
        id={id}
        {...props}
        className={cn(
          "h-10 border border-zinc-200 bg-zinc-50 text-sm text-zinc-800 px-3 placeholder:text-zinc-300 focus-visible:ring-1 focus-visible:ring-[#CC543A] focus-visible:border-[#CC543A] disabled:opacity-60 disabled:cursor-not-allowed transition",
          error && "border-red-400 focus-visible:ring-red-400"
        )}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export default function AccountDetailsPage() {
  const { user, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    subdomain: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      subdomain: user.subdomain,
    });
  }, [user]);

  if (!user) return null;

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!/\S/.test(form.name)) e.name = "Name is required";
    if (!/\S/.test(form.email)) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!/\S/.test(form.phone)) e.phone = "Phone is required";
    else if (!/^\d{10,15}$/.test(form.phone))
      e.phone = "Phone must be 10–15 digits";
    if (!/\S/.test(form.subdomain)) e.subdomain = "Subdomain is required";
    else if (!/^[a-z0-9-]+$/.test(form.subdomain))
      e.subdomain = "Lowercase letters, numbers, hyphens only";
    return e;
  };

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      subdomain: user.subdomain,
    });
  };

  const handleSave = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Validation failed", {
        description: "Please fix highlighted fields before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateVendorProfileApi({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subdomain: form.subdomain,
      });
      await refreshUser();
      setIsEditing(false);
      toast.success("Profile updated", {
        description: "Your changes were saved successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update profile.";
      toast.error("Update failed", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
        <div className="h-9 w-9 rounded-full bg-[#CC543A]/10 flex items-center justify-center shrink-0">
          <Icon icon={ICONS.account} width={16} className="text-[#CC543A]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800">Profile Details</p>
          <p className="text-xs text-zinc-400">Keep your account information polished and up to date.</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <FormField
            id="vendor_id"
            label="Vendor ID"
            value={String(user.vendor_id)}
            disabled
            readOnly
          />
          <FormField
            id="name"
            label="Restaurant Name *"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.name}
            placeholder="Your restaurant name"
          />
          <FormField
            id="email"
            label="E-Mail *"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.email}
            placeholder="you@example.com"
          />
          <FormField
            id="phone"
            label="Phone *"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.phone}
            placeholder="9876543210"
          />
          {/* Subdomain full width */}
          <FormField
            id="subdomain"
            label="Subdomain *"
            value={form.subdomain}
            onChange={(e) => handleChange("subdomain", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.subdomain}
            placeholder="your-kitchen"
            className="col-span-2"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <Separator className="bg-zinc-100" />
      <div className="px-6 py-4 flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 h-9 text-sm font-medium text-zinc-700 border-zinc-200 hover:bg-zinc-50 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 h-9 bg-[#CC543A] hover:bg-[#b84832] text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Icon icon={ICONS.account} width={14} />
              {isSaving ? "Saving..." : "Update Profile"}
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 h-9 bg-[#CC543A] hover:bg-[#b84832] text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Icon icon={ICONS.account} width={14} />
            Edit Profile
          </Button>
        )}
      </div>
    </>
  );
}