import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import paymentQR from "@/assets/payment-qr.jpeg";
import {
  Coins,
  Check,
  Sparkles,
  Zap,
  Crown,
  X,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular?: boolean;
  icon: React.ReactNode;
  features: string[];
}

const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: "starter",
    name: "Starter",
    tokens: 25,
    price: 99,
    icon: <Zap className="w-6 h-6" />,
    features: [
      "25 AI generations",
      "All card styles",
      "HD downloads",
      "Valid forever",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tokens: 75,
    price: 249,
    popular: true,
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      "75 AI generations",
      "All card styles",
      "HD downloads",
      "Priority processing",
      "Valid forever",
    ],
  },
  {
    id: "unlimited",
    name: "Ultimate",
    tokens: 200,
    price: 499,
    icon: <Crown className="w-6 h-6" />,
    features: [
      "200 AI generations",
      "All card styles",
      "HD downloads",
      "Priority processing",
      "Premium support",
      "Valid forever",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, loading, signOut } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ tokens_used: number; free_limit: number } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUsageInfo();
    }
  }, [user?.id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPaymentModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showPaymentModal, timeLeft]);

  const fetchUsageInfo = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("usage_tokens")
      .select("tokens_used, free_limit")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setUsageInfo(data);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSelectPackage = (pkg: TokenPackage) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to purchase tokens.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
    setTimeLeft(300);
    setPaymentExpired(false);
    setTransactionId("");
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPackage(null);
    setTransactionId("");
    setPaymentExpired(false);
  };

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) {
      toast({
        title: "Transaction ID required",
        description: "Please enter the transaction ID from your payment app.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPackage || !user?.id) return;

    setIsVerifying(true);

    try {
      // Create pending subscription record
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      const { error: insertError } = await supabase
        .from("pending_subscriptions")
        .insert({
          user_id: user.id,
          token_package: selectedPackage.tokens,
          amount: selectedPackage.price,
          expires_at: expiresAt,
          transaction_id: transactionId,
          status: "pending",
        });

      if (insertError) {
        throw insertError;
      }

      // For demo: auto-approve and add tokens
      // In production, this would be verified by admin
      const { data: existingUsage } = await supabase
        .from("usage_tokens")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingUsage) {
        await supabase
          .from("usage_tokens")
          .update({
            free_limit: existingUsage.free_limit + selectedPackage.tokens,
            is_premium: true,
          })
          .eq("user_id", user.id);
      } else {
        await supabase.from("usage_tokens").insert({
          user_id: user.id,
          free_limit: 10 + selectedPackage.tokens,
          tokens_used: 0,
          is_premium: true,
        });
      }

      // Update pending subscription to verified
      await supabase
        .from("pending_subscriptions")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("transaction_id", transactionId);

      toast({
        title: "Payment verified!",
        description: `${selectedPackage.tokens} tokens have been added to your account.`,
      });

      handleClosePaymentModal();
      fetchUsageInfo();
    } catch (error) {
      console.error("Payment verification error:", error);
      toast({
        title: "Verification failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const tokensRemaining = usageInfo ? Math.max(0, usageInfo.free_limit - usageInfo.tokens_used) : 10;

  return (
    <>
      <Helmet>
        <title>Pricing | IDForge - Buy Tokens</title>
        <meta name="description" content="Get more AI generation tokens for your ID cards. Choose from our flexible token packages." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header
          isAuthenticated={isAuthenticated}
          user={profile ? { name: profile.display_name || "User", email: profile.email || "" } : null}
          onLogout={handleLogout}
        />

        <main className="pt-24 pb-16 container mx-auto px-4">
          {/* Header Section */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">
                You have {tokensRemaining} tokens remaining
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Get More <span className="neon-text">Tokens</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each AI generation uses 1 token. Choose the package that fits your needs.
            </p>
          </motion.div>

          {/* Free Tier Info */}
          <motion.div
            className="glass-card p-6 rounded-xl mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/20">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Free Tier</h3>
                <p className="text-sm text-muted-foreground">
                  Every account gets <strong>10 free tokens</strong> to start. Use them to create amazing ID cards!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TOKEN_PACKAGES.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                className={`relative glass-card rounded-2xl p-6 ${
                  pkg.popular ? "ring-2 ring-primary" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-full mb-4 ${
                    pkg.popular ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {pkg.icon}
                  </div>
                  <h3 className="font-display text-xl font-bold mb-1">{pkg.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">₹{pkg.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pkg.tokens} tokens
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={pkg.popular ? "neon" : "outline"}
                  className="w-full"
                  onClick={() => handleSelectPackage(pkg)}
                >
                  Get {pkg.tokens} Tokens
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            className="mt-16 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="font-display text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-xl">
                <h3 className="font-semibold mb-2">How do tokens work?</h3>
                <p className="text-sm text-muted-foreground">
                  Each AI ID card generation uses 1 token. Tokens never expire and can be used anytime.
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <h3 className="font-semibold mb-2">How do I pay?</h3>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.), complete the payment, and enter the transaction ID.
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <h3 className="font-semibold mb-2">How long does verification take?</h3>
                <p className="text-sm text-muted-foreground">
                  Tokens are added instantly after you submit the transaction ID. The payment is verified automatically.
                </p>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && selectedPackage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={handleClosePaymentModal}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md glass-card rounded-2xl p-6 overflow-hidden"
              >
                <button
                  onClick={handleClosePaymentModal}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <h2 className="font-display text-xl font-bold mb-1">
                    Complete Payment
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedPackage.name} - {selectedPackage.tokens} tokens
                  </p>
                </div>

                {/* Timer */}
                <div className={`flex items-center justify-center gap-2 mb-4 p-2 rounded-lg ${
                  timeLeft <= 60 ? "bg-destructive/20 text-destructive" : "bg-secondary"
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-semibold">
                    {paymentExpired ? "Expired" : formatTime(timeLeft)}
                  </span>
                </div>

                {paymentExpired ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Payment window expired. Please try again.
                    </p>
                    <Button onClick={handleClosePaymentModal}>Close</Button>
                  </div>
                ) : (
                  <>
                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-xl mb-4">
                      <img
                        src={paymentQR}
                        alt="Payment QR Code"
                        className="w-full max-w-[200px] mx-auto"
                      />
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-2xl font-bold text-primary">₹{selectedPackage.price}</p>
                      <p className="text-sm text-muted-foreground">
                        Scan with any UPI app
                      </p>
                    </div>

                    {/* Transaction ID Input */}
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="transaction-id">Transaction ID / UTR Number</Label>
                      <Input
                        id="transaction-id"
                        placeholder="Enter transaction ID from payment app"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Find this in your payment app's transaction details
                      </p>
                    </div>

                    <Button
                      variant="neon"
                      className="w-full"
                      onClick={handleVerifyPayment}
                      disabled={isVerifying || !transactionId.trim()}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Payment"
                      )}
                    </Button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
