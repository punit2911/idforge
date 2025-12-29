import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IDCard } from "./IDCard";
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
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  onLoginRequired?: () => void;
}

export function CardCreator({ isAuthenticated, onLoginRequired }: CardCreatorProps) {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>("futuristic");
  const [isVertical, setIsVertical] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [name, setName] = useState("John Doe");
  const [title, setTitle] = useState("Software Engineer");
  const [customPrompt, setCustomPrompt] = useState("");

  const handleGenerate = async () => {
    if (!isAuthenticated && onLoginRequired) {
      onLoginRequired();
      return;
    }
    
    setIsGenerating(true);
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!isAuthenticated && onLoginRequired) {
      onLoginRequired();
      return;
    }
    // Download logic would go here
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

            {/* Custom Prompt */}
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
                disabled={isGenerating}
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
              <Button variant="glass" size="lg" onClick={() => setSelectedStyle(styles[Math.floor(Math.random() * styles.length)].id)}>
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
                  <IDCard
                    style={selectedStyle}
                    name={name}
                    title={title}
                    id={`ID-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`}
                    isVertical={isVertical}
                    className="w-full"
                  />
                </motion.div>

                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-2xl">
                    <div className="flex items-center gap-3 text-primary">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="font-display font-semibold">Generating...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Download Actions */}
              <div className="flex gap-3 mt-6">
                <Button variant="neon" className="flex-1" onClick={handleDownload}>
                  <Download className="w-5 h-5" />
                  Download PNG
                </Button>
                <Button variant="glass" className="flex-1" onClick={handleDownload}>
                  <Download className="w-5 h-5" />
                  Download PDF
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
