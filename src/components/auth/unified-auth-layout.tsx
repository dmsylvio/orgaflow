"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: redirectUrl,
      });

      if (result?.ok) {
        toast.success("Login successful!", {
          description: "Redirecting to your dashboard...",
        });

        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            router.push(redirectUrl);
          }, 1500);
        }
      } else {
        toast.error("Login failed", {
          description: "Please check your credentials and try again.",
        });
      }
    } catch (error) {
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (response.ok) {
        toast.success("Account created successfully!", {
          description: "You can now sign in with your credentials.",
        });

        setMode("signin");
        signInForm.setValue("email", data.email);
        signInForm.setValue("password", data.password);
      } else {
        const error = await response.json();
        toast.error("Signup failed", {
          description: error.message || "Please try again.",
        });
      }
    } catch (error) {
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
      <div className="w-full max-w-md">
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
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                onClick={() => signIn("google", { callbackUrl: redirectUrl })}
                className="h-11"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                onClick={() => signIn("github", { callbackUrl: redirectUrl })}
                className="h-11"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>

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
