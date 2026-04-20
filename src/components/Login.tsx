"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { Icon, ICONS } from "../config/icons";

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

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
      const res = await loginApi(formData);
      console.log(res);

      toast.success("Login Successful", {
        description: "Welcome back! Redirecting...",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Login Failed. Please try again.";
      toast.error("Login Failed", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex flex-col items-start px-6 pt-6 pb-3">
          <h2 className="text-xl font-semibold">Welcome Back</h2>
          <p className="text-sm text-muted-foreground">
            Login to your TableSeva account
          </p>
        </CardHeader>

        <CardContent className="px-6 py-5 space-y-4">
          {/* Email */}
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="email" className="text-sm font-medium">
              Admin Email
            </Label>
            <div className="relative flex items-center">
              <Icon
                icon={ICONS.email}
                width={18}
                className="absolute left-3 text-muted-foreground pointer-events-none"
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
              Password
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

          {/* Submit */}
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              "Logging In..."
            ) : (
              <>
                Log In
                <Icon icon={ICONS.arrowRight} width={18} className="ml-2" />
              </>
            )}
          </Button>
        </CardContent>

        <CardFooter className="justify-center px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <span
              className="text-primary cursor-pointer font-medium hover:underline"
              onClick={() => navigate("/register")}
            >
              Create one
            </span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}