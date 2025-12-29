import { motion } from "framer-motion";
import { 
  Wand2, 
  Layers, 
  Download, 
  Palette, 
  Smartphone, 
  Shield, 
  Zap, 
  RefreshCw,
  Eye,
  Heart,
  Share2,
  Moon,
  Sparkles,
  Box,
  Image
} from "lucide-react";

const features = [
  {
    icon: <Wand2 className="w-6 h-6" />,
    title: "AI-Powered Generation",
    description: "Create unique 2D and 3D identity cards using advanced AI technology",
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: "Multiple Styles",
    description: "Choose from corporate, student, futuristic, minimal, and creative designs",
  },
  {
    icon: <Box className="w-6 h-6" />,
    title: "3D Card Mockups",
    description: "Generate stunning 3D visualizations of your identity cards",
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "Export Options",
    description: "Download your designs in PNG and PDF formats",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Live Preview",
    description: "See changes in real-time before generating the final design",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Custom Prompts",
    description: "Describe your vision and let AI bring it to life",
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: "Regenerate & Vary",
    description: "Not satisfied? Generate variations with a single click",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Save Favorites",
    description: "Save your best designs to your personal collection",
  },
  {
    icon: <Image className="w-6 h-6" />,
    title: "Public Gallery",
    description: "Explore designs from the community with infinite scroll",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Fully Responsive",
    description: "Create cards on any device - mobile, tablet, or desktop",
  },
  {
    icon: <Moon className="w-6 h-6" />,
    title: "Dark & Light Mode",
    description: "Switch between themes for comfortable designing",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Animated Effects",
    description: "Beautiful hover effects and card reveal animations",
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: "Easy Sharing",
    description: "Share your designs directly to social media",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure Auth",
    description: "Sign in securely with your Google account",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast",
    description: "Generate designs in seconds, not minutes",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Packed with <span className="neon-text">Features</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional identity cards, all in one place.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group p-6 rounded-2xl glass-card-hover"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
