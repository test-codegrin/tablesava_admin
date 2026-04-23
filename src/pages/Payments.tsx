import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getVendorProfile, updateRazorpayCredentials } from "@/services/vendorService";

export default function Payments() {
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCurrentKeyId = async () => {
    setLoading(true);
    try {
      const profile = await getVendorProfile();
      setKeyId(profile.razorpay_key_id || "");
    } catch (error) {
      toast.error("Unable to load Razorpay configuration", {
        description: parseApiError(error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCurrentKeyId();
  }, []);

  const onSubmit = async () => {
    if (!keyId.trim() || !keySecret.trim()) {
      toast.error("Validation failed", {
        description: "Both Razorpay key ID and key secret are required.",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await updateRazorpayCredentials({
        razorpay_key_id: keyId,
        razorpay_key_secret: keySecret,
      });
      toast.success("Razorpay keys updated", { description: response.message });
      setKeySecret("");
      await loadCurrentKeyId();
    } catch (error) {
      toast.error("Unable to update Razorpay keys", {
        description: parseApiError(error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4 border border-zinc-200 bg-white p-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Razorpay Key Setup</h1>
        <p className="mt-1 text-sm text-zinc-500">
          This Admin-only page updates `POST /vendor/update-razorpay`.
        </p>
      </div>

      <Input
        label="Razorpay Key ID"
        value={keyId}
        onChange={(event) => setKeyId(event.target.value)}
        disabled={loading || saving}
      />
      <Input
        label="Razorpay Key Secret"
        type="password"
        value={keySecret}
        onChange={(event) => setKeySecret(event.target.value)}
        disabled={loading || saving}
      />

      <div className="flex gap-2">
        <Button type="button" onClick={() => void onSubmit()} disabled={loading || saving}>
          {saving ? "Saving..." : "Update Razorpay Keys"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void loadCurrentKeyId();
          }}
          disabled={loading || saving}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}

