import { ArrowLeft, ArrowRight, Calendar, ExternalLink, Github, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StarBackground } from "@/components/StarBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { ProjectCover } from "@/components/ProjectCover";
import { Reveal } from "@/components/Reveal";
import { content, safeUrl, visibleProjects } from "@/lib/content";
import { NotFound } from "./NotFound";

const Lightbox = ({ image, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (image && !dialog.open) dialog.showModal();
    if (!image && dialog.open) dialog.close();
  }, [image]);

  return (
    <dialog ref={dialogRef} onClose={onClose} onClick={onClose} className="m-auto max-h-[92vh] max-w-[94vw] rounded-xl bg-transparent backdrop:bg-black/85">
      {image && <img src={image} alt="Imagem ampliada do projeto" className="max-h-[92vh] max-w-[94vw] rounded-xl object-contain" />}
      <button aria-label="Fechar imagem" className="fixed top-4 right-4 rounded-full bg-black/60 p-2 text-white">
        <X size={22} />
      </button>
    </dialog>
  );
};

export const ProjectPage = () => {
  const { slug } = useParams();
  const [openImage, setOpenImage] = useState(null);

  const projects = visibleProjects(content.projects);
  const index = projects.findIndex((project) => project.slug === slug);
  const project = projects[index];

  useEffect(() => {
    window.scrollTo(0, 0);
    if (project) document.title = `${project.title} | Michael Azevedo`;
  }, [project]);

  if (!project) return <NotFound />;

  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const demo = safeUrl(project.demoUrl);
  const repo = safeUrl(project.repoUrl);
  const paragraphs = (project.description || "").split(/\n{2,}/).filter(Boolean);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <StarBackground />

      <header className="fixed z-50 w-full bg-background/70 py-3 backdrop-blur-md">
        <div className="container flex items-center justify-between">
          <Link to="/#projects" className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary">
            <ArrowLeft size={18} /> Todos os projetos
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 px-4 pt-28 pb-20">
        <article className="container">
          <div className="animate-fade-in">
            <ul className="mb-5 flex flex-wrap gap-2">
              {project.tags?.map((tag) => (
                <li key={tag} className="rounded-full border bg-secondary/60 px-3 py-1 font-mono text-xs text-secondary-foreground">
                  {tag}
                </li>
              ))}
            </ul>
            <h1 className="max-w-4xl text-5xl leading-[1.02] font-extrabold tracking-tight text-balance md:text-7xl">{project.title}</h1>
            <p className="mt-5 max-w-3xl text-xl text-pretty text-muted-foreground">{project.summary}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {demo && (
                <a href={demo} target="_blank" rel="noreferrer" className="cosmic-button">
                  <ExternalLink size={17} /> Ver no ar
                </a>
              )}
              {repo && (
                <a href={repo} target="_blank" rel="noreferrer" className="ghost-button">
                  <Github size={17} /> Ver código
                </a>
              )}
              <div className="flex items-center gap-4 font-mono text-sm text-muted-foreground sm:ml-3">
                {project.year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={15} /> {project.year}
                  </span>
                )}
                {project.stars > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star size={15} /> {project.stars}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 animate-fade-in-delay-1 opacity-0">
            <ProjectCover project={project} loading="eager" className="aspect-[16/8] rounded-2xl border" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1.5fr_1fr]">
            <Reveal className="space-y-5">
              <h2 className="text-2xl font-bold">Sobre o projeto</h2>
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-lg leading-relaxed text-pretty whitespace-pre-line text-muted-foreground">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-lg text-muted-foreground">{project.summary}</p>
              )}
            </Reveal>

            {project.highlights?.length > 0 && (
              <Reveal delay={100} className="gradient-border h-fit p-6">
                <h2 className="mb-4 text-xl font-bold">Destaques</h2>
                <ul className="space-y-3">
                  {project.highlights.map((item) => (
                    <li key={item} className="flex gap-3 text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_hsl(var(--gold))]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>

          {project.gallery?.length > 0 && (
            <div className="mt-14">
              <h2 className="mb-5 text-2xl font-bold">Galeria</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.gallery.map((image) => (
                  <button key={image} onClick={() => setOpenImage(image)} aria-label="Ampliar imagem" className="overflow-hidden rounded-xl border">
                    <img src={image} alt={`Imagem de ${project.title}`} loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {next && (
            <Link to={`/projeto/${next.slug}`} className="group mt-20 flex items-center justify-between gap-4 border-t pt-8">
              <span>
                <span className="kicker block">Próxima missão</span>
                <span className="mt-1 block font-display text-2xl font-bold transition-colors group-hover:text-primary md:text-4xl">{next.title}</span>
              </span>
              <ArrowRight className="shrink-0 text-primary transition-transform group-hover:translate-x-1" size={30} />
            </Link>
          )}
        </article>
      </main>

      <Footer />
      <Lightbox image={openImage} onClose={() => setOpenImage(null)} />
    </div>
  );
};
