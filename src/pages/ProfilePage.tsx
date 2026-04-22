import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateVendorProfileApi } from "../api/authApi";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { Icon, ICONS } from "../config/icons";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  subdomain: string;
};

type FormErrors = Partial<Record<keyof ProfileForm, string>>;

const tabs = [
  { key: "account", label: "Account Details", icon: ICONS.account },
  { key: "payment", label: "Payment Methods", icon: ICONS.payments },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
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

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const validateForm = (): FormErrors => {
    const e: FormErrors = {};
    if (!/\S/.test(form.name)) e.name = "Name is required";
    if (!/\S/.test(form.email)) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!/\S/.test(form.phone)) e.phone = "Phone is required";
    else if (!/^\d{10,15}$/.test(form.phone)) e.phone = "Phone must be 10–15 digits";
    if (!/\S/.test(form.subdomain)) e.subdomain = "Subdomain is required";
    else if (!/^[a-z0-9-]+$/.test(form.subdomain)) e.subdomain = "Lowercase letters, numbers, hyphens only";
    return e;
  };

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setForm({ name: user.name, email: user.email, phone: user.phone, subdomain: user.subdomain });
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Validation failed", { description: "Please fix highlighted fields before saving." });
      return;
    }
    setIsSaving(true);
    try {
      await updateVendorProfileApi({ name: form.name, email: form.email, phone: form.phone, subdomain: form.subdomain });
      await refreshUser();
      setIsEditing(false);
      toast.success("Profile updated", { description: "Your changes were saved successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update profile.";
      toast.error("Update failed", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-800">Profile</h1>
        {isEditing ? (
          <div key="edit-actions" className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : (
          <div key="view-actions" className="flex gap-2">
            <Button onClick={handleEdit}>Edit</Button>
          </div>
        )}
      </div>

        {/* ── Left panel ── */}
        <div className="w-58 shrink-0 border-r border-zinc-100 flex flex-col">

          {/* Avatar */}
          <div className="flex flex-col items-center px-4 pt-8 pb-6 border-b border-zinc-100">
            <div className="relative group cursor-pointer">
              <div className="h-24 w-24  overflow-hidden bg-zinc-100 flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-zinc-400">{initials || "A"}</span>
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                <Icon icon={ICONS.account} width={18} className="text-white" />
                <span className="text-[10px] text-white font-medium text-center leading-tight px-1">
                  Click to change photo
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-800 text-center truncate w-full">{user.name}</p>
            <p className="text-xs text-zinc-400 text-center truncate w-full">{user.email}</p>
          </div>

          {/* Tabs */}
          <nav className="flex flex-col py-3 px-2 gap-0.5 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition text-left w-full ${
                  activeTab === tab.key
                    ? "border-l-4 border-primary bg-primary/5 text-primary"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                <Icon icon={tab.icon} width={16} className="shrink-0" />
                <span className="leading-tight">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-800">
              {tabs.find((t) => t.key === activeTab)?.label}
            </h2>
            <button
              type="button"
              onClick={() => {}}
              title="More options"
              className="flex h-7 w-7 items-center justify-center hover:bg-zinc-100 text-zinc-400 transition"
            >
              <Icon icon={ICONS.chevronRight} width={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {activeTab === "account" && (
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
            )}

            {activeTab === "payment" && (
              <div className="space-y-4">
                <Input
                  label="Razorpay Key ID"
                  value={user.razorpay_key_id || "Not available"}
                  disabled
                  readOnly
                />
              </div>
            )}
          </div>

          {/* Footer actions */}
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
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition disabled:opacity-50"
                >
                  <Icon icon={ICONS.account} width={14} />
                  {isSaving ? "Saving..." : "Update"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition"
              >
                <Icon icon={ICONS.account} width={14} />
                Edit Profile
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}