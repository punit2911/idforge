import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IDCardProps {
  style: "corporate" | "student" | "futuristic" | "minimal" | "creative";
  name?: string;
  title?: string;
  id?: string;
  imageUrl?: string;
  isVertical?: boolean;
  className?: string;
  animated?: boolean;
}

const styleConfigs = {
  corporate: {
    bg: "from-slate-800 via-slate-700 to-slate-900",
    accent: "bg-primary",
    text: "text-white",
  },
  student: {
    bg: "from-blue-600 via-blue-500 to-indigo-700",
    accent: "bg-yellow-400",
    text: "text-white",
  },
  futuristic: {
    bg: "from-gray-900 via-purple-900 to-gray-900",
    accent: "bg-gradient-to-r from-cyan-400 to-purple-500",
    text: "text-white",
  },
  minimal: {
    bg: "from-gray-100 via-white to-gray-100",
    accent: "bg-gray-800",
    text: "text-gray-800",
  },
  creative: {
    bg: "from-pink-500 via-orange-400 to-yellow-400",
    accent: "bg-white",
    text: "text-white",
  },
};

export function IDCard({
  style = "futuristic",
  name = "John Doe",
  title = "Software Engineer",
  id = "ID-2024-0001",
  imageUrl,
  isVertical = false,
  className,
  animated = true,
}: IDCardProps) {
  const config = styleConfigs[style];

  const CardContent = () => (
    <>
      {/* Holographic overlay */}
      <div className="absolute inset-0 opacity-30 holographic-bg" />
      
      {/* Scanlines */}
      <div className="scanline" />

      {/* Card content */}
      <div className={cn(
        "relative z-10 h-full flex gap-4 p-4",
        isVertical ? "flex-col items-center text-center" : "flex-row items-start"
      )}>
        {/* Photo */}
        <div className={cn(
          "rounded-lg overflow-hidden border-2 border-white/30 flex-shrink-0",
          isVertical ? "w-20 h-24" : "w-16 h-20"
        )}>
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={cn("flex-1 min-w-0", isVertical && "w-full")}>
          <h3 className={cn("font-display font-bold text-lg truncate", config.text)}>
            {name}
          </h3>
          <p className={cn("text-sm opacity-80 truncate", config.text)}>
            {title}
          </p>
          <div className={cn("mt-2 text-xs font-mono opacity-60", config.text)}>
            {id}
          </div>
        </div>

        {/* Chip / QR placeholder */}
        <div className={cn(
          "absolute bottom-3 right-3 w-8 h-6 rounded-sm",
          style === "futuristic" 
            ? "bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500" 
            : "bg-yellow-500/80"
        )}>
          <div className="grid grid-cols-3 gap-px p-1 h-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-yellow-600/50 rounded-[1px]" />
            ))}
          </div>
        </div>

        {/* Logo area */}
        <div className={cn(
          "absolute top-3 right-3 w-6 h-6 rounded-full",
          config.accent
        )} />
      </div>

      {/* Border glow for futuristic style */}
      {style === "futuristic" && (
        <div className="absolute inset-0 rounded-xl border border-cyan-400/30 pointer-events-none" />
      )}
    </>
  );

  if (animated) {
    return (
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-xl bg-gradient-to-br shadow-xl",
          config.bg,
          isVertical ? "aspect-[1/1.586]" : "aspect-[1.586/1]",
          className
        )}
        whileHover={{ 
          rotateY: 5, 
          rotateX: -5, 
          scale: 1.02,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      >
        <CardContent />
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br shadow-xl",
        config.bg,
        isVertical ? "aspect-[1/1.586]" : "aspect-[1.586/1]",
        className
      )}
    >
      <CardContent />
    </div>
  );
}
