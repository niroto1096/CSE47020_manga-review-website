import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { registration } from "@/Api/authApi";

const Registration = () => {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
      setForm((prev) => ({ ...prev, role: storedRole }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPasswordTouched(true);
    }
    setForm({ ...form, [name]: value });
    if (error) setError("");
  };

  const isPasswordValid = form.password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordTouched(true);

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long!");
      return;
    }

    setError("");
    setLoading(true);
    localStorage.setItem("email", form.email);

    try {
      const response = await registration(form);
      console.log("Registration response:", response);
      navigate("/otp");
    } catch (err) {
      console.error("Registration error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Registration failed. Please check your details and try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 w-full max-w-md p-8 border rounded-2xl shadow-xl bg-card text-card-foreground"
      >
        <h2 className="text-2xl font-bold text-center mb-4">
          Create an Account
        </h2>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <Input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-1">
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-1">
          <Input
            type="password"
            name="password"
            placeholder="Password (minimum 8 characters)"
            value={form.password}
            onChange={handleChange}
            onBlur={() => setPasswordTouched(true)}
            className={
              passwordTouched && form.password.length > 0 && !isPasswordValid
                ? "border-red-500 focus-visible:ring-red-500"
                : ""
            }
            required
          />

          {passwordTouched && form.password.length > 0 && (
            <div className="text-xs transition-all pt-1">
              {!isPasswordValid ? (
                <p className="text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
                  <span>⚠️ Password must be at least 8 characters long ({form.password.length}/8)</span>
                </p>
              ) : (
                <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <span>✓ Password meets the 8-character requirement</span>
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-4 h-11 text-base font-semibold"
          disabled={loading}
        >
          {loading ? "Creating account & sending OTP..." : "Register"}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium underline hover:opacity-80">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Registration;
