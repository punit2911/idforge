import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Share, Plus, MoreVertical, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Already Installed!</CardTitle>
            <CardDescription>
              IDForge is already installed on your device. Open it from your home screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full">Go to App</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden shadow-xl">
            <img src="/pwa-192x192.png" alt="IDForge" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Install IDForge</h1>
          <p className="text-xl text-muted-foreground">
            Add IDForge to your home screen for the best experience
          </p>
        </div>

        {/* Benefits */}
        <div className="grid gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Works Like a Native App</h3>
                <p className="text-sm text-muted-foreground">Full-screen experience without browser UI</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Works Offline</h3>
                <p className="text-sm text-muted-foreground">Access your saved designs anytime</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Install Instructions */}
        {deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full text-lg py-6">
            <Download className="w-5 h-5 mr-2" />
            Install IDForge
          </Button>
        ) : isIOS ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Install on iPhone/iPad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Tap the</span>
                  <Share className="w-5 h-5" />
                  <span>Share button in Safari</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Scroll down and tap</span>
                  <Plus className="w-5 h-5" />
                  <span>"Add to Home Screen"</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">3</span>
                </div>
                <span>Tap "Add" to confirm</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Install on Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Tap the</span>
                  <MoreVertical className="w-5 h-5" />
                  <span>menu button in Chrome</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">2</span>
                </div>
                <span>Tap "Add to Home screen" or "Install app"</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">3</span>
                </div>
                <span>Tap "Install" to confirm</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8">
          <Link to="/" className="text-primary hover:underline">
            Continue in browser instead
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Install;
