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
      await registerApi(formData);
      toast.success("Account Created", { description: "Admin account created successfully! Please sign in." });
      setFormData(emptyForm);
      setTimeout(() => navigate("/login"), 1000);
    } catch (error: unknown) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || "Registration Failed"
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
        <div className="w-full max-w-xl py-3 lg:py-6">

          <CardHeader className="flex flex-col items-center px-0 pt-0 pb-3 lg:pb-6">
            <div className="mb-2 lg:mb-3 flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center">
              <img src="/auth/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-xl lg:text-[28px] font-semibold text-center leading-tight">
              Create Admin Account
            </h2>
          </CardHeader>

          <CardContent className="px-0 py-0 space-y-2 lg:space-y-3">

            {/* Restaurant Name */}
            <Input
              label="Restaurant Name"
              id="name"
              placeholder="e.g. TableSeva Centre"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="py-4 lg:py-8"
            />

            {/* Subdomain */}
            <Input
              label="Subdomain"
              id="subdomain"
              placeholder="tableseva.com"
              value={formData.subdomain}
              onChange={(e) => handleChange("subdomain", e.target.value)}
              className="py-4 lg:py-8"
            />

            {/* Email */}
            <Input
              label="Admin Email"
              id="email"
              placeholder="tableseva@gmail.com"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="py-4 lg:py-8"
            />
             {/* Email */}
            <Input
              label="Phone Number"
              id="phone"
              placeholder="123-456-7890"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="py-4 lg:py-8"
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
                className="py-4 lg:py-8"
              />
              <button
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2/3 -translate-y-2/3 text-black/50 hover:text-zinc-600 transition-colors"
              >
                <Icon icon={showPassword ? ICONS.eyeOn : ICONS.eyeOff} width={16} />
              </button>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                className="w-full p-5 text-base lg:p-8 lg:text-[20px]"
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
            <p className="text-sm lg:text-[16px] text-black/50">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="cursor-pointer font-medium text-[#6938EF] hover:underline"
              >
                Login here
              </span>
            </p>
          </CardFooter>

        </div>
      </div>

    </div>
  );
}
