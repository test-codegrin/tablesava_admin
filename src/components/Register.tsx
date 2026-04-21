"use client";

import { useState } from "react";
import { registerApi } from "../api/authApi";
import type { RegisterPayload } from "../types/dataTypes";
import { Icon, ICONS } from "../config/icons";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";

const emptyForm: RegisterPayload = {
  name: "",
  subdomain: "",
  email: "",
  password: "",
  razorpay_key_id: "",
  razorpay_key_secret: "",
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterPayload>(emptyForm);

  const handleChange = (field: keyof RegisterPayload, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password ) {
      toast.error("Missing Fields", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi(formData);
      console.log(res);

      toast.success("Account Created", {
        description: "Admin account created successfully! Please sign in.",
      });

      setFormData(emptyForm);

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Registration Failed";
      toast.error("Registration Failed", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <Card className="w-full max-w-lg shadow-xl rounded-2xl">
        {/* Header */}
        <CardHeader className="flex flex-col items-start px-6 pt-6 pb-3">
          <h2 className="text-xl font-semibold">Create Admin Account</h2>
          <p className="text-sm text-muted-foreground">
            Start managing TableSeva today
          </p>
        </CardHeader>

        <CardContent className="px-6 py-5 space-y-4">
          <div className="flex md:flex-row flex-col gap-5">
            {/* Restaurant Name */}
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="name" className="text-sm font-medium">
                Restaurant Name
              </Label>
              <div className="relative flex items-center">
                <Icon
                  icon={ICONS.store}
                  width={18}
                  className="text-muted-foreground absolute left-3 pointer-events-none"
                />
                <Input
                  id="name"
                  placeholder="e.g. TableSeva Centre"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Subdomain */}
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="subdomain" className="text-sm font-medium">
                Subdomain
              </Label>
              <div className="relative flex items-center">
                <Icon
                  icon={ICONS.web}
                  width={18}
                  className="text-muted-foreground absolute left-3 pointer-events-none"
                />
                <Input
                  id="subdomain"
                  placeholder="tableseva.com"
                  value={formData.subdomain}
                  onChange={(e) => handleChange("subdomain", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Admin Email
            </Label>
            <div className="relative flex items-center">
              <Icon
                icon={ICONS.email}
                width={18}
                className="text-muted-foreground absolute left-3 pointer-events-none"
              />
              <Input
                id="email"
                placeholder="tableseva@gmail.com"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="password" className="text-sm font-medium">
              Security Password
            </Label>
            <div className="relative w-full">
              <Icon
                icon={ICONS.lock}
                width={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                id="password"
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="w-full pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                <Icon
                  icon={showPassword ? ICONS.eyeOff : ICONS.eyeOn}
                  width={18}
                />
              </button>
            </div>
          </div>

          {/* Payment Section */}
          <div className="pt-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon icon={ICONS.payments} width={18} />
              Payment Configuration
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="razorpay_key_id" className="text-sm font-medium">
                Razorpay Key ID
              </Label>
              <Input
                id="razorpay_key_id"
                placeholder="rzp_live_..."
                value={formData.razorpay_key_id}
                onChange={(e) =>
                  handleChange("razorpay_key_id", e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="razorpay_key_secret"
                className="text-sm font-medium"
              >
                Razorpay Key Secret
              </Label>
              <Input
                id="razorpay_key_secret"
                placeholder="Enter key secret"
                value={formData.razorpay_key_secret}
                onChange={(e) =>
                  handleChange("razorpay_key_secret", e.target.value)
                }
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              "Creating Account..."
            ) : (
              <>
                Create Admin Account
                <Icon icon={ICONS.arrowRight} width={18} className="ml-2" />
              </>
            )}
          </Button>
        </CardContent>

        <CardFooter className="justify-center px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-primary cursor-pointer font-medium hover:underline"
            >
              Login here
            </span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}