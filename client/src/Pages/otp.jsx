import React, { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { verifyOTP, resendOTPApi } from "@/Api/authApi";
import { useNavigate, Link } from "react-router-dom";

const Otp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role) {
      navigate("/", { replace: true });
    } else if (!email) {
      navigate("/registration", { replace: true });
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("No email found. Please register first.");
      navigate("/registration", { replace: true });
      return;
    }
    if (otp.length < 4) {
      setError("Please enter the complete 4-digit OTP.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await verifyOTP(email, otp);
      setSuccess(response?.data || "Account created successfully! Redirecting to login...");
      localStorage.removeItem("email");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Verification failed. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("No email address found. Please register again.");
      return;
    }
    setError("");
    setSuccess("");
    setResending(true);
    try {
      const res = await resendOTPApi(email);
      setSuccess(res?.data || "A new OTP has been sent to your email!");
      setOtp("");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to resend OTP. Please try registering again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 border rounded-2xl shadow-xl bg-card text-card-foreground space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Verify Your Email</h2>
          {email ? (
            <p className="text-sm text-muted-foreground">
              We sent a 4-digit verification code to: <br />
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          ) : (
            <p className="text-sm text-amber-500 font-medium">
              No registration email detected.{" "}
              <Link to="/registration" className="underline hover:text-amber-600">
                Go to Register
              </Link>
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg text-left">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm rounded-lg text-left">
            {success}
          </div>
        )}

        <div className="flex justify-center py-2">
          <InputOTP
            maxLength={4}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (error) setError("");
            }}
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="w-12 h-12 text-xl font-bold border-2 rounded-lg" />
              <InputOTPSlot index={1} className="w-12 h-12 text-xl font-bold border-2 rounded-lg" />
              <InputOTPSlot index={2} className="w-12 h-12 text-xl font-bold border-2 rounded-lg" />
              <InputOTPSlot index={3} className="w-12 h-12 text-xl font-bold border-2 rounded-lg" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-11 text-base font-semibold"
          disabled={otp.length < 4 || loading}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !email}
            className="hover:underline text-primary font-medium disabled:opacity-50"
          >
            {resending ? "Sending code..." : "Resend Code"}
          </button>

          <Link to="/registration" className="hover:underline">
            Change Email / Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Otp;

