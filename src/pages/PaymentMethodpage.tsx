import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateRazorpayKeysApi } from "../api/paymentApi";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { Icon, ICONS } from "../config/icons";

type RazorpayForm = {
  razorpay_key_id: string;
  razorpay_key_secret: string;
};

type RazorpayFormErrors = Partial<Record<keyof RazorpayForm, string>>;

export default function PaymentMethodPage() {
  const { user, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<RazorpayFormErrors>({});
  const [form, setForm] = useState<RazorpayForm>({
    razorpay_key_id: "",
    razorpay_key_secret: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      razorpay_key_id: user.razorpay_key_id || "",
      razorpay_key_secret: "",
    });
  }, [user]);

  if (!user) return null;

  const validate = (): RazorpayFormErrors => {
    const e: RazorpayFormErrors = {};
    if (!/\S/.test(form.razorpay_key_id))
      e.razorpay_key_id = "Razorpay key ID is required";
    if (!/\S/.test(form.razorpay_key_secret))
      e.razorpay_key_secret = "Razorpay secret key is required";
    return e;
  };

  const handleChange = (field: keyof RazorpayForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setForm({
      razorpay_key_id: user.razorpay_key_id || "",
      razorpay_key_secret: "",
    });
  };

  const handleSave = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Validation failed", {
        description: "Please enter both Razorpay fields before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateRazorpayKeysApi({
        razorpay_key_id: form.razorpay_key_id.trim(),
        razorpay_key_secret: form.razorpay_key_secret,
      });
      await refreshUser();
      setIsEditing(false);
      setForm((prev) => ({ ...prev, razorpay_key_secret: "" }));
      toast.success("Razorpay updated", {
        description: "Razorpay keys updated successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update Razorpay keys.";
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
            label="Razorpay Key ID"
            value={form.razorpay_key_id}
            onChange={(e) => handleChange("razorpay_key_id", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.razorpay_key_id}
          />
          <Input
            type="password"
            label="Secret Key"
            placeholder="Enter Razorpay secret key"
            value={form.razorpay_key_secret}
            onChange={(e) => handleChange("razorpay_key_secret", e.target.value)}
            disabled={!isEditing || isSaving}
            error={errors.razorpay_key_secret}
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
              <Icon icon={ICONS.payments} width={14} />
              {isSaving ? "Saving..." : "Update Keys"}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition"
          >
            <Icon icon={ICONS.payments} width={14} />
            Edit Razorpay
          </button>
        )}
      </div>
    </>
  );
}