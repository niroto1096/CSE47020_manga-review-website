import React, { useContext, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { logIn } from "@/Api/authApi";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "@/Context/UserContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setRole, setUserId, setUserName } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await logIn(email, password);
      const user = response.data.user;
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user._id);
      localStorage.setItem("username", user.name);

      setRole(user.role);
      if (setUserId) setUserId(user._id);
      if (setUserName) setUserName(user.name);

      console.log("Logged in user:", response.data.user);
      navigate("/", { replace: true });
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 p-8 border rounded-2xl shadow-xl bg-card text-card-foreground"
      >
        <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-center text-sm text-muted-foreground mb-4">
          Enter your credentials to access your account
        </p>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          required
        />

        <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/registration" className="text-primary font-medium underline hover:opacity-80">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
