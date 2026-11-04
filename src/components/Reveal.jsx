import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Mantém a classe `is-visible` a partir do momento em que o elemento entra na tela. */
export const useInView = (rootMargin = "0px 0px -10% 0px") => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView];
};

export const Reveal = ({ as: Tag = "div", delay = 0, className, style, children, ...props }) => {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={cn("reveal", inView && "is-visible", className)}
      style={{ "--reveal-delay": `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
};

export const SectionHeading = ({ kicker, title, accent, text, className }) => (
  <Reveal className={cn("mb-12 max-w-3xl md:mb-14", className)}>
    <p className="kicker mb-4">{kicker}</p>
    <h2 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">
      {title} <span className="text-gradient">{accent}</span>
    </h2>
    {text && <p className="mt-5 text-lg text-pretty text-muted-foreground">{text}</p>}
  </Reveal>
);
