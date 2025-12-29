import { motion } from "framer-motion";
import { IDCard } from "./IDCard";

const sampleCards = [
  { style: "corporate" as const, name: "Sarah Chen", title: "CEO & Founder", id: "EMP-2024-001" },
  { style: "futuristic" as const, name: "Marcus Webb", title: "AI Engineer", id: "TECH-2024-042" },
  { style: "student" as const, name: "Emily Parker", title: "Computer Science", id: "STU-2024-1523" },
  { style: "creative" as const, name: "Alex Rivera", title: "Creative Director", id: "ART-2024-089" },
  { style: "minimal" as const, name: "James Liu", title: "Product Manager", id: "PM-2024-034" },
  { style: "futuristic" as const, name: "Nina Patel", title: "Data Scientist", id: "DS-2024-056", isVertical: true },
  { style: "corporate" as const, name: "David Kim", title: "CFO", id: "EXE-2024-003" },
  { style: "student" as const, name: "Sophie Martin", title: "Business Admin", id: "STU-2024-2341" },
  { style: "creative" as const, name: "Jordan Lee", title: "UX Designer", id: "DES-2024-017", isVertical: true },
  { style: "minimal" as const, name: "Chris Taylor", title: "Engineer", id: "ENG-2024-128" },
  { style: "futuristic" as const, name: "Ava Johnson", title: "Security Analyst", id: "SEC-2024-011" },
  { style: "corporate" as const, name: "Michael Brown", title: "VP Operations", id: "OPS-2024-007" },
  { style: "student" as const, name: "Emma Wilson", title: "Medicine", id: "MED-2024-892", isVertical: true },
  { style: "creative" as const, name: "Lucas Garcia", title: "Motion Designer", id: "MOT-2024-045" },
  { style: "minimal" as const, name: "Olivia Davis", title: "Consultant", id: "CON-2024-067" },
];

export function CardGallery() {
  return (
    <section id="gallery" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            <span className="neon-text">AI-Generated</span> Designs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our gallery of unique identity card designs. Each one is crafted with precision and style.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sampleCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={card.isVertical ? "row-span-2" : ""}
            >
              <IDCard
                style={card.style}
                name={card.name}
                title={card.title}
                id={card.id}
                isVertical={card.isVertical}
                className="w-full"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
