import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SectionHeading, useInView } from "./Reveal";
import { SKILL_CATEGORIES, content, hashString, seededRandom, skillTier } from "@/lib/content";

const WIDTH = 360;
const HEIGHT = 330;
const LABEL_CHAR = 7;

const starRadius = (level) => 2.4 + (level / 100) * 4.6;

/** Espalha as estrelas sem sobrepor rótulos e liga cada uma à vizinha mais próxima. */
const layoutConstellation = (id, skills) => {
  const random = seededRandom(hashString(id));
  const placed = [];

  const boxOf = (skill, x, y) => {
    const width = skill.name.length * LABEL_CHAR + 8;
    const left = x > WIDTH * 0.62 ? x - width : x - 8;
    return { left, right: left + width, top: y - 14, bottom: y + 28 };
  };
  const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  skills.forEach((skill) => {
    let best = null;
    for (let attempt = 0; attempt < 160; attempt++) {
      const x = 22 + random() * (WIDTH - 44);
      const y = 24 + random() * (HEIGHT - 66);
      const box = boxOf(skill, x, y);
      if (box.left < 2 || box.right > WIDTH - 2) continue;
      if (!placed.some((other) => overlaps(box, other.box))) {
        best = { x, y, box };
        break;
      }
    }
    if (!best) {
      const x = 22 + random() * (WIDTH - 44);
      const y = 24 + random() * (HEIGHT - 66);
      best = { x, y, box: boxOf(skill, x, y) };
    }
    placed.push({ ...best, skill });
  });

  const links = [];
  const connected = placed.length ? [placed[0]] : [];
  const remaining = placed.slice(1);
  while (remaining.length) {
    let nearest = null;
    for (const from of connected) {
      for (const to of remaining) {
        const distance = Math.hypot(from.x - to.x, from.y - to.y);
        if (!nearest || distance < nearest.distance) nearest = { from, to, distance };
      }
    }
    links.push(nearest);
    connected.push(nearest.to);
    remaining.splice(remaining.indexOf(nearest.to), 1);
  }

  return { nodes: placed, links };
};

const Constellation = ({ category, skills, large }) => {
  const [ref, inView] = useInView();
  const [focused, setFocused] = useState(null);
  const { nodes, links } = useMemo(() => layoutConstellation(category.id, skills), [category.id, skills]);

  return (
    <article
      ref={ref}
      className={cn("gradient-border flex flex-col p-5", inView && "is-visible", large && "mx-auto w-full max-w-2xl")}
    >
      <p className="kicker">{category.label}</p>
      <h3 className="mt-1 text-lg font-bold">{category.constellation}</h3>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full" role="img" aria-label={`${category.label}: ${skills.map((s) => `${s.name}, ${skillTier(s.level)}`).join("; ")}`}>
        {links.map((link, index) => (
          <line
            key={`${link.from.skill.name}-${link.to.skill.name}`}
            x1={link.from.x}
            y1={link.from.y}
            x2={link.to.x}
            y2={link.to.y}
            pathLength="1"
            className="constellation-line"
            stroke="hsl(var(--primary))"
            strokeOpacity="0.45"
            strokeWidth="1"
            style={{ "--line-delay": `${index * 130}ms` }}
          />
        ))}

        {nodes.map(({ x, y, skill }, index) => {
          const radius = starRadius(skill.level);
          const alignEnd = x > WIDTH * 0.62;
          return (
            <g
              key={skill.name}
              className="skill-node constellation-star"
              tabIndex={0}
              style={{ "--line-delay": `${index * 130}ms` }}
              onMouseEnter={() => setFocused(skill)}
              onMouseLeave={() => setFocused(null)}
              onFocus={() => setFocused(skill)}
              onBlur={() => setFocused(null)}
            >
              <circle cx={x} cy={y} r="22" fill="transparent" />
              <circle className="halo" cx={x} cy={y} r={radius * 2.5} fill="hsl(var(--primary))" opacity="0.22" />
              <circle cx={x} cy={y} r={radius} fill={skill.level >= 85 ? "hsl(var(--gold))" : "hsl(var(--foreground))"} />
              <text
                x={x}
                y={y + radius + 15}
                textAnchor={alignEnd ? "end" : "start"}
                dx={alignEnd ? 8 : -8}
                className="fill-foreground font-sans text-[12.5px] font-semibold transition-colors"
              >
                {skill.name}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-1 min-h-5 font-mono text-xs text-muted-foreground" aria-live="polite">
        {focused ? (
          <>
            <span className="text-primary">{focused.name}</span> · {skillTier(focused.level)}
          </>
        ) : (
          `${skills.length} estrelas · explore o mapa`
        )}
      </p>
    </article>
  );
};

export const SkillsSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const filters = [{ id: "all", label: "Todas" }, ...SKILL_CATEGORIES];

  const groups = useMemo(
    () =>
      SKILL_CATEGORIES.map((category) => ({
        category,
        skills: content.skills.filter((skill) => skill.category === category.id),
      })).filter((group) => group.skills.length > 0),
    [],
  );
  const shown = groups.filter((group) => activeCategory === "all" || group.category.id === activeCategory);

  return (
    <section id="skills" className="relative z-10 px-4 py-24 md:py-32">
      <div className="container">
        <SectionHeading
          kicker="// mapa estelar"
          title="Minhas"
          accent="habilidades"
          text="Cada tecnologia é uma estrela: quanto maior o brilho, mais experiência tenho com ela. As douradas são as que mais domino."
        />

        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar habilidades">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveCategory(filter.id)}
              aria-pressed={activeCategory === filter.id}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-semibold transition-colors duration-300",
                activeCategory === filter.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card/60 text-foreground hover:border-primary/60",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className={cn("grid grid-cols-1 gap-5", activeCategory === "all" && "md:grid-cols-2 lg:grid-cols-3")}>
          {shown.map(({ category, skills }) => (
            <Constellation key={category.id} category={category} skills={skills} large={activeCategory !== "all"} />
          ))}
        </div>
      </div>
    </section>
  );
};
