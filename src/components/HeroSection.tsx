import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CreditCard } from "lucide-react";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[200px]" />

      {/* Floating cards background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[15%] left-[10%] w-48 opacity-20"
          animate={{ y: [-20, 20, -20], rotate: [-5, 5, -5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="aspect-[1.586/1] rounded-xl bg-gradient-to-br from-primary/50 to-accent/50 backdrop-blur" />
        </motion.div>
        <motion.div
          className="absolute bottom-[20%] right-[15%] w-56 opacity-20"
          animate={{ y: [20, -20, 20], rotate: [5, -5, 5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="aspect-[1.586/1] rounded-xl bg-gradient-to-br from-neon-purple/50 to-primary/50 backdrop-blur" />
        </motion.div>
        <motion.div
          className="absolute top-[40%] right-[8%] w-32 opacity-15"
          animate={{ y: [-15, 15, -15], rotate: [-3, 3, -3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="aspect-[1/1.586] rounded-xl bg-gradient-to-br from-accent/50 to-neon-purple/50 backdrop-blur" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Identity Card Generator</span>
          </motion.div>

          {/* Heading */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
            <span className="block text-foreground">Create Stunning</span>
            <span className="block neon-text">ID Cards</span>
            <span className="block text-foreground">with AI</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Generate professional, unique identity card designs in seconds. 
            From corporate badges to creative student IDs, powered by cutting-edge AI.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" onClick={onGetStarted}>
              <Sparkles className="w-5 h-5" />
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl" asChild>
              <a href="#gallery">
                <CreditCard className="w-5 h-5" />
                View Gallery
              </a>
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { value: "10K+", label: "Cards Created" },
              { value: "5+", label: "Unique Styles" },
              { value: "2D & 3D", label: "Designs" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-3xl font-bold neon-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
