import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { CardGallery } from "@/components/CardGallery";
import { CardCreator } from "@/components/CardCreator";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { ChatBot } from "@/components/ChatBot";
import { InstallBanner } from "@/components/InstallBanner";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [tokensRemaining, setTokensRemaining] = useState(10);
  const { user, profile, isAuthenticated, signInWithGoogle, signOut, loading } = useAuth();

  const fetchTokens = useCallback(async () => {
    if (!user?.id) {
      setTokensRemaining(10);
      return;
    }
    
    const { data } = await supabase
      .from("usage_tokens")
      .select("tokens_used, free_limit")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setTokensRemaining(Math.max(0, data.free_limit - data.tokens_used));
    } else {
      setTokensRemaining(10);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsAuthModalOpen(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    }
  };

  const handleLoginRequired = () => {
    setIsAuthModalOpen(true);
    toast({
      title: "Sign in required",
      description: "Please sign in to access this feature.",
    });
  };

  const userInfo = profile ? {
    id: user?.id,
    name: profile.display_name || "User",
    email: profile.email || "",
    avatar: profile.avatar_url || undefined,
  } : user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    avatar: user.user_metadata?.avatar_url,
  } : null;

  return (
    <>
      <Helmet>
        <title>IDForge - AI-Powered Identity Card Generator</title>
        <meta name="description" content="Create stunning, professional identity card designs in seconds with AI. From corporate badges to creative student IDs, generate unique 2D and 3D designs." />
        <meta name="keywords" content="ID card generator, identity card maker, AI design, corporate badge, student ID, professional ID card" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header
          isAuthenticated={isAuthenticated}
          user={userInfo}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        
        <main>
          <HeroSection onGetStarted={() => {
            document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' });
          }} />
          
          <CardGallery />
          
          <CardCreator
            isAuthenticated={isAuthenticated}
            userId={user?.id}
            onLoginRequired={handleLoginRequired}
            tokensRemaining={tokensRemaining}
            onTokensUpdated={fetchTokens}
          />
          
          <FeaturesSection />
        </main>

        <Footer />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onGoogleLogin={handleGoogleLogin}
        />

        <ChatBot />
        <InstallBanner />
      </div>
    </>
  );
};

export default Index;
