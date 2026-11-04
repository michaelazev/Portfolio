import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/content";

const DARK_PALETTE = ["#ffffff", "#ece7ff", "#d5caff", "#b7a4ff", "#ffe2a8"];
const LIGHT_PALETTE = ["#1d1a5e", "#2c2484", "#3d2fa8", "#5a3fd0", "#a8660a"];

/**
 * O nome se forma a partir de estrelas. O <h1> continua no HTML para leitores de
 * tela e buscadores; só fica transparente enquanto as partículas estão desenhando.
 */
export const ParticleName = ({ lines, stageRef }) => {
  const canvasRef = useRef(null);
  const spanRefs = useRef([]);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const ctx = canvas.getContext("2d");

    let particles = [];
    let frame = 0;
    let running = false;
    let cssWidth = 0;
    let cssHeight = 0;
    let dotSize = 2;
    let pointer = null;
    let visible = true;
    let builtOnce = false;
    let disposed = false;
    let palette = DARK_PALETTE;

    const readPalette = () => {
      palette = document.documentElement.classList.contains("dark") ? DARK_PALETTE : LIGHT_PALETTE;
    };

    const sampleTargets = () => {
      const stageRect = stage.getBoundingClientRect();
      const offscreen = document.createElement("canvas");
      offscreen.width = cssWidth;
      offscreen.height = cssHeight;
      const off = offscreen.getContext("2d", { willReadFrequently: true });
      off.fillStyle = "#fff";

      let fontSize = 0;
      spanRefs.current.forEach((span) => {
        if (!span) return;
        const style = getComputedStyle(span);
        const rect = span.getBoundingClientRect();
        fontSize = parseFloat(style.fontSize);
        off.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        if ("letterSpacing" in off) off.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
        off.textBaseline = "alphabetic";
        const metrics = off.measureText(span.textContent);
        const ascent = metrics.fontBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent;
        const baseline = rect.top - stageRect.top + (rect.height - (ascent + descent)) / 2 + ascent;
        off.fillText(span.textContent, rect.left - stageRect.left, baseline);
      });

      const gap = fontSize > 110 ? 3 : 2;
      dotSize = gap * 0.78;
      const { data } = off.getImageData(0, 0, cssWidth, cssHeight);
      const targets = [];
      for (let y = 0; y < cssHeight; y += gap) {
        for (let x = 0; x < cssWidth; x += gap) {
          if (data[(y * cssWidth + x) * 4 + 3] > 128) targets.push({ x, y });
        }
      }
      return targets;
    };

    const build = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = Math.ceil(rect.width);
      cssHeight = Math.ceil(rect.height);
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = sampleTargets().map(({ x, y }) => {
        // Pequeno desvio para esconder a grade; a cor corre em gradiente pelo nome,
        // com uma ou outra estrela dourada.
        const tx = x + (Math.random() - 0.5) * 1.1;
        const ty = y + (Math.random() - 0.5) * 1.1;
        const position = x / cssWidth + (Math.random() - 0.5) * 0.28;
        const color = Math.random() < 0.035 ? palette.length - 1 : Math.max(0, Math.min(palette.length - 2, Math.floor(position * (palette.length - 1))));
        return {
          tx,
          ty,
          // Na primeira vez, as estrelas vêm de longe; num resize, já nascem no lugar.
          x: builtOnce ? tx : Math.random() * cssWidth,
          y: builtOnce ? ty : Math.random() * cssHeight,
          vx: 0,
          vy: 0,
          pull: 0.012 + Math.random() * 0.022,
          color,
        };
      });
      builtOnce = true;
      kick();
    };

    const step = () => {
      frame = 0;
      if (!running) return;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      const buckets = palette.map(() => []);
      let moving = false;

      for (const p of particles) {
        p.vx += (p.tx - p.x) * p.pull;
        p.vy += (p.ty - p.y) * p.pull;

        if (pointer) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distance = dx * dx + dy * dy;
          if (distance < 12000) {
            const force = (12000 - distance) / 12000;
            const length = Math.sqrt(distance) || 1;
            p.vx += (dx / length) * force * 2.6;
            p.vy += (dy / length) * force * 2.6;
          }
        }

        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;

        if (!moving && (Math.abs(p.vx) > 0.03 || Math.abs(p.vy) > 0.03 || Math.abs(p.tx - p.x) > 0.3 || Math.abs(p.ty - p.y) > 0.3)) {
          moving = true;
        }
        buckets[p.color].push(p);
      }

      buckets.forEach((bucket, index) => {
        ctx.fillStyle = palette[index];
        for (const p of bucket) ctx.fillRect(p.x, p.y, dotSize, dotSize);
      });

      // Parado e sem mouse por perto: desliga o loop para poupar bateria.
      if (moving || pointer) {
        frame = requestAnimationFrame(step);
      } else {
        running = false;
      }
    };

    const kick = () => {
      if (disposed || !visible) return;
      running = true;
      if (!frame) frame = requestAnimationFrame(step);
    };

    const onPointerMove = (event) => {
      const rect = stage.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (y < 0 || y > rect.height) {
        pointer = null;
        return;
      }
      pointer = { x, y };
      kick();
    };
    const onPointerLeave = () => {
      pointer = null;
    };

    const resizeObserver = new ResizeObserver(() => {
      if (builtOnce && Math.ceil(stage.getBoundingClientRect().width) !== cssWidth) build();
    });
    const themeObserver = new MutationObserver(() => {
      readPalette();
      kick();
    });
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
      else running = false;
    });

    readPalette();
    Promise.race([
      document.fonts.load('800 100px "Syne Variable"'),
      new Promise((resolve) => setTimeout(resolve, 1800)),
    ]).then(() => {
      if (disposed) return;
      build();
      setDrawing(true);
    });

    resizeObserver.observe(stage);
    viewObserver.observe(stage);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    return () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [stageRef]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" />
      <h1
        className="relative z-10 font-display text-[clamp(2.6rem,13vw,10rem)] leading-[0.98] font-extrabold tracking-[-0.02em]"
        style={{ color: drawing ? "transparent" : undefined }}
      >
        {lines.map((line, index) => (
          <span key={line} className="block">
            <span ref={(element) => (spanRefs.current[index] = element)}>{line}</span>
          </span>
        ))}
      </h1>
    </>
  );
};
