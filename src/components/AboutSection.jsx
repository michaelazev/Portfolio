import { Briefcase, Code, Download, GraduationCap, Workflow } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";
import { content, visibleProjects } from "@/lib/content";

const ICONS = { code: Code, workflow: Workflow, briefcase: Briefcase };

export const AboutSection = () => {
  const { profile, services, timeline, skills, projects } = content;

  const stats = [
    { value: visibleProjects(projects).length, label: "projetos em destaque aqui" },
    { value: profile.publicRepos, label: "repositórios públicos" },
    { value: skills.length, label: "tecnologias no radar" },
  ].filter((stat) => stat.value);

  return (
    <section id="about" className="relative z-10 px-4 py-24 md:py-32">
      <div className="container">
        <SectionHeading kicker="// sobre mim" title={profile.aboutTitle} accent={profile.aboutAccent} />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <Reveal className="space-y-5">
            {profile.about.map((paragraph) => (
              <p key={paragraph} className="text-lg leading-relaxed text-pretty text-muted-foreground">
                {paragraph}
              </p>
            ))}

            <dl className="grid grid-cols-3 gap-4 border-y py-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-3xl font-extrabold text-primary md:text-4xl">{stat.value}</dd>
                  <dt className="mt-1 text-xs leading-snug text-muted-foreground md:text-sm">{stat.label}</dt>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a href="#contact" className="cosmic-button">
                Entre em contato
              </a>
              {profile.cvUrl && (
<a href={profile.cvUrl} download="Curriculo-Michael-Azevedo.pdf" className="ghost-button">
                <Download size={17} /> Baixar currículo
              </a>
)}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 content-start gap-4">
            {services.map((service, index) => {
              const Icon = ICONS[service.icon] ?? Code;
              return (
                <Reveal key={service.title} delay={index * 90} className="gradient-border card-hover p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{service.title}</h3>
                      <p className="mt-1 text-muted-foreground">{service.text}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {timeline.length > 0 && (
          <div className="mt-20">
            <Reveal as="h3" className="mb-8 flex items-center gap-3 text-2xl font-bold">
              <GraduationCap className="text-primary" /> Trajetória
            </Reveal>
            <ol className="relative ml-2 space-y-8 border-l border-dashed border-primary/40">
              {timeline.map((item, index) => (
                <Reveal as="li" key={item.title} delay={index * 90} className="relative pl-8">
                  <span className="absolute top-1.5 -left-[7px] h-3.5 w-3.5 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary))]" />
                  <p className="font-mono text-xs tracking-wider text-primary uppercase">{item.period}</p>
                  <h4 className="mt-1 font-display text-lg font-bold">{item.title}</h4>
                  <p className="text-muted-foreground">
                    {item.place}
                    {item.text ? `. ${item.text}` : ""}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
};
