"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeIconButton } from "@/components/ui/theme-icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MathCaptcha } from "@/components/ui/math-captcha";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AUTH_COOKIE_ROLE, AUTH_COOKIE_TOKEN, getRoleHome, normalizeRole, type UserRole } from "@/lib/auth";
import { validateEmail } from "@/lib/email-validator";
import { cn } from "@/lib/utils";

type LoginResponse = {
  token?: string;
  access_token?: string;
  role?: string;
  user?: { role?: string; name?: string };
  message?: string;
};

type ForgotPasswordStep = "send" | "verify" | "reset" | "success";
type EmailCheckStatus = "idle" | "checking" | "valid" | "invalid";

const userTypes = [
  { id: "student" as UserRole, label: "Student", icon: Users },
  { id: "faculty" as UserRole, label: "Faculty", icon: Building2 },
  { id: "admin" as UserRole, label: "Admin", icon: ShieldCheck },
] as const;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [switchingRole, setSwitchingRole] = useState<UserRole | null>(null);

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotPasswordStep>("send");
  const [forgotTargetEmail, setForgotTargetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [forgotFieldError, setForgotFieldError] = useState<string | null>(null);
  const [passwordFieldError, setPasswordFieldError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotCaptchaVerified, setForgotCaptchaVerified] = useState(false);
  const [showForgotCaptcha, setShowForgotCaptcha] = useState(false);

  const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>("idle");
  const [emailError, setEmailError] = useState("");
  const [emailCheckMessage, setEmailCheckMessage] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const normalizedEmail = email.trim().toLowerCase();
  const forgotPasswordReady = emailCheckStatus === "valid" && Boolean(normalizedEmail);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!apiBaseUrl) {
      return;
    }

    if (!normalizedEmail) {
      setEmailCheckStatus("idle");
      setEmailError("");
      setEmailCheckMessage("");
      return;
    }

    const validation = validateEmail(normalizedEmail);
    if (!validation.valid) {
      setEmailCheckStatus("invalid");
      setEmailCheckMessage("");
      setEmailError(emailTouched ? validation.error ?? "Invalid email address." : "");
      return;
    }

    setEmailCheckStatus("checking");
    setEmailError("");
    setEmailCheckMessage("");

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/forgot-password/check-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: normalizedEmail }),
          signal: controller.signal,
        });

        const data = (await response.json().catch(() => ({}))) as { message?: string; email?: string };

        if (!response.ok) {
          setEmailCheckStatus("invalid");
          setEmailCheckMessage("");
          setEmailError(emailTouched ? data.message ?? "No email address found." : "");
          return;
        }

        setEmailCheckStatus("valid");
        setEmailError("");
        setEmailCheckMessage(data.email ? `Account found: ${data.email}` : "Email address found.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setEmailCheckStatus("invalid");
        setEmailCheckMessage("");
        setEmailError(emailTouched ? "Unable to verify the email address right now." : "");
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [apiBaseUrl, emailTouched, normalizedEmail]);

  const resetForgotPasswordFlow = () => {
    setForgotPasswordOpen(false);
    setForgotStep("send");
    setForgotTargetEmail("");
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setForgotStatus(null);
    setForgotFieldError(null);
    setPasswordFieldError(null);
    setIsSendingCode(false);
    setIsVerifyingCode(false);
    setIsResettingPassword(false);
    setResendCooldown(0);
    setForgotCaptchaVerified(false);
    setShowForgotCaptcha(false);
  };

  const sendResetCode = async (targetEmail: string, options?: { resend?: boolean }) => {
    if (!apiBaseUrl) {
      toast.error("Missing NEXT_PUBLIC_API_BASE_URL in env.");
      return false;
    }

    setForgotFieldError(null);
    setForgotStatus(null);
    setIsSendingCode(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string; email?: string };

      if (!response.ok) {
        setForgotStatus({
          type: "error",
          message: data.message ?? "Failed to send verification code.",
        });
        return false;
      }

      setForgotTargetEmail(data.email ?? targetEmail);
      setForgotStep("verify");
      setVerificationCode("");
      setResendCooldown(30);
      setForgotStatus({
        type: "success",
        message: options?.resend ? "A new verification code has been sent." : data.message ?? "Verification code sent successfully.",
      });
      return true;
    } catch {
      setForgotStatus({
        type: "error",
        message: "Cannot connect to backend API.",
      });
      return false;
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleOpenForgotPassword = async () => {
    setEmailTouched(true);

    if (!apiBaseUrl) {
      toast.error("Missing NEXT_PUBLIC_API_BASE_URL in env.");
      return;
    }

    if (!normalizedEmail) {
      setEmailCheckStatus("invalid");
      setEmailError("Enter your email address first.");
      return;
    }

    const validation = validateEmail(normalizedEmail);
    if (!validation.valid) {
      setEmailCheckStatus("invalid");
      setEmailError(validation.error ?? "Invalid email address.");
      return;
    }

    let verified = forgotPasswordReady;

    if (!verified) {
      setEmailCheckStatus("checking");
      setEmailError("");
      setEmailCheckMessage("");

      try {
        const response = await fetch(`${apiBaseUrl}/auth/forgot-password/check-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: normalizedEmail }),
        });

        const data = (await response.json().catch(() => ({}))) as { message?: string; email?: string };

        if (!response.ok) {
          setEmailCheckStatus("invalid");
          setEmailCheckMessage("");
          setEmailError(data.message ?? "No email address found.");
          return;
        }

        setEmailCheckStatus("valid");
        setEmailError("");
        setEmailCheckMessage(data.email ? `Account found: ${data.email}` : "Email address found.");
        verified = true;
      } catch {
        setEmailCheckStatus("invalid");
        setEmailError("Unable to verify the email address right now.");
        return;
      }
    }

    if (!verified) return;

    setForgotTargetEmail(normalizedEmail);
    setForgotStep("send");
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowForgotCaptcha(false);
    setForgotCaptchaVerified(false);
    setForgotFieldError(null);
    setPasswordFieldError(null);
    setForgotStatus(null);
    setForgotPasswordOpen(true);
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendResetCode(forgotTargetEmail);
  };

  const handleVerifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      toast.error("Missing NEXT_PUBLIC_API_BASE_URL in env.");
      return;
    }

    if (verificationCode.trim().length !== 6) {
      setForgotFieldError("Enter the 6-digit code sent to your email.");
      return;
    }

    setForgotFieldError(null);
    setForgotStatus(null);
    setIsVerifyingCode(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: forgotTargetEmail, code: verificationCode.trim() }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setForgotFieldError(data.message ?? "Invalid verification code.");
        return;
      }

      setForgotStep("reset");
      setForgotStatus({
        type: "success",
        message: data.message ?? "Code verified successfully.",
      });
    } catch {
      setForgotFieldError("Cannot connect to backend API.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      toast.error("Missing NEXT_PUBLIC_API_BASE_URL in env.");
      return;
    }

    if (newPassword.trim().length < 8) {
      setPasswordFieldError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFieldError("Passwords do not match.");
      return;
    }

    if (!showForgotCaptcha) {
      setShowForgotCaptcha(true);
      setPasswordFieldError("Complete the security verification to continue.");
      return;
    }

    if (!forgotCaptchaVerified) {
      setPasswordFieldError("Complete the security verification to continue.");
      return;
    }

    setPasswordFieldError(null);
    setForgotStatus(null);
    setIsResettingPassword(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: forgotTargetEmail,
          code: verificationCode.trim(),
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setPasswordFieldError(data.message ?? "Failed to change password.");
        setForgotCaptchaVerified(false);
        return;
      }

      setForgotStep("success");
      setForgotStatus({
        type: "success",
        message: data.message ?? "Password changed successfully.",
      });
      setPassword("");
      toast.success(data.message ?? "Password changed successfully.");
    } catch {
      setPasswordFieldError("Cannot connect to backend API.");
      setForgotCaptchaVerified(false);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiBaseUrl) {
      toast.error("Missing NEXT_PUBLIC_API_BASE_URL in env.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: userType,
        }),
      });

      const data: LoginResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.message ?? "Invalid credentials.");
        return;
      }

      const token = data.token ?? data.access_token;
      const role = normalizeRole(data.user?.role ?? data.role) ?? userType;

      if (!token) {
        toast.error("No token returned by backend.");
        return;
      }

      document.cookie = `${AUTH_COOKIE_TOKEN}=${encodeURIComponent(token)}; path=/; max-age=86400; samesite=lax`;
      document.cookie = `${AUTH_COOKIE_ROLE}=${role}; path=/; max-age=86400; samesite=lax`;
      localStorage.setItem("tclass_last_login_email", email.trim().toLowerCase());

      const redirect = searchParams.get("redirect");
      const target = redirect && redirect.startsWith("/") ? redirect : getRoleHome(role);

      toast.success("Login successful");
      router.push(target);
      router.refresh();
    } catch {
      toast.error("Cannot connect to backend API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/tclass.jpg')" }} />
      <div className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80" />

      <Link
        href="/"
        className="absolute top-4 left-4 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <div className="relative z-10 w-full max-w-5xl xl:max-w-6xl min-h-[500px] lg:min-h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-10 xl:p-12 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center max-w-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10">
                <Image
                  src="/tclass-logo.jpg"
                  alt="TCLASS Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">PGT - TCLASS</h1>
                <p className="text-blue-200 text-sm">Tarlac Center for Learning And Skills Success</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Welcome to
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                TCLASS Portal
              </span>
            </h2>

            <p className="text-blue-100/80 text-base leading-relaxed mb-8">
              Access your personalized dashboard to manage courses, track progress, and connect with your learning community.
            </p>

            <div className="space-y-4">
              {[
                { icon: GraduationCap, text: "TESDA Accredited Programs" },
                { icon: ShieldCheck, text: "Secure & Reliable Platform" },
                { icon: Users, text: "Join 1000+ Students" },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-blue-100/80">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5">
                    <feature.icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10" />
        </div>

        <div className="flex-1 p-8 sm:p-10 xl:p-12 flex flex-col justify-center">
          <div className="lg:hidden flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                <Image src="/tclass-logo.jpg" alt="TCLASS" fill className="object-cover" priority />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">TCLASS Portal</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Sign in to continue</p>
              </div>
            </div>
            <ThemeIconButton />
          </div>

          <div className="hidden lg:flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select your account type to continue</p>
            </div>
            <ThemeIconButton />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {userTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  if (type.id !== userType) {
                    setSwitchingRole(type.id);
                    setTimeout(() => {
                      setUserType(type.id);
                      setSwitchingRole(null);
                    }, 400);
                  }
                }}
                disabled={switchingRole !== null}
                className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  userType === type.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-500/10"
                    : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                } ${switchingRole === type.id ? "scale-95" : ""}`}
              >
                {switchingRole === type.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/20 dark:bg-slate-900/20 backdrop-blur-[2px] z-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                )}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    userType === type.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <type.icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    userType === type.id ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {type.label}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email / Username
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
                  <Mail
                    className={cn(
                      "h-5 w-5 shrink-0",
                      emailError ? "text-red-500" : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                </div>
                <Input
                  id="email"
                  type="text"
                  className={cn(
                    "pl-14 lg:pl-14 h-12 text-base rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 dark:bg-[#1e293b] dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30",
                    emailError && "border-red-500 focus:ring-red-500/20 dark:border-red-500"
                  )}
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailTouched) {
                      setEmailError("");
                    }
                  }}
                  required
                />
              </div>
              {emailTouched && emailError ? (
                <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{emailError}</span>
                </p>
              ) : normalizedEmail && emailCheckStatus === "checking" ? (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  <span>Checking email address for password recovery...</span>
                </p>
              ) : forgotPasswordReady ? (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{emailCheckMessage || "Email address found."}</span>
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    forgotPasswordReady
                      ? "text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      : "text-slate-400 hover:text-slate-500 dark:text-slate-500"
                  )}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
                  <Lock className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-14 pr-14 lg:pl-14 lg:pr-14 h-12 text-base rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 dark:bg-[#1e293b] dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 shrink-0" /> : <Eye className="h-5 w-5 shrink-0" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </span>
              ) : (
                `Sign In as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account? Please contact your administrator
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-4 text-white/40 text-xs">
        © {new Date().getFullYear()} Provincial Government of Tarlac. All rights reserved.
      </div>

      <Dialog open={forgotPasswordOpen} onOpenChange={(open) => (open ? setForgotPasswordOpen(true) : resetForgotPasswordFlow())}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader className="sr-only">
            <DialogTitle>Forgot password</DialogTitle>
            <DialogDescription>Recover your account password.</DialogDescription>
          </DialogHeader>

          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-5 py-6 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">Password Recovery</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {forgotStep === "send" && "Verify Your Email"}
                  {forgotStep === "verify" && "Enter Your Code"}
                  {forgotStep === "reset" && "Create New Password"}
                  {forgotStep === "success" && "Password Updated"}
                </h2>
                <p className="mt-2 text-sm text-blue-100/80">
                  {forgotStep === "send" && "We will send a 6-digit code to the email address below."}
                  {forgotStep === "verify" && "Enter the code from your inbox to continue to the password reset step."}
                  {forgotStep === "reset" && "Set a new password for your account and complete the security verification."}
                  {forgotStep === "success" && "Your account is ready. Use your new password the next time you sign in."}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-blue-50">
                {forgotStep === "send" && "Step 1 of 3"}
                {forgotStep === "verify" && "Step 2 of 3"}
                {forgotStep === "reset" && "Step 3 of 3"}
                {forgotStep === "success" && "Complete"}
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Email Address</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Password will be changed for</p>
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{forgotTargetEmail}</p>
                </div>
              </div>
            </div>

            {forgotStatus && (
              <div
                className={cn(
                  "mt-4 rounded-2xl border px-4 py-3 text-sm",
                  forgotStatus.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
                  forgotStatus.type === "error" && "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
                  forgotStatus.type === "info" && "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"
                )}
              >
                {forgotStatus.message}
              </div>
            )}

            {forgotStep === "send" && (
              <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Press <span className="font-semibold text-slate-900 dark:text-slate-100">Send a code</span> to receive a one-time 6-digit code in your inbox.
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={resetForgotPasswordFlow} className="h-11 rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSendingCode} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                    {isSendingCode ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Send a code"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {forgotStep === "verify" && (
              <form onSubmit={handleVerifyCode} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code" className="text-slate-700 dark:text-slate-300">Verification Code</Label>
                  <Input
                    id="verification-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter the 6-digit code"
                    value={verificationCode}
                    onChange={(event) => {
                      setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setForgotFieldError(null);
                    }}
                    className={cn(
                      "h-12 rounded-xl border-slate-200 bg-slate-50 text-center text-lg tracking-[0.35em] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white",
                      forgotFieldError && "border-red-500 dark:border-red-500"
                    )}
                  />
                  {forgotFieldError && <p className="text-xs text-red-600 dark:text-red-400">{forgotFieldError}</p>}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                  Didn&apos;t get a code?{" "}
                  <button
                    type="button"
                    onClick={() => void sendResetCode(forgotTargetEmail, { resend: true })}
                    disabled={isSendingCode || resendCooldown > 0}
                    className="font-semibold text-blue-600 disabled:text-slate-400 dark:text-blue-400 dark:disabled:text-slate-500"
                  >
                    {resendCooldown > 0 ? `Send again in ${resendCooldown}s` : "Send again"}
                  </button>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => setForgotStep("send")} className="h-11 rounded-xl">
                    Back
                  </Button>
                  <Button type="submit" disabled={isVerifyingCode} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                    {isVerifyingCode ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      "Verify code"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {forgotStep === "reset" && (
              <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-700 dark:text-slate-300">New Password</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
                      <Lock className="h-5 w-5 shrink-0 text-slate-400" />
                    </div>
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        setPasswordFieldError(null);
                      }}
                      placeholder="Create a new password"
                      className={cn(
                        "h-12 rounded-xl border-slate-200 bg-slate-50 pl-14 pr-14 lg:pl-14 lg:pr-14 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white",
                        passwordFieldError && "border-red-500 dark:border-red-500"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((current) => !current)}
                      className="absolute right-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5 shrink-0" /> : <Eye className="h-5 w-5 shrink-0" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-700 dark:text-slate-300">Confirm Password</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
                      <Lock className="h-5 w-5 shrink-0 text-slate-400" />
                    </div>
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setPasswordFieldError(null);
                      }}
                      placeholder="Confirm your new password"
                      className={cn(
                        "h-12 rounded-xl border-slate-200 bg-slate-50 pl-14 pr-14 lg:pl-14 lg:pr-14 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white",
                        passwordFieldError && "border-red-500 dark:border-red-500"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 shrink-0" /> : <Eye className="h-5 w-5 shrink-0" />}
                    </button>
                  </div>
                  {passwordFieldError && <p className="text-xs text-red-600 dark:text-red-400">{passwordFieldError}</p>}
                </div>

                {showForgotCaptcha && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <MathCaptcha onVerify={setForgotCaptchaVerified} isVerified={forgotCaptchaVerified} />
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => setForgotStep("verify")} className="h-11 rounded-xl">
                    Back
                  </Button>
                  <Button type="submit" disabled={isResettingPassword} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                    {isResettingPassword ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Changing password...
                      </span>
                    ) : (
                      showForgotCaptcha ? "Change password" : "Continue"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {forgotStep === "success" && (
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Password changed successfully</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Return to login and sign in with your new password for <span className="font-semibold">{forgotTargetEmail}</span>.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={resetForgotPasswordFlow}
                  className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-800" />
        <div className="w-48 h-4 rounded bg-slate-800" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
