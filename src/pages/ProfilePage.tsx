import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateVendorProfileApi } from "../api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  subdomain: string;
};

type FormErrors = Partial<Record<keyof ProfileForm, string>>;

export default function ProfilePage() {
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

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!/\S/.test(form.name)) {
      nextErrors.name = "Name is required";
    }

    if (!/\S/.test(form.email)) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!/\S/.test(form.phone)) {
      nextErrors.phone = "Phone is required";
    } else if (!/^\d{10,15}$/.test(form.phone)) {
      nextErrors.phone = "Phone must be 10 to 15 digits";
    }

    if (!/\S/.test(form.subdomain)) {
      nextErrors.subdomain = "Subdomain is required";
    } else if (!/^[a-z0-9-]+$/.test(form.subdomain)) {
      nextErrors.subdomain = "Use lowercase letters, numbers, and hyphens only";
    }

    return nextErrors;
  };

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEdit = () => {
    setIsEditing(true);
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
    const validationErrors = validateForm();
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
        description: "Your profile changes were saved successfully.",
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-800">Profile</h1>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>Edit</Button>
          )}
        </div>
      </div>

      <div className="border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary text-lg font-semibold">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold">{initials || "A"}</span>
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">{form.name}</p>
            <p className="text-sm text-zinc-500">{form.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Vendor ID" value={String(user.vendor_id)} disabled readOnly />
          <Input
            label="Restaurant Name"
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.name}
          />
          <Input
            type="email"
            label="Email"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.email}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.phone}
          />
          <Input
            label="Subdomain"
            value={form.subdomain}
            onChange={(event) => handleChange("subdomain", event.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.subdomain}
          />
          <Input
            label="Razorpay Key"
            value={user.razorpay_key_id || "Not available"}
            disabled
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
