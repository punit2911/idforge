import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { ChatBot } from "@/components/ChatBot";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Loader2,
  ShoppingCart,
  Heart,
  User,
  DollarSign,
  Plus,
  ImageIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MarketplaceDesign {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  style: string;
  image_url: string | null;
  price: number | null;
  is_for_sale: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const [designs, setDesigns] = useState<MarketplaceDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [priceSort, setPriceSort] = useState<string>("newest");

  useEffect(() => {
    fetchMarketplaceDesigns();
  }, []);

  const fetchMarketplaceDesigns = async () => {
    setLoading(true);
    
    // First, get the designs
    const { data: designsData, error: designsError } = await supabase
      .from("saved_designs")
      .select("*")
      .eq("is_for_sale", true)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (designsError) {
      console.error("Error fetching marketplace designs:", designsError);
      toast({
        title: "Error",
        description: "Failed to load marketplace designs",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Then fetch profiles for each design
    if (designsData && designsData.length > 0) {
      const userIds = [...new Set(designsData.map((d) => d.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map((p) => [p.user_id, p]) || []
      );

      const designsWithProfiles = designsData.map((design) => ({
        ...design,
        profiles: profilesMap.get(design.user_id) || null,
      }));

      setDesigns(designsWithProfiles);
    } else {
      setDesigns([]);
    }
    
    setLoading(false);
  };

  const filteredDesigns = designs
    .filter((design) => {
      const matchesSearch =
        design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStyle = styleFilter === "all" || design.style === styleFilter;
      return matchesSearch && matchesStyle;
    })
    .sort((a, b) => {
      switch (priceSort) {
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleContact = (design: MarketplaceDesign) => {
    toast({
      title: "Contact Feature",
      description: `Interested in "${design.name}"? Contact the seller to purchase.`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Marketplace | IDForge</title>
        <meta
          name="description"
          content="Browse and purchase unique AI-generated ID card designs from creators around the world."
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
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Design <span className="neon-text">Marketplace</span>
            </h1>
            <p className="text-muted-foreground">
              Discover and purchase unique ID card designs from creators worldwide
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={styleFilter} onValueChange={setStyleFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="futuristic">Futuristic</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceSort} onValueChange={setPriceSort}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {isAuthenticated && (
                <Button variant="neon" onClick={() => navigate("/sell")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Sell Design
                </Button>
              )}
            </div>
          </div>

          {/* Designs Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No designs found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || styleFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Be the first to list a design for sale!"}
              </p>
              {isAuthenticated && (
                <Button variant="neon" onClick={() => navigate("/sell")}>
                  <Plus className="w-4 h-4 mr-2" />
                  List Your Design
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDesigns.map((design, index) => (
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

                    {/* Price Badge */}
                    {design.price !== null && design.price > 0 && (
                      <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {design.price}
                      </div>
                    )}

                    {design.price === 0 && (
                      <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-accent text-accent-foreground font-semibold text-sm">
                        Free
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{design.name}</h3>
                    {design.title && (
                      <p className="text-sm text-muted-foreground truncate">
                        {design.title}
                      </p>
                    )}
                    {design.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {design.description}
                      </p>
                    )}

                    {/* Seller Info */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {design.profiles?.avatar_url ? (
                          <img
                            src={design.profiles.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {design.profiles?.display_name || "Anonymous"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
                        {design.style}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="neon"
                      className="w-full mt-3"
                      onClick={() => handleContact(design)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {design.price && design.price > 0
                        ? `Buy for $${design.price}`
                        : "Get Design"}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>

        <ChatBot />
      </div>
    </>
  );
}
