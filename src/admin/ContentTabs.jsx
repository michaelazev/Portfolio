import { ArrowDown, ArrowUp, FileText, GripVertical, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SKILL_CATEGORIES, skillTier } from "@/lib/content";
import { prepareFile } from "./github";
import { ConfirmDelete, IconButton, Panel, SmallButton, TextArea, TextField, Toggle } from "./ui";
import { useAdmin } from "./store";

const CV_PATH = "/meuCurriculo.pdf";

const CvUpload = () => {
  const { addFile, files, toast, content, setContent } = useAdmin();
  const inputRef = useRef(null);
  const pending = !!files[`public${CV_PATH}`];

  const onFile = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "Envie um arquivo PDF" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "O PDF passa de 10 MB" });
      return;
    }
    const { dataUrl } = await prepareFile(file);
    addFile(CV_PATH, dataUrl);
    setContent((draft) => ({ ...draft, profile: { ...draft.profile, cvUrl: CV_PATH } }));
    toast({ title: "Currículo pronto para publicar", description: file.name });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SmallButton onClick={() => inputRef.current.click()}>
        <FileText size={16} /> Enviar currículo (PDF)
      </SmallButton>
      {content.profile.cvUrl && !pending && (
<a href={content.profile.cvUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
        Ver o atual
      </a>
)}
      {pending && <span className="text-sm font-semibold text-gold">Novo PDF aguardando publicação</span>}
      <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={(event) => onFile(event.target.files[0])} />
    </div>
  );
};

export const ProfileTab = () => {
  const { content, setContent } = useAdmin();
  const { profile, services } = content;
  const [rotating, setRotating] = useState((profile.rotating ?? []).join("\n"));
  const [about, setAbout] = useState((profile.about ?? []).join("\n\n"));

  const set = (patch) => setContent((draft) => ({ ...draft, profile: { ...draft.profile, ...patch } }));
  const setService = (index, patch) =>
    setContent((draft) => ({
      ...draft,
      services: draft.services.map((service, i) => (i === index ? { ...service, ...patch } : service)),
    }));

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Perfil</h1>

      <Panel title="Abertura do site">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nome" hint="Cada palavra vira uma linha formada por estrelas." value={profile.name} onChange={(name) => set({ name })} />
          <TextField label="Cargo" value={profile.role} onChange={(role) => set({ role })} />
          <TextArea label="Frase de apresentação" className="md:col-span-2" rows={2} value={profile.tagline} onChange={(tagline) => set({ tagline })} />
          <TextArea
            label="O que você está construindo"
            hint="Uma frase por linha: elas se revezam digitando na abertura."
            rows={4}
            value={rotating}
            onChange={(value) => {
              setRotating(value);
              set({ rotating: value.split("\n").map((line) => line.trim()).filter(Boolean) });
            }}
          />
          <div className="space-y-4">
            <Toggle label="Mostrar selo de disponibilidade" checked={profile.available} onChange={(available) => set({ available })} />
            <TextField label="Texto do selo" value={profile.availabilityText} onChange={(availabilityText) => set({ availabilityText })} />
          </div>
        </div>
      </Panel>

      <Panel title="Sobre mim">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Título" value={profile.aboutTitle} onChange={(aboutTitle) => set({ aboutTitle })} />
          <TextField label="Parte colorida do título" value={profile.aboutAccent} onChange={(aboutAccent) => set({ aboutAccent })} />
          <TextArea
            label="Texto"
            hint="Separe parágrafos com uma linha em branco."
            className="md:col-span-2"
            rows={7}
            value={about}
            onChange={(value) => {
              setAbout(value);
              set({ about: value.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean) });
            }}
          />
        </div>
        <div className="mt-5 border-t pt-5">
          <CvUpload />
        </div>
      </Panel>

      <Panel title="O que eu faço" description="Os cartões ao lado do texto Sobre mim.">
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service, index) => (
            <div key={index} className="space-y-3">
              <TextField label="Título" value={service.title} onChange={(title) => setService(index, { title })} />
              <TextArea label="Texto" rows={3} value={service.text} onChange={(text) => setService(index, { text })} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Contato e redes" description="Link vazio some do site automaticamente.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="E-mail" type="email" value={profile.email} onChange={(email) => set({ email })} />
          <TextField label="Telefone (como aparece)" value={profile.phone} onChange={(phone) => set({ phone })} />
          <TextField label="WhatsApp (com DDI)" hint="Só números. Ex.: 5581999999999" value={profile.whatsapp} onChange={(whatsapp) => set({ whatsapp })} />
          <TextField label="Localização" value={profile.location} onChange={(location) => set({ location })} />
          <TextField label="GitHub" type="url" value={profile.github} onChange={(github) => set({ github })} />
          <TextField label="LinkedIn" type="url" placeholder="https://linkedin.com/in/..." value={profile.linkedin} onChange={(linkedin) => set({ linkedin })} />
          <TextField label="Instagram" type="url" placeholder="https://instagram.com/..." value={profile.instagram} onChange={(instagram) => set({ instagram })} />
          <TextField
            label="Receber mensagens direto (opcional)"
            type="url"
            placeholder="https://formspree.io/f/..."
            hint="Com um endereço do Formspree ou similar, o formulário envia sem abrir o e-mail. Vazio: botões de e-mail e WhatsApp."
            value={profile.formEndpoint}
            onChange={(formEndpoint) => set({ formEndpoint })}
          />
        </div>
      </Panel>
    </div>
  );
};

export const SkillsTab = () => {
  const { content, setContent } = useAdmin();

  const setSkills = (change) => setContent((draft) => ({ ...draft, skills: change(draft.skills) }));
  const update = (skill, patch) => setSkills((skills) => skills.map((item) => (item === skill ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold">Habilidades</h1>
        <p className="text-sm text-muted-foreground">No site, cada habilidade é uma estrela. O nível define o brilho e o rótulo; o número não aparece para o visitante.</p>
      </div>

      {SKILL_CATEGORIES.map((category) => {
        const skills = content.skills.filter((skill) => skill.category === category.id);
        return (
          <Panel key={category.id} title={category.label}>
            <ul className="space-y-3">
              {skills.map((skill, index) => (
                <li key={index} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,14rem)_1fr_7rem_auto]">
                  <input aria-label="Nome da habilidade" value={skill.name} onChange={(event) => update(skill, { name: event.target.value })} className="field py-2" />
                  <input aria-label={`Nível de ${skill.name}`} type="range" min="10" max="100" step="5" value={skill.level} onChange={(event) => update(skill, { level: Number(event.target.value) })} className="order-3 col-span-2 accent-[hsl(var(--primary))] sm:order-none sm:col-span-1" />
                  <span className="order-4 col-span-2 font-mono text-xs text-muted-foreground sm:order-none sm:col-span-1">{skill.level} · {skillTier(skill.level)}</span>
                  <ConfirmDelete label={`Excluir ${skill.name}`} onConfirm={() => setSkills((all) => all.filter((item) => item !== skill))}>
                    <Trash2 size={16} />
                  </ConfirmDelete>
                </li>
              ))}
            </ul>
            <SmallButton className="mt-4" onClick={() => setSkills((all) => [...all, { name: "Nova habilidade", level: 50, category: category.id }])}>
              <Plus size={16} /> Adicionar
            </SmallButton>
          </Panel>
        );
      })}
    </div>
  );
};

export const TimelineTab = () => {
  const { content, setContent } = useAdmin();
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const setTimeline = (change) => setContent((draft) => ({ ...draft, timeline: change(draft.timeline) }));
  const update = (index, patch) => setTimeline((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (from, to) =>
    setTimeline((items) => {
      if (from === to || to < 0 || to >= items.length) return items;
      const next = [...items];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Trajetória</h1>
          <p className="text-sm text-muted-foreground">Arraste pela alça ou use as setas. A ordem aqui é a ordem no site.</p>
        </div>
        <SmallButton onClick={() => setTimeline((items) => [{ period: "", title: "", place: "", text: "" }, ...items])}>
          <Plus size={16} /> Adicionar
        </SmallButton>
      </div>

      {content.timeline.map((item, index) => (
        <div
          key={index}
          data-timeline-item
          onDragOver={(event) => {
            if (dragIndex === null) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setOverIndex(index);
          }}
          onDrop={(event) => {
            // Sem isto, o navegador tentaria soltar o conteúdo arrastado dentro de um campo de texto.
            event.preventDefault();
            if (dragIndex !== null) move(dragIndex, index);
            endDrag();
          }}
          className={cn(
            "rounded-2xl transition-[opacity,box-shadow]",
            dragIndex === index && "opacity-40",
            overIndex === index && dragIndex !== index && "ring-2 ring-primary",
          )}
        >
          <Panel>
            <div className="mb-3 flex items-center justify-between gap-2 border-b pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  draggable
                  title="Arraste para mudar a ordem"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/x-timeline-item", String(index));
                    event.dataTransfer.setDragImage(event.currentTarget.closest("[data-timeline-item]"), 24, 24);
                    setDragIndex(index);
                  }}
                  onDragEnd={endDrag}
                  className="cursor-grab rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary active:cursor-grabbing"
                >
                  <GripVertical size={18} />
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {index + 1} de {content.timeline.length}
                </span>
              </div>
              <div className="flex items-center">
                <IconButton label="Mover para cima" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp size={17} />
                </IconButton>
                <IconButton label="Mover para baixo" disabled={index === content.timeline.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDown size={17} />
                </IconButton>
                <ConfirmDelete label="Excluir item" onConfirm={() => setTimeline((items) => items.filter((_, i) => i !== index))}>
                  <Trash2 size={16} />
                </ConfirmDelete>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Título" value={item.title} onChange={(title) => update(index, { title })} />
              <TextField label="Período" value={item.period} onChange={(period) => update(index, { period })} />
              <TextField label="Instituição ou empresa" value={item.place} onChange={(place) => update(index, { place })} />
              <TextField label="Detalhe (opcional)" value={item.text} onChange={(text) => update(index, { text })} />
            </div>
          </Panel>
        </div>
      ))}
    </div>
  );
};
