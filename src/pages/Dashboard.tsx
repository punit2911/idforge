import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { getUserDesigns, toggleFavorite, deleteDesign } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, 
  Trash2, 
  Download, 
  Loader2, 
  ImageIcon, 
  Plus,
  Eye,
  Globe,
  Lock,
  Coins
} from "lucide-react";

interface SavedDesign {
  id: string;
  name: string;
  title: string | null;
  style: string;
  is_vertical: boolean;
  image_url: string | null;
  custom_prompt: string | null;
  is_favorite: boolean;
  is_public: boolean;
  created_at: string;
}

interface UsageInfo {
  tokens_used: number;
  free_limit: number;
  is_premium: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, loading, signOut } = useAuth();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchDesigns();
      fetchUsageInfo();
    }
  }, [user?.id]);

  const fetchUsageInfo = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("usage_tokens")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setUsageInfo({
        tokens_used: data.tokens_used,
        free_limit: data.free_limit,
        is_premium: data.is_premium,
      });
    }
  };

  const fetchDesigns = async () => {
    if (!user?.id) return;
    setLoadingDesigns(true);
    const { data, error } = await getUserDesigns(user.id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load your designs",
        variant: "destructive",
      });
    } else {
      setDesigns(data || []);
    }
    setLoadingDesigns(false);
  };

  const handleToggleFavorite = async (design: SavedDesign) => {
    const { error } = await toggleFavorite(design.id, !design.is_favorite);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    } else {
      setDesigns(designs.map(d => 
        d.id === design.id ? { ...d, is_favorite: !d.is_favorite } : d
      ));
    }
  };

  const handleDelete = async (design: SavedDesign) => {
    if (!confirm("Are you sure you want to delete this design?")) return;
    
    const { error } = await deleteDesign(design.id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete design",
        variant: "destructive",
      });
    } else {
      setDesigns(designs.filter(d => d.id !== design.id));
      toast({
        title: "Deleted",
        description: "Design has been deleted",
      });
    }
  };

  const handleDownload = (design: SavedDesign) => {
    if (!design.image_url) return;
    
    const link = document.createElement("a");
    link.href = design.image_url;
    link.download = `${design.name}-id-card.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <title>Dashboard | IDForge</title>
        <meta name="description" content="Manage your AI-generated ID card designs" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header 
          isAuthenticated={isAuthenticated}
          user={profile ? { name: profile.display_name || "User", email: profile.email || "" } : null}
          onLogout={handleLogout}
        />

        <main className="pt-24 pb-16 container mx-auto px-4">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              My <span className="neon-text">Designs</span>
            </h1>
            <p className="text-muted-foreground">
              View and manage your saved ID card designs
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="glass-card p-4 rounded-xl">
              <p className="text-2xl font-bold text-primary">{designs.length}</p>
              <p className="text-sm text-muted-foreground">Total Designs</p>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-2xl font-bold text-accent">{designs.filter(d => d.is_favorite).length}</p>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-2xl font-bold text-neon-cyan">{designs.filter(d => d.is_public).length}</p>
              <p className="text-sm text-muted-foreground">Public</p>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-2xl font-bold text-neon-purple">{designs.filter(d => !d.is_public).length}</p>
              <p className="text-sm text-muted-foreground">Private</p>
            </div>
            {/* Token Usage Card */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {usageInfo ? Math.max(0, usageInfo.free_limit - usageInfo.tokens_used) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Tokens Left</p>
                </div>
                <Coins className="w-6 h-6 text-primary/60" />
              </div>
              {usageInfo?.is_premium && (
                <span className="text-xs text-accent">Premium</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button variant="neon" onClick={() => navigate("/#create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Design
            </Button>
          </div>

          {/* Designs Grid */}
          {loadingDesigns ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No designs yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first AI-generated ID card
              </p>
              <Button variant="neon" onClick={() => navigate("/#create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Design
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designs.map((design, index) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl overflow-hidden group"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/2] bg-secondary/50">
                    {design.image_url ? (
                      <img 
                        src={design.image_url} 
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        size="icon" 
                        variant="glass"
                        onClick={() => setSelectedDesign(design)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="glass"
                        onClick={() => handleDownload(design)}
                        disabled={!design.image_url}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="glass"
                        onClick={() => handleToggleFavorite(design)}
                      >
                        <Heart className={`w-4 h-4 ${design.is_favorite ? "fill-accent text-accent" : ""}`} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="glass"
                        onClick={() => handleDelete(design)}
                        className="hover:bg-destructive/20"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Status Badges */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {design.is_favorite && (
                        <span className="p-1.5 rounded-full bg-accent/20 backdrop-blur-sm">
                          <Heart className="w-3 h-3 fill-accent text-accent" />
                        </span>
                      )}
                      {design.is_public ? (
                        <span className="p-1.5 rounded-full bg-neon-cyan/20 backdrop-blur-sm">
                          <Globe className="w-3 h-3 text-neon-cyan" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-full bg-muted/50 backdrop-blur-sm">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{design.name}</h3>
                    {design.title && (
                      <p className="text-sm text-muted-foreground truncate">{design.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
                        {design.style}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(design.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>

        {/* Preview Modal */}
        <AnimatePresence>
          {selectedDesign && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedDesign(null)}
            >
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-2xl w-full glass-card rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedDesign.image_url && (
                  <img 
                    src={selectedDesign.image_url} 
                    alt={selectedDesign.name}
                    className="w-full"
                  />
                )}
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold mb-1">{selectedDesign.name}</h3>
                  {selectedDesign.title && (
                    <p className="text-muted-foreground mb-4">{selectedDesign.title}</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="neon" onClick={() => handleDownload(selectedDesign)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="glass" onClick={() => setSelectedDesign(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}