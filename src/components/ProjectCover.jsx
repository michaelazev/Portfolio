import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { hashString, seededRandom } from "@/lib/content";

// Violetas, azuis, ciano, magenta e âmbar: conversam com a paleta do site.
const PLANET_HUES = [262, 225, 195, 330, 18, 40, 290, 205];

/** Arte gerada a partir do nome: cada projeto sem imagem vira um planeta só dele. */
const PlanetArt = ({ seedText, className }) => {
  const uid = useId().replace(/:/g, "");
  const art = useMemo(() => {
    const random = seededRandom(hashString(seedText));
    const hue = PLANET_HUES[Math.floor(random() * PLANET_HUES.length)];
    const radius = 62 + random() * 46;
    const cx = 240 + random() * 170;
    const cy = 110 + random() * 80;
    return {
      hue,
      radius,
      cx,
      cy,
      tilt: -28 + random() * 56,
      hasRing: random() > 0.35,
      bands: Array.from({ length: 5 }, () => ({
        y: cy - radius + random() * radius * 2,
        height: 4 + random() * 16,
        opacity: 0.06 + random() * 0.2,
      })),
      stars: Array.from({ length: 46 }, () => ({
        x: random() * 640,
        y: random() * 300,
        r: 0.3 + random() * 1.1,
        o: 0.25 + random() * 0.75,
      })),
      moon: random() > 0.45 ? { angle: random() * Math.PI * 2, r: 5 + random() * 8 } : null,
    };
  }, [seedText]);

  const { hue, radius, cx, cy, tilt, hasRing, bands, stars, moon } = art;
  const ring = (front) => (
    <path
      d={front
        ? `M ${cx - radius * 1.75} ${cy} A ${radius * 1.75} ${radius * 0.42} 0 0 0 ${cx + radius * 1.75} ${cy}`
        : `M ${cx - radius * 1.75} ${cy} A ${radius * 1.75} ${radius * 0.42} 0 0 1 ${cx + radius * 1.75} ${cy}`}
      fill="none"
      stroke={`hsl(${hue + 40} 90% 82%)`}
      strokeOpacity={front ? 0.85 : 0.35}
      strokeWidth="5"
      transform={`rotate(${tilt} ${cx} ${cy})`}
    />
  );

  return (
    <svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Arte do projeto ${seedText}`}>
      <defs>
        <radialGradient id={`${uid}-planet`} cx="32%" cy="28%" r="80%">
          <stop offset="0" stopColor={`hsl(${hue} 95% 78%)`} />
          <stop offset=".55" stopColor={`hsl(${hue + 22} 72% 46%)`} />
          <stop offset="1" stopColor={`hsl(${hue + 50} 70% 12%)`} />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={`hsl(${hue} 95% 65%)`} stopOpacity=".45" />
          <stop offset="1" stopColor={`hsl(${hue} 95% 65%)`} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <circle cx={cx} cy={cy} r={radius} />
        </clipPath>
      </defs>
      <rect width="640" height="300" fill="hsl(232 45% 6%)" />
      {stars.map((star, index) => (
        <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff" opacity={star.o} />
      ))}
      <circle cx={cx} cy={cy} r={radius * 2.3} fill={`url(#${uid}-glow)`} />
      {hasRing && ring(false)}
      <circle cx={cx} cy={cy} r={radius} fill={`url(#${uid}-planet)`} />
      <g clipPath={`url(#${uid}-clip)`}>
        {bands.map((band, index) => (
          <rect key={index} x={cx - radius} y={band.y} width={radius * 2} height={band.height} fill="#fff" opacity={band.opacity} transform={`rotate(${tilt} ${cx} ${cy})`} />
        ))}
      </g>
      {hasRing && ring(true)}
      {moon && (
        <circle cx={cx + Math.cos(moon.angle) * radius * 2.1} cy={cy + Math.sin(moon.angle) * radius * 1.3} r={moon.r} fill={`hsl(${hue + 90} 40% 78%)`} />
      )}
    </svg>
  );
};

/** Usa a imagem do projeto; se não houver, ou se ela falhar, desenha o planeta. */
export const ProjectCover = ({ project, src, className, imgClassName, loading = "lazy" }) => {
  const image = src ?? project.cover;
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = image && failedSrc !== image;
  const artClass = cn("h-full w-full", imgClassName);

  return (
    <div className={cn("overflow-hidden bg-secondary", className)}>
      {showImage ? (
        <img src={image} alt={`Tela do projeto ${project.title}`} loading={loading} className={cn("h-full w-full object-cover", imgClassName)} onError={() => setFailedSrc(image)} />
      ) : (
        <PlanetArt seedText={project.title || "projeto"} className={artClass} />
      )}
    </div>
  );
};
