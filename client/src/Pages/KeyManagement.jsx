import React, { useEffect, useState, useContext } from "react";
import { getPublicKeysApi, rotateKeysApi } from "@/Api/authApi";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/Context/UserContext";
import { Key, Shield, RefreshCw, CheckCircle2, Lock, Cpu, Database } from "lucide-react";

const KeyManagement = () => {
  const { role } = useContext(UserContext);
  const [keyData, setKeyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [rotationMsg, setRotationMsg] = useState("");
  const [error, setError] = useState("");

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await getPublicKeysApi();
      setKeyData(res.data);
    } catch (err) {
      console.error("Failed to load key data:", err);
      setError("Failed to fetch public key distribution certificate.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleRotate = async (type = "ALL") => {
    if (!window.confirm(`Are you sure you want to rotate ${type} cryptographic keys? New key pairs will be generated from scratch.`)) {
      return;
    }
    try {
      setRotating(true);
      setRotationMsg("");
      setError("");
      const res = await rotateKeysApi(type);
      setRotationMsg("Keys successfully rotated! Active versions updated.");
      await fetchKeys();
    } catch (err) {
      setError(err?.response?.data?.message || "Key rotation failed.");
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-24 space-y-8">
      {/* Header Banner */}
      <div className="border rounded-2xl p-6 sm:p-8 bg-card shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" /> CSE447 Cryptographic Module
            </div>
            <h1 className="text-3xl font-bold">Key Management & Cryptographic Security</h1>
            <p className="text-muted-foreground text-sm max-w-2xl mt-1">
              Handles asymmetric key generation, public key certificates, data integrity envelopes, and key rotation implemented from scratch.
            </p>
          </div>

          {role === "admin" && (
            <Button
              onClick={() => handleRotate("ALL")}
              disabled={rotating}
              className="flex items-center gap-2 bg-primary font-semibold shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${rotating ? "animate-spin" : ""}`} />
              {rotating ? "Rotating Keys..." : "Rotate All Keys"}
            </Button>
          )}
        </div>

        {rotationMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {rotationMsg}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Grid of Cryptosystems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RSA Card */}
        <div className="border rounded-2xl p-6 bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Asymmetric Engine 1: RSA</h3>
                <p className="text-xs text-muted-foreground">User Profiles & Post Reviews</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-muted border font-semibold">
              Version: {keyData?.RSA?.version || "v1"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Algorithm:</span>
              <span className="font-mono font-semibold">RSA-SCRATCH (256-bit BigInt)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Public Exponent (e):</span>
              <span className="font-mono">{keyData?.RSA?.publicKey?.e || "65537"}</span>
            </div>
            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground block">Public Modulus (n):</span>
              <div className="p-2.5 bg-muted/70 rounded-lg font-mono text-[11px] break-all border">
                {keyData?.RSA?.publicKey?.n || "Generating..."}
              </div>
            </div>
          </div>
        </div>

        {/* ECC Card */}
        <div className="border rounded-2xl p-6 bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Asymmetric Engine 2: ECC</h3>
                <p className="text-xs text-muted-foreground">Personal Lists & History</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-muted border font-semibold">
              Version: {keyData?.ECC?.version || "v1"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Curve:</span>
              <span className="font-mono font-semibold">secp256k1 (y² = x³ + 7 mod p)</span>
            </div>
            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground block">Public Generator Point (Q_x):</span>
              <div className="p-2 bg-muted/70 rounded-lg font-mono text-[11px] break-all border">
                {keyData?.ECC?.publicKey?.x || "Generating..."}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground block">Public Generator Point (Q_y):</span>
              <div className="p-2 bg-muted/70 rounded-lg font-mono text-[11px] break-all border">
                {keyData?.ECC?.publicKey?.y || "Generating..."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Architecture Summary */}
      <div className="border rounded-2xl p-6 bg-card shadow-sm space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Active CSE447 Cryptographic Envelopes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border bg-muted/40 space-y-1">
            <div className="font-semibold text-foreground">Password Security</div>
            <p className="text-muted-foreground">16-Byte Cryptographic Salt + 1000 Rounds of SHA-256 Iterations.</p>
          </div>
          <div className="p-4 rounded-xl border bg-muted/40 space-y-1">
            <div className="font-semibold text-foreground">Data Integrity (MAC)</div>
            <p className="text-muted-foreground">Pure HMAC-SHA256 calculation prevents unauthorized DB modification.</p>
          </div>
          <div className="p-4 rounded-xl border bg-muted/40 space-y-1">
            <div className="font-semibold text-foreground">Two-Factor Auth (2FA)</div>
            <p className="text-muted-foreground">Enforces primary password check + secondary OTP email factor at login.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyManagement;
