import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IDCard } from "./IDCard";
import { ChallengeVerification } from "./ChallengeVerification";
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Building2, 
  GraduationCap, 
  Rocket, 
  Minimize2, 
  Palette,
  Loader2,
  Heart,
  Save,
  Upload,
  X,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateIDCard, saveDesign } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CardStyle = "corporate" | "student" | "futuristic" | "minimal" | "creative";

const styles: { id: CardStyle; name: string; icon: React.ReactNode; description: string }[] = [
  { id: "corporate", name: "Corporate", icon: <Building2 className="w-5 h-5" />, description: "Professional business" },
  { id: "student", name: "Student", icon: <GraduationCap className="w-5 h-5" />, description: "Academic & education" },
  { id: "futuristic", name: "Futuristic", icon: <Rocket className="w-5 h-5" />, description: "Sci-fi & tech" },
  { id: "minimal", name: "Minimal", icon: <Minimize2 className="w-5 h-5" />, description: "Clean & simple" },
  { id: "creative", name: "Creative", icon: <Palette className="w-5 h-5" />, description: "Bold & artistic" },
];

interface CardCreatorProps {
  isAuthenticated?: boolean;
  userId?: string;
  onLoginRequired?: () => void;
  tokensRemaining?: number;
  onTokensUpdated?: () => void;
}

export function CardCreator({ isAuthenticated, userId, onLoginRequired, tokensRemaining = 10, onTokensUpdated }: CardCreatorProps) {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>("futuristic");
  const [isVertical, setIsVertical] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [name, setName] = useState("John Doe");
  const [title, setTitle] = useState("Software Engineer");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleChallengeVerified = useCallback((token: string) => {
    setChallengeToken(token);
  }, []);

  const handleChallengeInvalidated = useCallback(() => {
    setChallengeToken(null);
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "logo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    if (type === "photo") {
      setUserPhotoPreview(previewUrl);
    } else {
      setLogoPreview(previewUrl);
    }

    // If authenticated, upload to storage
    if (isAuthenticated && userId) {
      const setIsUploading = type === "photo" ? setIsUploadingPhoto : setIsUploadingLogo;
      setIsUploading(true);
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("user-photos")
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get signed URL for the uploaded file (valid for 1 hour)
        const { data: signedData, error: signedError } = await supabase.storage
          .from("user-photos")
          .createSignedUrl(fileName, 3600);

        if (signedError) {
          throw signedError;
        }

        if (type === "photo") {
          setUserPhotoUrl(signedData.signedUrl);
        } else {
          setLogoUrl(signedData.signedUrl);
        }
        
        toast({
          title: `${type === "photo" ? "Photo" : "Logo"} uploaded`,
          description: `Your ${type} will be used in the ID card generation.`,
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${type}. Using local preview.`,
          variant: "destructive",
        });
        // Use base64 as fallback
        const reader = new FileReader();
        reader.onload = () => {
          if (type === "photo") {
            setUserPhotoUrl(reader.result as string);
          } else {
            setLogoUrl(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Not authenticated - use base64
      const reader = new FileReader();
      reader.onload = () => {
        if (type === "photo") {
          setUserPhotoUrl(reader.result as string);
        } else {
          setLogoUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setUserPhotoUrl(null);
    setUserPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!challengeToken) {
      toast({
        title: "Verification required",
        description: "Please complete the verification challenge first.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has tokens remaining
    if (tokensRemaining <= 0) {
      toast({
        title: "No tokens remaining",
        description: "You've used all your tokens. Please purchase more to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await generateIDCard({
        name,
        title,
        style: selectedStyle,
        customPrompt: customPrompt || undefined,
        isVertical,
        userPhotoUrl: userPhotoUrl || undefined,
        logoUrl: logoUrl || undefined,
        challengeToken,
      });

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        
        // Update token usage in database
        if (isAuthenticated && userId) {
          await supabase
            .from("usage_tokens")
            .update({ tokens_used: supabase.rpc ? undefined : undefined })
            .eq("user_id", userId);
          
          // Increment tokens_used
          const { data: currentUsage } = await supabase
            .from("usage_tokens")
            .select("tokens_used")
            .eq("user_id", userId)
            .maybeSingle();
          
          if (currentUsage) {
            await supabase
              .from("usage_tokens")
              .update({ tokens_used: currentUsage.tokens_used + 1 })
              .eq("user_id", userId);
          }
          
          onTokensUpdated?.();
        }
        
        const hasUploads = userPhotoUrl || logoUrl;
        toast({
          title: "Card generated!",
          description: hasUploads 
            ? "Your AI-powered ID card with your uploads is ready."
            : "Your AI-powered ID card is ready.",
        });
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Failed to generate ID card. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated || !userId) {
      onLoginRequired?.();
      return;
    }

    setIsSaving(true);
    
    try {
      const { error } = await saveDesign({
        userId,
        name,
        title,
        style: selectedStyle,
        isVertical,
        imageUrl: generatedImageUrl || undefined,
        customPrompt: customPrompt || undefined,
      });

      if (error) {
        toast({
          title: "Save failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Design saved!",
          description: "Your design has been saved to your profile.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      // For base64 images, create a download link
      const link = document.createElement("a");
      link.href = generatedImageUrl;
      link.download = `id-card-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your ID card is being downloaded.",
      });
    } else {
      toast({
        title: "No image to download",
        description: "Please generate an ID card first.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="create" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Create Your <span className="neon-text">ID Card</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Customize your design, add your details, and let AI generate a stunning identity card.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Form */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Style Selector */}
            <div className="space-y-4">
              <Label className="text-lg font-display font-semibold">Select Style</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {styles.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-300",
                      selectedStyle === style.id
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={cn(
                      "mb-2",
                      selectedStyle === style.id ? "text-primary" : "text-muted-foreground"
                    )}>
                      {style.icon}
                    </div>
                    <div className="font-semibold text-sm">{style.name}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Orientation Toggle */}
            <div className="space-y-4">
              <Label className="text-lg font-display font-semibold">Orientation</Label>
              <div className="flex gap-3">
                <Button
                  variant={!isVertical ? "default" : "outline"}
                  onClick={() => setIsVertical(false)}
                  className="flex-1"
                >
                  Horizontal
                </Button>
                <Button
                  variant={isVertical ? "default" : "outline"}
                  onClick={() => setIsVertical(true)}
                  className="flex-1"
                >
                  Vertical
                </Button>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <Label className="text-lg font-display font-semibold">Your Photo</Label>
              <p className="text-sm text-muted-foreground">
                Upload a photo to include on your ID card. AI will integrate it into the design.
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "photo")}
                className="hidden"
              />
              
              {userPhotoPreview ? (
                <div className="relative inline-block">
                  <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-primary/50">
                    <img 
                      src={userPhotoPreview} 
                      alt="Your photo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  Upload Photo
                </Button>
              )}
            </div>

            {/* Logo Upload */}
            <div className="space-y-4">
              <Label className="text-lg font-display font-semibold">Company/School Logo</Label>
              <p className="text-sm text-muted-foreground">
                Upload a logo to include on your ID card. Perfect for company, school, or organization branding.
              </p>
              
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "logo")}
                className="hidden"
              />
              
              {logoPreview ? (
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-accent/50 bg-white p-1">
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {isUploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  className="gap-2"
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Logo
                </Button>
              )}
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <Label className="text-lg font-display font-semibold">Card Details</Label>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="title" className="text-sm text-muted-foreground">Title / Role</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your title"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Challenge Verification */}
            <ChallengeVerification
              onVerified={handleChallengeVerified}
              onInvalidated={handleChallengeInvalidated}
            />

            {/* AI Prompt */}
            <div className="space-y-4">
              <Label className="text-lg font-display font-semibold">AI Prompt (Optional)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe any custom elements you'd like... e.g., 'Add a holographic effect with blue tones'"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="hero"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || isUploadingPhoto || isUploadingLogo || !challengeToken}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate with AI
                  </>
                )}
              </Button>
              <Button 
                variant="glass" 
                size="lg" 
                onClick={() => {
                  setSelectedStyle(styles[Math.floor(Math.random() * styles.length)].id);
                  setGeneratedImageUrl(null);
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Randomize
              </Button>
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="sticky top-24">
              <Label className="text-lg font-display font-semibold mb-4 block">Live Preview</Label>
              
              {/* Card Preview */}
              <div className="relative p-8 rounded-2xl glass-card">
                <div className="absolute inset-0 holographic-bg opacity-10 rounded-2xl" />
                
                <motion.div
                  className="relative max-w-md mx-auto"
                  animate={isGenerating ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 1, repeat: isGenerating ? Infinity : 0 }}
                >
                  {generatedImageUrl ? (
                    <div className={cn(
                      "rounded-xl overflow-hidden shadow-xl",
                      isVertical ? "aspect-[1/1.586]" : "aspect-[1.586/1]"
                    )}>
                      <img 
                        src={generatedImageUrl} 
                        alt="Generated ID Card" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <IDCard
                      style={selectedStyle}
                      name={name}
                      title={title}
                      id={`ID-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`}
                      imageUrl={userPhotoPreview || undefined}
                      isVertical={isVertical}
                      className="w-full"
                    />
                  )}
                </motion.div>

                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-2xl">
                    <div className="flex flex-col items-center gap-3 text-primary">
                      <Loader2 className="w-10 h-10 animate-spin" />
                      <span className="font-display font-semibold">AI is creating your card...</span>
                      <span className="text-sm text-muted-foreground">
                        {userPhotoUrl ? "Integrating your photo..." : "This may take a moment"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Download Actions */}
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="neon" 
                  className="flex-1" 
                  onClick={handleDownload}
                  disabled={!generatedImageUrl}
                >
                  <Download className="w-5 h-5" />
                  Download PNG
                </Button>
                <Button 
                  variant="glass" 
                  className="flex-1" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Design
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
