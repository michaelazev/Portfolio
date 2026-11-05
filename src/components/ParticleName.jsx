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
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const reduced = prefersReducedMotion();
    // No computador, "reduzir movimento" mantém o texto liso. No toque, as estrelas só
    // se movem com o dedo: sem voo inicial e sem cometa, respeitando a preferência.
    if (reduced && !isTouch) return undefined;
    const hasComet = isTouch && !reduced;

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
    let cometStart = null;
    let cometDirection = 1;

    const cometPoint = (progress) => ({
      x: -60 + (cometDirection > 0 ? progress : 1 - progress) * (cssWidth + 120),
      y: cssHeight * (0.5 + 0.3 * Math.sin(progress * Math.PI * 2)),
    });

    /** Sem mouse no celular: um cometa cruza o nome de tempos em tempos e espalha as estrelas. */
    const updateComet = (now) => {
      if (!hasComet) return null;
      if (cometStart === null) cometStart = now + 2400;
      const progress = (now - cometStart) / 2600;
      if (progress < 0) return null;
      if (progress >= 1) {
        cometStart = now + 1500;
        cometDirection *= -1;
        return null;
      }
      return { ...cometPoint(progress), tail: cometPoint(Math.max(0, progress - 0.07)) };
    };

    const drawComet = ({ x, y, tail }) => {
      const gradient = ctx.createLinearGradient(x, y, tail.x, tail.y);
      gradient.addColorStop(0, palette[palette.length - 1]);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tail.x, tail.y);
      ctx.stroke();
      ctx.fillStyle = palette[0];
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    };

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
      // No celular as letras são menores: pontos mais finos para ainda parecerem estrelas.
      dotSize = gap * (isTouch ? 0.62 : 0.78);
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
          x: builtOnce || reduced ? tx : Math.random() * cssWidth,
          y: builtOnce || reduced ? ty : Math.random() * cssHeight,
          vx: 0,
          vy: 0,
          pull: 0.012 + Math.random() * 0.022,
          color,
        };
      });
      builtOnce = true;
      kick();
    };

    const step = (now) => {
      frame = 0;
      if (!running) return;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      const buckets = palette.map(() => []);
      let moving = false;

      const comet = pointer ? null : updateComet(now);
      const field = pointer ?? comet;
      const fieldRadius = pointer ? (isTouch ? 5000 : 12000) : 2600;
      const fieldForce = pointer ? 2.6 : 1.9;

      for (const p of particles) {
        p.vx += (p.tx - p.x) * p.pull;
        p.vy += (p.ty - p.y) * p.pull;

        if (field) {
          const dx = p.x - field.x;
          const dy = p.y - field.y;
          const distance = dx * dx + dy * dy;
          if (distance < fieldRadius) {
            const force = (fieldRadius - distance) / fieldRadius;
            const length = Math.sqrt(distance) || 1;
            p.vx += (dx / length) * force * fieldForce;
            p.vy += (dy / length) * force * fieldForce;
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

      if (comet) drawComet(comet);

      // Parado, sem mouse e sem cometa: desliga o loop para poupar bateria.
      if (moving || pointer || hasComet) {
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
    // O navegador cancela os eventos de ponteiro quando a rolagem começa; os de toque
    // continuam e, por serem passivos, não atrapalham a rolagem.
    const onTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      const rect = stage.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      pointer = y < 0 || y > rect.height ? null : { x: touch.clientX - rect.left, y };
      if (pointer) kick();
    };
    const onTouchEnd = () => {
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
    ])
      // Se a fonte falhar, desenha mesmo assim com a fonte que o navegador tiver.
      .catch(() => {})
      .then(() => {
        if (disposed) return;
        build();
        setDrawing(true);
      });

    resizeObserver.observe(stage);
    viewObserver.observe(stage);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    if (isTouch) {
      window.addEventListener("touchstart", onTouchMove, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    } else {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchstart", onTouchMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
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
