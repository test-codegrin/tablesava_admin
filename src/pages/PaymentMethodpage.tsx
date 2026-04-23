import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateRazorpayKeysApi } from "../api/paymentApi";
import { useAuth } from "../context/AuthContext";
import { Icon, ICONS } from "../config/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type RazorpayForm = {
  razorpay_key_id: string;
  razorpay_key_secret: string;
};

type RazorpayFormErrors = Partial<Record<keyof RazorpayForm, string>>;

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
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
        <div className="h-9 w-9 rounded-full bg-[#CC543A]/10 flex items-center justify-center shrink-0">
          <Icon icon={ICONS.payments} width={16} className="text-[#CC543A]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800">Razorpay Integration</p>
          <p className="text-xs text-zinc-400">Connect your Razorpay account to accept payments.</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-4">
        <FormField
          id="razorpay_key_id"
          label="Razorpay Key ID"
          value={form.razorpay_key_id}
          placeholder="rzp_live_XXXXXXXXXXXX"
          onChange={(e) => handleChange("razorpay_key_id", e.target.value)}
          disabled={!isEditing || isSaving}
          error={errors.razorpay_key_id}
        />
        <FormField
          id="razorpay_key_secret"
          label="Secret Key"
          type="password"
          placeholder={isEditing ? "Enter Razorpay secret key" : "••••••••••••••••"}
          value={form.razorpay_key_secret}
          onChange={(e) => handleChange("razorpay_key_secret", e.target.value)}
          disabled={!isEditing || isSaving}
          error={errors.razorpay_key_secret}
        />

        {/* Security notice */}
        <Alert className="bg-amber-50 border-amber-200 py-3 px-4">
          {/* <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" /> */}
          <Icon icon="ic:outline-lock" width="24" height="24" className="text-primary" />
          <AlertDescription className="text-xs text-primary font-medium ml-1">
            Your secret key is encrypted and never shown after saving.
          </AlertDescription>
        </Alert>
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
              className="px-4 h-9 text-sm font-medium text-zinc-700 border-zinc-200 hover:bg-zinc-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 h-9 bg-[#CC543A] hover:bg-[#b84832] text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Icon icon={ICONS.payments} width={14} />
              {isSaving ? "Saving..." : "Update Keys"}
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 h-9 bg-[#CC543A] hover:bg-[#b84832] text-white text-sm font-semibold shadow-sm transition"
          >
            <Icon icon={ICONS.payments} width={14} />
            Edit Razorpay
          </Button>
        )}
      </div>
    </>
  );
}