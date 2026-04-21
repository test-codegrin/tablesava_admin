"use client";

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon, ICONS } from "../config/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (field: "email" | "password", value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Missing Fields", {
        description: "Please enter your email and password.",
      });
      return;
    }
    setLoading(true);
    try {
      await login(formData);
      toast.success("Login Successful", {
        description: "Welcome back! Redirecting...",
      });
      const redirectTo =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        "/dashboard";
      setTimeout(() => navigate(redirectTo, { replace: true }), 800);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Login Failed. Please try again.";
      toast.error("Login Failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          <CardHeader className="flex flex-col items-center px-0 pt-0 pb-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center">
              <img
                src="/auth/logo.png"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-[28px] font-semibold text-center leading-tight">
              Good to See You Again
            </h2>
          </CardHeader>

          <CardContent className="px-0 py-0 space-y-3">
            {/* Email */}
            <div className="relative flex items-center">
              <Input
                label="Admin Email"
                id="email"
                placeholder="tableseva@gmail.com"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="py-8"
              />
            </div>

            {/* Password */}
           <div className="relative flex items-center">
  <Input
    label="Password"
    id="password"
    placeholder="Enter password"
    type={showPassword ? "text" : "password"}
    value={formData.password}
    onChange={(e) => handleChange("password", e.target.value)}
    className="py-8"
  />

  <button
    aria-label={showPassword ? "Hide password" : "Show password"}
    title={showPassword ? "Hide password" : "Show password"}
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-2/3 -translate-y-2/3 text-black/50 hover:text-zinc-600 transition-colors"
  >
    <Icon
      icon={showPassword ? ICONS.eyeOn : ICONS.eyeOff}
      width={16}
    />
  </button>
</div>
            {/* Submit */}
            <div className="pt-1">
              <Button
                className="w-full p-8 text-[20px]"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  "Logging In..."
                ) : (
                  <>
                    Log In
                    <Icon icon={ICONS.arrowRight} width={16} />
                  </>
                )}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="justify-center px-0 py-5">
            <p className="text-sm text-black/50">
              Don't have an account?{" "}
              <span
                className="cursor-pointer font-medium text-[#6938EF] hover:underline"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </span>
            </p>
          </CardFooter>
        </div>
      </div>

      {/* Right — image background */}
      <div className="hidden lg:block relative flex-1 overflow-hidden">
        <img
          src="/auth/bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
