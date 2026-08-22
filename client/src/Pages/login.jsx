import React, { useContext, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { logIn, verifyLogin2FAApi, resendOTPApi } from "@/Api/authApi";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "@/Context/UserContext";
import { ShieldCheck, Lock, Mail, KeyRound, ArrowLeft } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [is2FA, setIs2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [error, setError] = useState("");
  const { setRole, setUserId, setUserName } = useContext(UserContext);
  const navigate = useNavigate();

  // Step 1: Submit Credentials & Trigger 2FA
  const handlePrimaryLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");
    setLoading(true);

    try {
      const response = await logIn(email, password);

      // Check if 2FA is required (CSE447 Requirement #4)
      if (response.data?.status === "2FA_REQUIRED") {
        setIs2FA(true);
        setInfoMsg(response.data.message || "2FA code sent to your email!");
      } else if (response.data?.user) {
        // Direct fallback
        completeLogin(response.data.user);
      }
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 2FA OTP & Complete Login
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");
    setLoading(true);

    try {
      const response = await verifyLogin2FAApi(email, otp);
      const user = response.data?.user;
      if (user) {
        completeLogin(user);
      } else {
        throw new Error("No user profile returned");
      }
    } catch (err) {
      console.error("2FA Verification error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Invalid 2FA code. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setInfoMsg("");
    setResending(true);
    try {
      await resendOTPApi(email);
      setInfoMsg("A fresh 2FA code has been sent to your email.");
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const completeLogin = (user) => {
    localStorage.setItem("role", user.role);
    localStorage.setItem("userId", user._id);
    localStorage.setItem("username", user.name);

    setRole(user.role);
    if (setUserId) setUserId(user._id);
    if (setUserName) setUserName(user.name);

    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 border rounded-2xl shadow-xl bg-card text-card-foreground">
        {!is2FA ? (
          /* Step 1 Form: Primary Credentials */
          <form onSubmit={handlePrimaryLogin} className="space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access your account
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    className="pl-9"
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    className="pl-9"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? "Authenticating..." : "Continue with 2FA"}
            </Button>

            <div className="pt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Protected by RSA & Salted Hash Cryptography (CSE447)
            </div>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Don't have an account?{" "}
              <Link to="/registration" className="text-primary font-medium underline hover:opacity-80">
                Create an account
              </Link>
            </p>
          </form>
        ) : (
          /* Step 2 Form: Two-Factor Authentication (2FA) */
          <form onSubmit={handleVerify2FA} className="space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground">
                Enter the 4-digit verification code sent to <br />
                <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>

            {infoMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg text-center">
                {infoMsg}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 text-center">
                Verification Code
              </label>
              <Input
                type="text"
                placeholder="1234"
                maxLength={6}
                value={otp}
                className="text-center text-2xl font-mono tracking-widest h-12"
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (error) setError("");
                }}
                required
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading || !otp}>
              {loading ? "Verifying..." : "Verify & Complete Login"}
            </Button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setIs2FA(false);
                  setOtp("");
                  setError("");
                }}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
