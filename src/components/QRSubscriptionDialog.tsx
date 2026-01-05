import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle, Loader2, QrCode, Coins } from "lucide-react";
import paymentQR from "@/assets/payment-qr.jpeg";

interface QRSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

interface TokenPackage {
  id: string;
  tokens: number;
  price: number;
  label: string;
  popular?: boolean;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  { id: "basic", tokens: 50, price: 99, label: "50 Tokens" },
  { id: "standard", tokens: 100, price: 179, label: "100 Tokens", popular: true },
  { id: "premium", tokens: 250, price: 399, label: "250 Tokens" },
  { id: "pro", tokens: 500, price: 699, label: "500 Tokens" },
];

const TIME_LIMIT_SECONDS = 5 * 60; // 5 minutes

export function QRSubscriptionDialog({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: QRSubscriptionDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [step, setStep] = useState<"select" | "payment" | "verify" | "success" | "expired">("select");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [transactionId, setTransactionId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setSelectedPackage(null);
      setTimeLeft(TIME_LIMIT_SECONDS);
      setTransactionId("");
      setPendingId(null);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (step !== "payment" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStep("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleSelectPackage = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    
    // Create pending subscription record
    const expiresAt = new Date(Date.now() + TIME_LIMIT_SECONDS * 1000);
    
    const { data, error } = await supabase
      .from("pending_subscriptions")
      .insert({
        user_id: userId,
        token_package: pkg.tokens,
        amount: pkg.price,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setPendingId(data.id);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setStep("payment");
  };

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) {
      toast({
        title: "Required",
        description: "Please enter the transaction ID",
        variant: "destructive",
      });
      return;
    }

    if (!pendingId || !selectedPackage) return;

    setVerifying(true);

    try {
      // Update pending subscription with transaction ID
      const { error: updateError } = await supabase
        .from("pending_subscriptions")
        .update({
          transaction_id: transactionId.trim(),
          status: "pending_verification",
        })
        .eq("id", pendingId);

      if (updateError) throw updateError;

      // For demo: Auto-approve (in production, admin would verify)
      // Update usage tokens
      const { data: existingUsage, error: usageError } = await supabase
        .from("usage_tokens")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (usageError) throw usageError;

      if (existingUsage) {
        await supabase
          .from("usage_tokens")
          .update({
            is_premium: true,
            tokens_used: Math.max(0, (existingUsage.tokens_used || 0) - selectedPackage.tokens),
            free_limit: (existingUsage.free_limit || 10) + selectedPackage.tokens,
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("usage_tokens").insert({
          user_id: userId,
          is_premium: true,
          tokens_used: 0,
          free_limit: 10 + selectedPackage.tokens,
        });
      }

      // Mark subscription as verified
      await supabase
        .from("pending_subscriptions")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("id", pendingId);

      setStep("success");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not verify payment. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRetry = () => {
    setStep("select");
    setSelectedPackage(null);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setTransactionId("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            {step === "select" && "Buy Token Package"}
            {step === "payment" && "Complete Payment"}
            {step === "verify" && "Verify Payment"}
            {step === "success" && "Payment Successful"}
            {step === "expired" && "Payment Expired"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Select a token package to purchase"}
            {step === "payment" && "Scan the QR code to complete payment"}
            {step === "success" && "Your tokens have been added!"}
            {step === "expired" && "Your payment session has expired"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-3 py-4"
            >
              {TOKEN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${pkg.popular 
                      ? "border-primary bg-primary/5 hover:bg-primary/10" 
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <p className="font-semibold text-lg">{pkg.label}</p>
                  <p className="text-2xl font-bold text-primary">₹{pkg.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{(pkg.price / pkg.tokens).toFixed(2)}/token
                  </p>
                </button>
              ))}
            </motion.div>
          )}

          {step === "payment" && selectedPackage && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-4 space-y-4"
            >
              {/* Timer */}
              <div className={`flex items-center justify-center gap-2 text-lg font-mono
                ${timeLeft < 60 ? "text-destructive" : "text-primary"}`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* QR Code */}
              <div className="relative mx-auto w-48 h-48 rounded-xl overflow-hidden border-4 border-primary/20">
                <img
                  src={paymentQR}
                  alt="Payment QR Code"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Amount */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pay exactly</p>
                <p className="text-3xl font-bold text-primary">₹{selectedPackage.price}</p>
                <p className="text-sm text-muted-foreground">
                  for {selectedPackage.tokens} tokens
                </p>
              </div>

              {/* Transaction ID Input */}
              <div className="space-y-2">
                <Label htmlFor="transaction-id">Transaction ID / UTR Number</Label>
                <Input
                  id="transaction-id"
                  placeholder="Enter transaction ID after payment"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>

              {/* Verify Button */}
              <Button
                className="w-full"
                variant="neon"
                onClick={handleVerifyPayment}
                disabled={verifying || !transactionId.trim()}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Payment"
                )}
              </Button>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-8 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              </motion.div>
              <div>
                <p className="text-xl font-semibold">Payment Verified!</p>
                <p className="text-muted-foreground">
                  {selectedPackage?.tokens} tokens have been added to your account
                </p>
              </div>
              <Button variant="neon" onClick={onClose}>
                Continue
              </Button>
            </motion.div>
          )}

          {step === "expired" && (
            <motion.div
              key="expired"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-8 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <XCircle className="w-16 h-16 mx-auto text-destructive" />
              </motion.div>
              <div>
                <p className="text-xl font-semibold">Session Expired</p>
                <p className="text-muted-foreground">
                  The 5-minute payment window has expired
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="neon" onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
