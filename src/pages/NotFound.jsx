import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import { StarBackground } from "@/components/StarBackground";

export const NotFound = () => {
  useEffect(() => {
    document.title = "Página não encontrada | Michael Azevedo";
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <StarBackground />
      <main className="relative z-10">
        <p className="kicker">Erro 404 · sinal perdido</p>
        <h1 className="text-gradient mt-4 text-8xl font-extrabold md:text-[10rem] md:leading-none">404</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          Esta rota saiu do mapa estelar. A página pode ter mudado de órbita ou nunca ter existido.
        </p>
        <Link to="/" className="cosmic-button mt-8">
          <Rocket size={18} /> Voltar para a base
        </Link>
      </main>
    </div>
  );
};
