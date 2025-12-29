import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { CardGallery } from "@/components/CardGallery";
import { CardCreator } from "@/components/CardCreator";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleGoogleLogin = async () => {
    // Simulate login - this will be replaced with actual Google OAuth
    setIsAuthenticated(true);
    setUser({
      name: "John Doe",
      email: "john@example.com",
    });
    setIsAuthModalOpen(false);
    toast({
      title: "Welcome!",
      description: "You've successfully signed in.",
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  const handleLoginRequired = () => {
    setIsAuthModalOpen(true);
    toast({
      title: "Sign in required",
      description: "Please sign in to access this feature.",
    });
  };

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
          user={user}
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
            onLoginRequired={handleLoginRequired}
          />
          
          <FeaturesSection />
        </main>

        <Footer />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onGoogleLogin={handleGoogleLogin}
        />
      </div>
    </>
  );
};

export default Index;
