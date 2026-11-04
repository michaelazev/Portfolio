import { ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="relative z-10 border-t bg-card/50 px-4 py-8 backdrop-blur-sm">
      <div className="container flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Michael Azevedo. Feito com React e poeira estelar.
        </p>
        <Link to="/#hero" aria-label="Voltar ao topo" className="rounded-full bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20">
          <ArrowUp size={20} />
        </Link>
      </div>
    </footer>
  );
};
