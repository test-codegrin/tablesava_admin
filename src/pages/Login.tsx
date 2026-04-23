"use client";

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon, ICONS } from "../config/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { parseApiError } from "@/api/apiClient";

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
      const message = parseApiError(error).message;
      toast.error("Login Failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-md py-3 lg:py-6 space-y-6">
          <CardHeader className="flex flex-col items-center pb-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center">
              <img
                src="/auth/logo.png"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-xl  font-semibold text-center leading-tight">
              Good to See You Again
            </h2>
          </CardHeader>

          <CardContent className="px-0 py-0 space-y-4 lg:space-y-6">
            {/* Email */}
            <div className="relative flex items-center">
              <Input
                label="Admin Email"
                id="email"
                placeholder="tableseva@gmail.com"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
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
              />

              <Button
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2/3 -translate-y-2/3 text-black/50 hover:text-zinc-600"
              >
                <Icon
                  icon={showPassword ? ICONS.eyeOn : ICONS.eyeOff}
                  width={16}
                />
              </Button>
            </div>
            {/* Submit */}
            <div className="pt-1">
              <Button
                variant="primary"
                className="w-full"
                size={"lg"}
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

          <CardFooter className="justify-center">
            <p className="text-sm text-black/50">
              Don't have an account?{" "}
              <Button
                variant={"link"}
                className="px-0"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </Button>
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
