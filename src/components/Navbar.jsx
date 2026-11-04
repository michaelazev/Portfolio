import { cn } from "@/lib/utils";
import { Menu, Sparkle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { name: "Início", href: "#hero" },
  { name: "Sobre", href: "#about" },
  { name: "Habilidades", href: "#skills" },
  { name: "Projetos", href: "#projects" },
  { name: "Contato", href: "#contact" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [active, setActive] = useState("#hero");
  const progressRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    navItems.forEach(({ href }) => {
      const section = document.querySelector(href);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setIsMenuOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav
        aria-label="Principal"
        className={cn(
          "fixed z-50 w-full transition-all duration-300",
          isScrolled ? "bg-background/75 py-3 shadow-xs backdrop-blur-md" : "py-5",
        )}
      >
        <div className="container flex items-center justify-between">
          <a className="group flex items-center gap-2 font-display text-lg font-bold" href="#hero">
            <Sparkle size={18} className="text-primary transition-transform duration-500 group-hover:rotate-180" fill="currentColor" />
            <span className="text-glow">Michael Azevedo</span>
          </a>

          <div className="flex items-center gap-1 md:gap-6">
            <div className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active === item.href ? "true" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors duration-300 hover:text-primary",
                    active === item.href ? "text-primary" : "text-foreground/75",
                  )}
                >
                  {item.name}
                </a>
              ))}
            </div>

            <ThemeToggle />

            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="relative z-50 p-2 text-foreground md:hidden"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-px w-full">
          <div ref={progressRef} className="h-full origin-left scale-x-0 bg-gradient-to-r from-primary to-gold" />
        </div>
      </nav>

      {/* Fica fora da <nav>: o backdrop-blur dela prenderia este "fixed" dentro da barra. */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-300 md:hidden",
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none invisible opacity-0",
        )}
      >
        <div className="flex flex-col items-center space-y-7 font-display text-3xl font-bold">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-foreground/85 transition-colors duration-300 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </a>
          ))}
        </div>
      </div>
    </>
  );
};
