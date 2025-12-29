import { motion } from "framer-motion";
import { CreditCard, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.a
              href="/"
              className="flex items-center gap-2 font-display font-bold text-xl mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-neon-purple to-accent flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="neon-text">ID</span>
              <span>Forge</span>
            </motion.a>
            <p className="text-muted-foreground max-w-sm">
              Create stunning, professional identity cards with the power of AI. 
              From corporate badges to creative student IDs.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#gallery" className="hover:text-foreground transition-colors">Gallery</a></li>
              <li><a href="#create" className="hover:text-foreground transition-colors">Create</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 IDForge. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
