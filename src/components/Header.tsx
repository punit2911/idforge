import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, CreditCard, Sparkles, User, LogOut, Moon, Sun, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface HeaderProps {
  isAuthenticated?: boolean;
  user?: { name: string; email: string; avatar?: string } | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Header({ isAuthenticated, user, onLogin, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 backdrop-blur-xl bg-background/70 border-b border-border/50" />
      
      <nav className="relative container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.a
          href="/"
          className="flex items-center gap-2 font-display font-bold text-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-neon-purple to-accent flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary via-neon-purple to-accent blur-lg opacity-50" />
          </div>
          <span className="hidden sm:block">
            <span className="neon-text">ID</span>
            <span className="text-foreground">Forge</span>
          </span>
        </motion.a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#gallery" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Gallery
          </a>
          <a href="#create" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Create
          </a>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="neon" size="sm" onClick={onLogin} className="hidden sm:flex">
              <Sparkles className="w-4 h-4" />
              Sign In
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden relative bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <a href="#gallery" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                Gallery
              </a>
              <a href="#create" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                Create
              </a>
              <a href="#features" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={onLogout} className="justify-start">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="neon" onClick={onLogin}>
                  <Sparkles className="w-4 h-4" />
                  Sign In with Google
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
