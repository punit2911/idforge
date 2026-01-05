import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Upload,
  DollarSign,
  ImageIcon,
  ArrowLeft,
  Sparkles,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STYLES = [
  { value: "corporate", label: "Corporate" },
  { value: "student", label: "Student" },
  { value: "futuristic", label: "Futuristic" },
  { value: "minimal", label: "Minimal" },
  { value: "creative", label: "Creative" },
];

export default function SellDesign() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, loading, signOut } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    style: "futuristic",
    price: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
      toast({
        title: "Sign in required",
        description: "Please sign in to list your design for sale.",
      });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to list your design.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a name for your design.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("user-photos")
          .upload(fileName, imageFile);

        if (uploadError) {
          throw uploadError;
        }

        // Use signed URL since bucket is private
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("user-photos")
          .createSignedUrl(fileName, 31536000); // 1 year validity

        if (signedUrlError) {
          throw signedUrlError;
        }

        imageUrl = signedUrlData.signedUrl;
      }

      // Insert design into database
      const { error: insertError } = await supabase.from("saved_designs").insert({
        user_id: user.id,
        name: formData.name.trim(),
        title: formData.title.trim() || null,
        description: formData.description.trim() || null,
        style: formData.style,
        price: formData.price ? parseFloat(formData.price) : 0,
        image_url: imageUrl,
        is_public: true,
        is_for_sale: true,
        is_vertical: false,
      });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Success!",
        description: "Your design has been listed on the marketplace.",
      });

      navigate("/marketplace");
    } catch (error) {
      console.error("Error listing design:", error);
      toast({
        title: "Error",
        description: "Failed to list your design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sell Your Design | IDForge</title>
        <meta
          name="description"
          content="List your AI-generated ID card design for sale on the IDForge marketplace."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header
          isAuthenticated={isAuthenticated}
          user={
            profile
              ? { name: profile.display_name || "User", email: profile.email || "" }
              : null
          }
          onLogout={handleLogout}
        />

        <main className="pt-24 pb-16 container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/marketplace")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>

          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 md:p-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  List Your <span className="neon-text">Design</span>
                </h1>
                <p className="text-muted-foreground">
                  Share your creation with the community and earn from your designs
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Design Image *
                  </Label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="design-image"
                    />
                    <label
                      htmlFor="design-image"
                      className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer bg-secondary/30 transition-colors overflow-hidden"
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-8">
                          <div className="p-4 rounded-full bg-primary/10">
                            <Upload className="w-8 h-8 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium">Click to upload your design</p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                    Design Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Modern Tech Company Badge"
                    maxLength={100}
                  />
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-base font-semibold mb-2 block">
                    Short Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Senior Developer"
                    maxLength={200}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold mb-2 block"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your design, its unique features, and ideal use cases..."
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {formData.description.length}/1000
                  </p>
                </div>

                {/* Style */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">Style</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) =>
                      setFormData({ ...formData, style: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor="price" className="text-base font-semibold mb-2 block">
                    Price (USD)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00 (Free)"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty or enter 0 for free designs
                  </p>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="neon"
                  className="w-full"
                  disabled={isSubmitting || !formData.name.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Listing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      List on Marketplace
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
