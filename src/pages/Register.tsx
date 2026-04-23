"use client";

import { useState } from "react";
import { registerApi } from "../api/authApi";
import type { RegisterPayload } from "../types/dataTypes";
import { Icon, ICONS } from "../config/icons";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { parseApiError } from "@/api/apiClient";

const emptyForm: RegisterPayload = {
  name: "",
  subdomain: "",
  email: "",
  password: "",
  phone: "",
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
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Missing Fields", { description: "Please fill in all required fields." });
      return;
    }
    setLoading(true);
    try {
      const response = await registerApi(formData);
      toast.success("Account Created", {
        description:
          response.message || "Admin account created successfully! Please sign in.",
      });
      setFormData(emptyForm);
      setTimeout(() => navigate("/login"), 1000);
    } catch (error: unknown) {
      const message = isAxiosError(error)
        ? parseApiError(error).message
        : "Registration Failed";
      toast.error("Registration Failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Left — blob background image */}
      <div className="hidden lg:block relative flex-1 overflow-hidden">
        <img src="/auth/bg.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 overflow-y-auto">
        <div className="w-full max-w-md py-3 lg:py-6">

          <CardHeader className="flex flex-col items-center px-0 pt-0 pb-3 lg:pb-6">
            <div className="mb-2 lg:mb-3 flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center">
              <img src="/auth/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-xl lg:text-[28px] font-semibold text-center leading-tight">
              Create Admin Account
            </h2>
          </CardHeader>

          <CardContent className="space-y-4 lg:space-y-6">

            {/* Restaurant Name */}
            <Input
              label="Restaurant Name"
              id="name"
              placeholder="e.g. TableSeva Centre"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />

            {/* Subdomain */}
            <Input
              label="Subdomain"
              id="subdomain"
              placeholder="tableseva.com"
              value={formData.subdomain}
              onChange={(e) => handleChange("subdomain", e.target.value)}
            />

            {/* Email */}
            <Input
              label="Admin Email"
              id="email"
              placeholder="tableseva@gmail.com"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            {/* Phone */}
            <Input
              label="Phone Number"
              id="phone"
              placeholder="123-456-7890"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Password"
                id="password"
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
              <Button
                title={showPassword ? "Hide password" : "Show password"}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2/3 -translate-y-2/3 text-black/50 hover:text-zinc-600"
              >
                <Icon icon={showPassword ? ICONS.eyeOn : ICONS.eyeOff} width={16} />
              </Button>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating Account..." : (
                  <>
                    Create Admin Account
                    <Icon icon={ICONS.arrowRight} width={16} />
                  </>
                )}
              </Button>
            </div>

          </CardContent>

          <CardFooter className="justify-center px-0 py-3 lg:py-5">
            <p className="text-sm text-black/50">
              Already have an account?{" "}
              <Button
                variant={"link"}
                onClick={() => navigate("/login")}
                className="px-0"
              >
                Login here
              </Button>
            </p>
          </CardFooter>

        </div>
      </div>

    </div>
  );
}
