"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  type UnifiedSignInInput,
  type UnifiedSignUpInput,
  unifiedSignInSchema,
  unifiedSignUpSchema,
} from "@/validations/unified-auth.schema";

interface UnifiedAuthLayoutProps {
  defaultMode?: "signin" | "signup";
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function UnifiedAuthLayout({
  defaultMode = "signin",
  onSuccess,
  redirectUrl = "/app",
}: UnifiedAuthLayoutProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const signInForm = useForm<UnifiedSignInInput>({
    resolver: zodResolver(unifiedSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<UnifiedSignUpInput>({
    resolver: zodResolver(unifiedSignUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignIn = async (data: UnifiedSignInInput) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: redirectUrl,
      });

      if (result.error) {
        toast.error("Login failed", {
          description: result.error.message ?? "Please try again.",
        });
        return;
      }

      toast.success("Login successful!", {
        description: "Redirecting to your dashboard...",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push(redirectUrl);
        }, 800);
      }
    } catch (_error) {
      toast.error("An error occurred", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: UnifiedSignUpInput) => {
    setIsLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: redirectUrl,
      });

      if (result.error) {
        toast.error("Signup failed", {
          description: result.error.message ?? "Please try again.",
        });
        return;
      }

      toast.success("Account created successfully!", {
        description: "Redirecting to your dashboard...",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push(redirectUrl);
        }, 800);
      }
    } catch (_error) {
      toast.error("An error occurred", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  };

  const passwordStrength =
    mode === "signup"
      ? getPasswordStrength(signUpForm.watch("password") || "")
      : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center pb-8 pt-8">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription className="text-base">
              {mode === "signin"
                ? "Sign in to your account to continue"
                : "Enter your details to create your account"}
            </CardDescription>
          </CardHeader>

          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as "signin" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 mx-auto max-w-xs">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <CardContent className="px-6 pb-6">
              <TabsContent value="signin" className="mt-0 space-y-4">
                <form
                  onSubmit={signInForm.handleSubmit(handleSignIn)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-email"
                      className="text-sm font-medium"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        className={cn(
                          "pl-10 h-12 transition-colors",
                          signInForm.formState.errors.email &&
                            "border-red-500 focus:ring-red-500",
                        )}
                        {...signInForm.register("email")}
                        aria-invalid={!!signInForm.formState.errors.email}
                        aria-describedby={
                          signInForm.formState.errors.email
                            ? "signin-email-error"
                            : undefined
                        }
                      />
                    </div>
                    {signInForm.formState.errors.email && (
                      <p
                        id="signin-email-error"
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-password"
                      className="text-sm font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={cn(
                          "pl-10 pr-10 h-12 transition-colors",
                          signInForm.formState.errors.password &&
                            "border-red-500 focus:ring-red-500",
                        )}
                        {...signInForm.register("password")}
                        aria-invalid={!!signInForm.formState.errors.password}
                        aria-describedby={
                          signInForm.formState.errors.password
                            ? "signin-password-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {signInForm.formState.errors.password && (
                      <p
                        id="signin-password-error"
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0 space-y-4">
                <form
                  onSubmit={signUpForm.handleSubmit(handleSignUp)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-name"
                      className="text-sm font-medium"
                    >
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        className={cn(
                          "pl-10 h-12 transition-colors",
                          signUpForm.formState.errors.name &&
                            "border-red-500 focus:ring-red-500",
                        )}
                        {...signUpForm.register("name")}
                        aria-invalid={!!signUpForm.formState.errors.name}
                        aria-describedby={
                          signUpForm.formState.errors.name
                            ? "signup-name-error"
                            : undefined
                        }
                      />
                    </div>
                    {signUpForm.formState.errors.name && (
                      <p
                        id="signup-name-error"
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {signUpForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="text-sm font-medium"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className={cn(
                          "pl-10 h-12 transition-colors",
                          signUpForm.formState.errors.email &&
                            "border-red-500 focus:ring-red-500",
                        )}
                        {...signUpForm.register("email")}
                        aria-invalid={!!signUpForm.formState.errors.email}
                        aria-describedby={
                          signUpForm.formState.errors.email
                            ? "signup-email-error"
                            : undefined
                        }
                      />
                    </div>
                    {signUpForm.formState.errors.email && (
                      <p
                        id="signup-email-error"
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-sm font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className={cn(
                          "pl-10 pr-10 h-12 transition-colors",
                          signUpForm.formState.errors.password &&
                            "border-red-500 focus:ring-red-500",
                        )}
                        {...signUpForm.register("password")}
                        aria-invalid={!!signUpForm.formState.errors.password}
                        aria-describedby={
                          signUpForm.formState.errors.password
                            ? "signup-password-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {signUpForm.formState.errors.password && (
                      <p
                        id="signup-password-error"
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {signUpForm.formState.errors.password.message}
                      </p>
                    )}

                    {signUpForm.watch("password") && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-colors",
                                level <= passwordStrength
                                  ? level <= 2
                                    ? "bg-red-500"
                                    : level <= 3
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  : "bg-gray-200",
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {passwordStrength <= 2 && "Weak password"}
                          {passwordStrength === 3 && "Fair password"}
                          {passwordStrength >= 4 && "Strong password"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-confirm-password"
                      className="text-sm font-medium"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className={cn(
                          "pl-10 pr-10 h-12 transition-colors",
                          signUpForm.formState.errors.confirmPassword &&
                            "border-red-500 focus:ring-red-500",
                        )}
                        {...signUpForm.register("confirmPassword")}
                        aria-invalid={
                          !!signUpForm.formState.errors.confirmPassword
                        }
                        aria-describedby={
                          signUpForm.formState.errors.confirmPassword
                            ? "signup-confirm-password-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {signUpForm.formState.errors.confirmPassword && (
                      <p
                        id="signup-confirm-password-error"
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {signUpForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>

          <CardFooter className="flex flex-col space-y-4 pb-8 pt-0 px-6">
            <p className="text-center text-sm text-gray-600">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
