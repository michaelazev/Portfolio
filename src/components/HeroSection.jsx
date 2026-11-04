import { ArrowDown, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ParticleName } from "./ParticleName";
import { content, prefersReducedMotion } from "@/lib/content";

const useTypewriter = (phrases) => {
  const [text, setText] = useState(phrases[0] ?? "");

  useEffect(() => {
    if (phrases.length < 2 || prefersReducedMotion()) return undefined;

    let phrase = 0;
    let length = phrases[0].length;
    let deleting = true;
    let timer;

    const tick = () => {
      const current = phrases[phrase];
      length += deleting ? -1 : 1;
      setText(current.slice(0, length));

      let delay = deleting ? 28 : 58;
      if (!deleting && length === current.length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && length === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        delay = 280;
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 2800);
    return () => clearTimeout(timer);
  }, [phrases]);

  return text;
};

export const HeroSection = () => {
  const { profile } = content;
  const stageRef = useRef(null);
  const typed = useTypewriter(profile.rotating ?? []);
  const nameLines = profile.name.split(" ");

  return (
    <section id="hero" className="relative z-10 flex min-h-svh flex-col items-center justify-center px-4 pt-24 pb-20 text-center">
      <div className="container relative z-10">
        {profile.available && (
          <p className="mb-7 inline-flex items-center gap-2.5 rounded-full border bg-card/60 px-4 py-1.5 font-mono text-[11px] whitespace-nowrap backdrop-blur-sm sm:text-xs opacity-0 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-signal" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {profile.availabilityText}
          </p>
        )}
      </div>

      <div ref={stageRef} className="relative w-full py-3">
        <ParticleName lines={nameLines} stageRef={stageRef} />
      </div>

      <div className="container relative z-10 mt-7">
        <p className="mx-auto max-w-2xl text-lg font-medium text-pretty md:text-xl opacity-0 animate-fade-in-delay-2">
          {profile.role}. {profile.tagline}
        </p>

        <p className="mt-4 flex min-h-7 flex-wrap items-center justify-center gap-x-2 font-mono text-sm text-muted-foreground md:text-base opacity-0 animate-fade-in-delay-3">
          <span className="text-primary">&gt;</span> construindo
          <span className="typing-caret text-foreground">{typed}</span>
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row opacity-0 animate-fade-in-delay-4">
          <a href="#projects" className="cosmic-button w-full sm:w-auto">
            Explorar projetos
          </a>
          {profile.cvUrl && (
<a href={profile.cvUrl} download="Curriculo-Michael-Azevedo.pdf" className="ghost-button w-full sm:w-auto">
            <Download size={17} /> Baixar currículo
          </a>
)}
        </div>
      </div>

      <span className="absolute bottom-6 left-6 z-10 hidden font-mono text-[11px] leading-relaxed tracking-wider text-muted-foreground lg:block" aria-hidden="true">
        {profile.coordinates}
        <br />
        {profile.location}
      </span>

      <a href="#about" aria-label="Rolar até a seção Sobre" className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary">
        <span className="font-mono text-[11px] tracking-widest uppercase">Decolar</span>
        <ArrowDown className="h-4 w-4 animate-bounce text-primary" />
      </a>
    </section>
  );
};
