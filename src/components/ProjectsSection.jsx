import { ArrowRight, ArrowUpRight, ExternalLink, Github, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading } from "./Reveal";
import { ProjectCover } from "./ProjectCover";
import { content, prefersReducedMotion, safeUrl, visibleProjects } from "@/lib/content";

const useTilt = (strength = 5) => {
  const onPointerMove = (event) => {
    if (event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    element.style.setProperty("--ry", `${(x - 0.5) * strength}deg`);
    element.style.setProperty("--rx", `${(0.5 - y) * strength}deg`);
    element.style.setProperty("--mx", `${x * 100}%`);
    element.style.setProperty("--my", `${y * 100}%`);
    element.style.setProperty("--light", "1");
  };
  const onPointerLeave = (event) => {
    const { style } = event.currentTarget;
    style.setProperty("--ry", "0deg");
    style.setProperty("--rx", "0deg");
    style.setProperty("--light", "0");
  };
  return { onPointerMove, onPointerLeave };
};

const Tags = ({ tags = [], limit = 4 }) => (
  <ul className="flex flex-wrap gap-1.5">
    {tags.slice(0, limit).map((tag) => (
      <li key={tag} className="rounded-full border bg-secondary/60 px-2.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
        {tag}
      </li>
    ))}
  </ul>
);

const ProjectLinks = ({ project }) => {
  const demo = safeUrl(project.demoUrl);
  const repo = safeUrl(project.repoUrl);
  return (
    <div className="relative z-20 flex gap-1">
      {demo && (
        <a href={demo} target="_blank" rel="noreferrer" aria-label={`Abrir ${project.title} no ar`} title="Ver no ar" className="rounded-full p-2 text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary">
          <ExternalLink size={19} />
        </a>
      )}
      {repo && (
        <a href={repo} target="_blank" rel="noreferrer" aria-label={`Código de ${project.title} no GitHub`} title="Ver código" className="rounded-full p-2 text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary">
          <Github size={19} />
        </a>
      )}
    </div>
  );
};

const FeaturedProject = ({ project }) => {
  const tilt = useTilt(3);
  return (
    <Reveal className="mb-6">
      <article {...tilt} className="tilt tilt-light gradient-border group relative grid overflow-hidden lg:grid-cols-[1.35fr_1fr]">
        <ProjectCover project={project} className="aspect-[16/9] lg:aspect-auto lg:min-h-[400px]" imgClassName="transition-transform duration-700 group-hover:scale-105" />
        <div className="flex flex-col p-7 md:p-9">
          <p className="kicker mb-4 flex items-center gap-2 text-gold">
            <Star size={13} fill="currentColor" /> Missão em destaque
          </p>
          <h3 className="text-3xl leading-tight font-extrabold md:text-4xl">
            <Link to={`/projeto/${project.slug}`} className="after:absolute after:inset-0 after:z-10">
              {project.title}
            </Link>
          </h3>
          <p className="mt-4 mb-5 text-pretty text-muted-foreground">{project.summary}</p>
          <Tags tags={project.tags} limit={6} />
          <div className="mt-auto flex items-center justify-between pt-6">
            <span className="flex items-center gap-2 font-semibold text-primary">
              Ver missão <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <ProjectLinks project={project} />
          </div>
        </div>
      </article>
    </Reveal>
  );
};

const ProjectCard = ({ project, index }) => {
  const tilt = useTilt(6);
  return (
    <Reveal delay={(index % 3) * 80} className="h-full">
      <article {...tilt} className="tilt tilt-light gradient-border group relative flex h-full flex-col overflow-hidden">
        <ProjectCover project={project} className="aspect-[16/9]" imgClassName="transition-transform duration-700 group-hover:scale-110" />
        <div className="flex flex-1 flex-col p-5">
          <Tags tags={project.tags} limit={3} />
          <h3 className="mt-3 text-xl font-bold">
            <Link to={`/projeto/${project.slug}`} className="after:absolute after:inset-0 after:z-10">
              {project.title}
            </Link>
          </h3>
          <p className="mt-1.5 mb-3 line-clamp-3 text-sm text-pretty text-muted-foreground">{project.summary}</p>
          <div className="mt-auto flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm font-semibold text-primary">
              Detalhes <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <ProjectLinks project={project} />
          </div>
        </div>
      </article>
    </Reveal>
  );
};

export const ProjectsSection = () => {
  const { profile, projects } = content;
  const [filter, setFilter] = useState("Todos");

  const visible = useMemo(() => visibleProjects(projects), [projects]);

  const filters = useMemo(() => {
    const counts = new Map();
    visible.forEach((project) => project.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    const top = [...counts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
    return ["Todos", ...top];
  }, [visible]);

  const filtered = filter === "Todos" ? visible : visible.filter((project) => project.tags?.includes(filter));
  const [featured, ...rest] = filter === "Todos" && visible[0]?.featured ? filtered : [null, ...filtered];

  return (
    <section id="projects" className="relative z-10 px-4 py-24 md:py-32">
      <div className="container">
        <SectionHeading
          kicker="// sistema de projetos"
          title="Mundos que"
          accent="construí"
          text="Do navegador à câmera do celular: aplicações, APIs e experimentos. Abra qualquer um para ver os detalhes, o código e a versão no ar."
        />

        {filters.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar projetos por tecnologia">
            {filters.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                aria-pressed={filter === tag}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                  filter === tag ? "border-primary bg-primary text-primary-foreground" : "bg-card/60 hover:border-primary/60",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {featured && <FeaturedProject project={featured} />}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

        <Reveal className="mt-12 text-center">
          <a className="ghost-button" target="_blank" rel="noreferrer" href={profile.github}>
            <Github size={18} /> Todos os repositórios no GitHub <ArrowRight size={16} />
          </a>
        </Reveal>
      </div>
    </section>
  );
};
