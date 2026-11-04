import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { StarBackground } from "@/components/StarBackground";
import { HeroSection } from "../components/HeroSection";
import { AboutSection } from "../components/AboutSection";
import { SkillsSection } from "../components/SkillsSection";
import { ProjectsSection } from "../components/ProjectsSection";
import { ContactSection } from "../components/ContactSection";
import { Footer } from "../components/Footer";

const TITLE = "Michael Azevedo | Desenvolvedor Full Stack";

export const Home = () => {
  const { hash, key } = useLocation();

  useEffect(() => {
    document.title = TITLE;
  }, []);

  // Ao voltar de outra página com /#secao, o navegador ainda não tem a seção montada.
  useEffect(() => {
    if (!hash) return;
    document.querySelector(hash)?.scrollIntoView();
  }, [hash, key]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <StarBackground />
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};
