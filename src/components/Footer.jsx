import { ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { prefersReducedMotion, setMotionOff } from "@/lib/content";

export const Footer = () => {
  const motionOff = prefersReducedMotion();

  const toggleMotion = () => {
    setMotionOff(!motionOff);
    // Os efeitos são montados ao abrir a página; recarregar é o jeito mais simples de aplicar.
    window.location.reload();
  };

  return (
    <footer className="relative z-10 border-t bg-card/50 px-4 py-8 backdrop-blur-sm">
      <div className="container flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Michael Azevedo. Feito com React e poeira estelar.
        </p>
        <div className="flex items-center gap-4">
          <button type="button" onClick={toggleMotion} className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
            {motionOff ? "Ativar animações" : "Reduzir animações"}
          </button>
          <Link to="/#hero" aria-label="Voltar ao topo" className="rounded-full bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20">
            <ArrowUp size={20} />
          </Link>
        </div>
      </div>
    </footer>
  );
};
