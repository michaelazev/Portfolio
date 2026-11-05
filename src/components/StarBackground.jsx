import { useEffect, useRef } from "react";
import { prefersReducedMotion, systemPrefersCalm } from "@/lib/content";

const DARK_TINTS = ["255,255,255", "255,255,255", "205,195,255", "255,226,170", "180,215,255"];
const LIGHT_TINTS = ["52,48,130", "52,48,130", "98,70,200"];

const random = (min, max) => Math.random() * (max - min) + min;

/**
 * Céu estrelado em canvas: três profundidades com paralaxe, estrelas que esticam
 * conforme a velocidade da rolagem (efeito de dobra) e meteoros.
 * No tema claro, vira uma carta celeste com linhas de constelação.
 */
export const StarBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduced = prefersReducedMotion();
    const noStreaks = reduced || systemPrefersCalm();

    let width = 0;
    let height = 0;
    let stars = [];
    let links = [];
    let meteors = [];
    let frame = 0;
    let nextMeteorAt = performance.now() + 1500;
    let lastScroll = window.scrollY;
    let warp = 0;
    let mouseX = 0;
    let mouseY = 0;
    let easedX = 0;
    let easedY = 0;
    let isDark = document.documentElement.classList.contains("dark");

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(420, Math.floor((width * height) / 5200));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random() ** 2 * 0.85 + 0.15;
        return {
          x: random(0, width),
          y: random(0, height),
          depth,
          radius: 0.4 + depth * 1.3,
          base: random(0.35, 1),
          phase: random(0, Math.PI * 2),
          speed: random(0.4, 1.6),
          tint: Math.floor(random(0, 5)),
        };
      });

      // Liga estrelas próximas e profundas para as linhas da carta celeste.
      links = [];
      const near = stars.filter((star) => star.depth > 0.5);
      near.forEach((star, index) => {
        for (let i = index + 1; i < near.length; i++) {
          const other = near[i];
          if (Math.hypot(star.x - other.x, star.y - other.y) < 130) {
            links.push([star, other]);
            break;
          }
        }
      });
    };

    const place = (star, scroll) => {
      const y = star.y - scroll * star.depth * 0.22 + easedY * star.depth * 14;
      const x = star.x + easedX * star.depth * 14;
      return {
        x: ((x % width) + width) % width,
        y: ((y % height) + height) % height,
      };
    };

    const spawnMeteor = (now) => {
      const fromRight = Math.random() > 0.35;
      meteors.push({
        x: fromRight ? random(width * 0.45, width + 80) : random(-80, width * 0.5),
        y: random(-60, height * 0.45),
        vx: (fromRight ? -1 : 1) * random(7, 13),
        vy: random(3, 6),
        length: random(90, 220),
        life: 1,
      });
      nextMeteorAt = now + random(2600, 7500);
    };

    const draw = (now) => {
      const scroll = window.scrollY;
      warp += (Math.min(Math.abs(scroll - lastScroll), 90) - warp) * 0.12;
      lastScroll = scroll;
      easedX += (mouseX - easedX) * 0.04;
      easedY += (mouseY - easedY) * 0.04;

      ctx.clearRect(0, 0, width, height);
      const tints = isDark ? DARK_TINTS : LIGHT_TINTS;

      if (!isDark) {
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = "rgba(52,48,130,0.13)";
        ctx.beginPath();
        for (const [a, b] of links) {
          const pa = place(a, scroll);
          const pb = place(b, scroll);
          if (Math.hypot(pa.x - pb.x, pa.y - pb.y) < 200) {
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
          }
        }
        ctx.stroke();
      }

      for (const star of stars) {
        const { x, y } = place(star, scroll);
        const twinkle = reduced ? 1 : 0.65 + 0.35 * Math.sin(now * 0.001 * star.speed + star.phase);
        const alpha = star.base * twinkle * (isDark ? 1 : 0.55);
        const color = tints[star.tint % tints.length];
        // Sem loop contínuo, o último valor ficaria congelado e as estrelas virariam riscos parados.
        const stretch = noStreaks ? 0 : warp * star.depth * 0.9;

        if (stretch > 1.2) {
          ctx.strokeStyle = `rgba(${color},${alpha})`;
          ctx.lineWidth = star.radius;
          ctx.beginPath();
          ctx.moveTo(x, y - stretch);
          ctx.lineTo(x, y + stretch);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${color},${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (reduced) return;

      if (now > nextMeteorAt && !document.hidden) spawnMeteor(now);
      const meteorColor = isDark ? "255,255,255" : "98,70,200";
      meteors = meteors.filter((meteor) => meteor.life > 0);
      for (const meteor of meteors) {
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life -= 0.012;
        const size = Math.hypot(meteor.vx, meteor.vy);
        const tailX = meteor.x - (meteor.vx / size) * meteor.length;
        const tailY = meteor.y - (meteor.vy / size) * meteor.length;
        const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(${meteorColor},${Math.max(meteor.life, 0)})`);
        gradient.addColorStop(1, `rgba(${meteorColor},0)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };

    const onResize = () => {
      // Celulares disparam resize ao esconder a barra de endereço: só refaz se mudar de verdade.
      if (window.innerWidth === width && Math.abs(window.innerHeight - height) < 120) return;
      build();
      start();
    };
    const onPointer = (event) => {
      mouseX = event.clientX / window.innerWidth - 0.5;
      mouseY = event.clientY / window.innerHeight - 0.5;
    };
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else start();
    };
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      start();
    });

    build();
    start();
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    if (reduced) window.addEventListener("scroll", start, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", start);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="nebula absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};
