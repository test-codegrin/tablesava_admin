import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateVendorProfileApi } from "../api/authApi";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { Icon, ICONS } from "../config/icons";
import { Button } from "@/components/ui/button";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  subdomain: string;
};

type FormErrors = Partial<Record<keyof ProfileForm, string>>;

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
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          <Input
            label="Vendor ID *"
            value={String(user.vendor_id)}
            disabled
            readOnly
          />
          <Input
            label="Restaurant Name *"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.name}
          />
          <Input
            type="email"
            label="E-Mail *"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.email}
          />
          <Input
            label="Phone *"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.phone}
          />
          <Input
            label="Subdomain *"
            value={form.subdomain}
            onChange={(e) => handleChange("subdomain", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.subdomain}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Icon icon={ICONS.account} width={14} />
              {isSaving ? "Saving..." : "Update"}
            </button>
          </>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition"
          >
            <Icon icon={ICONS.account} width={14} />
            Edit Profile
          </Button>
        )}
      </div>
    </>
  );
}