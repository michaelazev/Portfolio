import { ArrowDown, ArrowLeft, ArrowUp, Eye, EyeOff, GitFork, Github, ImagePlus, Link2, Loader2, Pencil, Plus, RefreshCw, Search, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/content";
import { ProjectCover } from "@/components/ProjectCover";
import { fetchReadmeImages, listRepos, parseGithubUser, prepareImage, refreshProject, repoToProject, socialCardUrl } from "./github";
import { ConfirmDelete, IconButton, Panel, SmallButton, TextArea, TextField, Toggle } from "./ui";
import { useAdmin } from "./store";

const newProject = () => ({
  id: `projeto-${Date.now().toString(36)}`,
  slug: "",
  title: "",
  summary: "",
  description: "",
  highlights: [],
  tags: [],
  year: new Date().getFullYear(),
  cover: "",
  gallery: [],
  demoUrl: "",
  repoUrl: "",
  stars: 0,
  featured: false,
  hidden: false,
});

const uniqueSlug = (slug, projects, id) => {
  const base = slug || "projeto";
  let candidate = base;
  for (let n = 2; projects.some((p) => p.slug === candidate && p.id !== id); n++) candidate = `${base}-${n}`;
  return candidate;
};

/* ---------------------------------- Importar do GitHub ---------------------------------- */

const ImportPanel = ({ onClose }) => {
  const { content, setContent, token, toast } = useAdmin();
  const [user, setUser] = useState(parseGithubUser(content.profile.github));
  const [repos, setRepos] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [showForks, setShowForks] = useState(false);

  const imported = useMemo(
    () => new Set(content.projects.map((project) => project.repoUrl?.toLowerCase()).filter(Boolean)),
    [content.projects],
  );

  const load = async (name) => {
    const login = parseGithubUser(name);
    if (!login) return setError("Informe seu usuário do GitHub.");
    setLoading(true);
    setError("");
    try {
      const list = await listRepos(login, token);
      setRepos(list);
      setContent((draft) => ({ ...draft, profile: { ...draft.profile, publicRepos: list.length } }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(user);
    // Carrega só ao abrir; depois o botão Buscar assume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = (repos ?? []).filter(
    (repo) => (showForks || !repo.fork) && repo.name.toLowerCase().includes(query.toLowerCase()),
  );

  const toggle = (repo) =>
    setSelected((current) => (current.includes(repo.id) ? current.filter((id) => id !== repo.id) : [...current, repo.id]));

  const runImport = async () => {
    setImporting(true);
    setError("");
    try {
      const chosen = repos.filter((repo) => selected.includes(repo.id));
      const projects = await Promise.all(chosen.map((repo) => repoToProject(repo, token)));
      setContent((draft) => {
        const next = [...draft.projects];
        projects.forEach((project) => next.push({ ...project, slug: uniqueSlug(project.slug, next, project.id) }));
        return { ...draft, projects: next };
      });
      toast({ title: `${projects.length} projeto(s) importado(s)`, description: "Revise os textos e depois publique." });
      onClose();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Panel title="Importar do GitHub" description="Selecione os repositórios. Nome, descrição, tecnologias, estrelas, links e imagens do README são preenchidos automaticamente.">
      <form
        className="mb-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          load(user);
        }}
      >
        <input aria-label="Usuário do GitHub" value={user} onChange={(event) => setUser(event.target.value)} className="field py-2.5" placeholder="seu-usuario" />
        <SmallButton type="submit" disabled={loading} className="shrink-0 px-4">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />} Buscar
        </SmallButton>
      </form>

      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">{error}</p>}

      {repos && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-52 flex-1">
              <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
              <input aria-label="Filtrar repositórios" value={query} onChange={(event) => setQuery(event.target.value)} className="field py-2 pl-9 text-sm" placeholder="Filtrar por nome" />
            </div>
            <Toggle label="Mostrar forks" checked={showForks} onChange={setShowForks} />
          </div>

          <ul className="max-h-[26rem] divide-y overflow-y-auto rounded-xl border">
            {visible.map((repo) => {
              const already = imported.has(repo.html_url.toLowerCase());
              return (
                <li key={repo.id}>
                  <label className={cn("flex items-start gap-3 p-3 transition-colors", already ? "opacity-55" : "cursor-pointer hover:bg-primary/5")}>
                    <input type="checkbox" disabled={already} checked={selected.includes(repo.id)} onChange={() => toggle(repo)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 font-semibold">
                        {repo.name}
                        {repo.fork && <GitFork size={13} className="text-muted-foreground" />}
                        {already && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">Já no portfólio</span>}
                      </span>
                      {repo.description && <span className="block truncate text-sm text-muted-foreground">{repo.description}</span>}
                      <span className="mt-0.5 flex flex-wrap gap-3 font-mono text-xs text-muted-foreground">
                        {repo.language && <span>{repo.language}</span>}
                        {repo.stargazers_count > 0 && <span>★ {repo.stargazers_count}</span>}
                        <span>{new Date(repo.pushed_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
            {visible.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Nenhum repositório encontrado.</li>}
          </ul>
        </>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <SmallButton onClick={onClose}>Cancelar</SmallButton>
        <button type="button" onClick={runImport} disabled={!selected.length || importing} className="cosmic-button px-5 py-2 text-sm">
          {importing && <Loader2 size={16} className="animate-spin" />}
          Importar {selected.length > 0 ? `(${selected.length})` : ""}
        </button>
      </div>
    </Panel>
  );
};

/* -------------------------------------- Editor -------------------------------------- */

const ImageDrop = ({ onFile, label, busy }) => {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current.click()}
      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && inputRef.current.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        [...event.dataTransfer.files].forEach(onFile);
      }}
      onPaste={(event) => {
        [...event.clipboardData.files].forEach(onFile);
      }}
      className={cn("flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-5 text-center text-sm transition-colors", over ? "border-primary bg-primary/10" : "hover:border-primary/60")}
    >
      {busy ? <Loader2 className="animate-spin text-primary" /> : <ImagePlus className="text-primary" />}
      <span className="font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">Arraste, cole (Ctrl+V) ou clique. PNG, JPG, WebP ou GIF.</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={(event) => {
          [...event.target.files].forEach(onFile);
          event.target.value = "";
        }}
      />
    </div>
  );
};

const ProjectEditor = ({ project, onClose }) => {
  const { content, setContent, addFile, resolve, token, toast } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [readmeImages, setReadmeImages] = useState(null);
  const [tagText, setTagText] = useState((project.tags ?? []).join(", "));
  const [highlightText, setHighlightText] = useState((project.highlights ?? []).join("\n"));

  const update = (patch) =>
    setContent((draft) => ({
      ...draft,
      projects: draft.projects.map((item) => (item.id === project.id ? { ...item, ...patch } : item)),
    }));

  const setTitle = (title) => {
    const followsTitle = !project.slug || project.slug === slugify(project.title);
    update({ title, ...(followsTitle ? { slug: uniqueSlug(slugify(title), content.projects, project.id) } : {}) });
  };

  const upload = async (file, onDone) => {
    setBusy(true);
    try {
      const { dataUrl, extension } = await prepareImage(file);
      const name = `${project.slug || "projeto"}-${Date.now().toString(36)}${Math.floor(Math.random() * 99)}.${extension}`;
      onDone(addFile(`/projects/${name}`, dataUrl));
    } catch (error) {
      toast({ variant: "destructive", title: "Imagem não adicionada", description: error.message });
    } finally {
      setBusy(false);
    }
  };

  const findReadmeImages = async () => {
    setSyncing(true);
    try {
      const images = await fetchReadmeImages(project.repoUrl, token);
      setReadmeImages(images);
      if (!images.length) toast({ title: "O README não tem imagens", description: "Envie uma captura de tela ou use o cartão do GitHub." });
    } catch (error) {
      toast({ variant: "destructive", title: "Não consegui ler o README", description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const next = await refreshProject(project, token);
      update(next);
      setTagText((next.tags ?? []).join(", "));
      setHighlightText((next.highlights ?? []).join("\n"));
      toast({ title: "Dados atualizados", description: "Estrelas e ano atualizados; campos vazios preenchidos." });
    } catch (error) {
      toast({ variant: "destructive", title: "Não consegui atualizar", description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onClose} className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ArrowLeft size={17} /> Voltar para a lista
        </button>
        {project.repoUrl && (
          <SmallButton onClick={sync} disabled={syncing}>
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} /> Atualizar do GitHub
          </SmallButton>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="space-y-4">
            <TextField label="Título" value={project.title} onChange={setTitle} placeholder="Nome do projeto" autoFocus={!project.title} />
            <TextField label="Endereço da página" hint={`/projeto/${project.slug || "..."}`} value={project.slug} onChange={(value) => update({ slug: slugify(value) })} />
            <TextArea label="Resumo" hint="Uma ou duas frases: aparece no cartão do projeto." rows={2} value={project.summary} onChange={(summary) => update({ summary })} />
            <TextArea label="Descrição completa" hint="Qual problema resolve, o que você fez, o que aprendeu. Separe parágrafos com uma linha em branco." rows={7} value={project.description} onChange={(description) => update({ description })} />
            <TextArea
              label="Destaques"
              hint="Um por linha."
              rows={4}
              value={highlightText}
              onChange={(value) => {
                setHighlightText(value);
                update({ highlights: value.split("\n").map((line) => line.trim()).filter(Boolean) });
              }}
            />
            <TextField
              label="Tecnologias"
              hint="Separadas por vírgula."
              value={tagText}
              onChange={(value) => {
                setTagText(value);
                update({ tags: value.split(",").map((tag) => tag.trim()).filter(Boolean) });
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Link do site" type="url" placeholder="https://..." value={project.demoUrl} onChange={(demoUrl) => update({ demoUrl })} />
              <TextField label="Link do GitHub" type="url" placeholder="https://github.com/..." value={project.repoUrl} onChange={(repoUrl) => update({ repoUrl })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Ano" type="number" value={project.year} onChange={(year) => update({ year: Number(year) || "" })} />
              <div className="flex flex-col justify-end gap-2 pb-1">
                <Toggle label="Projeto em destaque" checked={project.featured} onChange={(featured) => update({ featured })} />
                <Toggle label="Ocultar do site" checked={project.hidden} onChange={(hidden) => update({ hidden })} />
              </div>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Foto de capa" description="Sem foto, o site desenha um planeta exclusivo para o projeto.">
            <div className="relative">
              <ProjectCover project={project} src={resolve(project.cover)} className="aspect-video rounded-xl border" />
              {project.cover && (
                <IconButton label="Remover capa" onClick={() => update({ cover: "" })} className="absolute top-2 right-2 bg-black/60 text-white hover:bg-black/80">
                  <X size={16} />
                </IconButton>
              )}
            </div>
            <div className="mt-3 space-y-3">
              <ImageDrop busy={busy} label="Enviar captura de tela" onFile={(file) => upload(file, (cover) => update({ cover }))} />
              <TextField label="Ou cole o link de uma imagem" type="url" placeholder="https://..." value={project.cover?.startsWith("http") ? project.cover : ""} onChange={(cover) => update({ cover })} />
              {project.repoUrl && (
                <div className="flex flex-wrap gap-2">
                  <SmallButton onClick={() => update({ cover: socialCardUrl(project.repoUrl) })}>
                    <Link2 size={15} /> Cartão do GitHub
                  </SmallButton>
                  <SmallButton onClick={findReadmeImages} disabled={syncing}>
                    <Search size={15} /> Imagens do README
                  </SmallButton>
                </div>
              )}
              {readmeImages?.length > 0 && (
                <ul className="grid grid-cols-3 gap-2">
                  {readmeImages.map((image) => (
                    <li key={image}>
                      <button type="button" onClick={() => update({ cover: image })} aria-label="Usar esta imagem como capa" className="block w-full overflow-hidden rounded-lg border hover:border-primary">
                        <img src={image} alt="" className="aspect-video w-full object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel title="Galeria" description="Telas extras na página do projeto.">
            {project.gallery?.length > 0 && (
              <ul className="mb-3 grid grid-cols-3 gap-2">
                {project.gallery.map((image) => (
                  <li key={image} className="relative">
                    <img src={resolve(image)} alt="" className="aspect-video w-full rounded-lg border object-cover" />
                    <button type="button" aria-label="Remover imagem" onClick={() => update({ gallery: project.gallery.filter((item) => item !== image) })} className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 text-white">
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <ImageDrop
              busy={busy}
              label="Adicionar imagens"
              onFile={(file) =>
                upload(file, (path) =>
                  setContent((draft) => ({
                    ...draft,
                    projects: draft.projects.map((item) => (item.id === project.id ? { ...item, gallery: [...(item.gallery ?? []), path] } : item)),
                  })),
                )
              }
            />
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------- Lista -------------------------------------- */

export const ProjectsTab = () => {
  const { content, setContent, resolve } = useAdmin();
  const [editingId, setEditingId] = useState(null);
  const [importing, setImporting] = useState(false);

  const editing = content.projects.find((project) => project.id === editingId);
  if (editing) return <ProjectEditor project={editing} onClose={() => setEditingId(null)} />;

  const setProjects = (change) => setContent((draft) => ({ ...draft, projects: change(draft.projects) }));

  const move = (index, delta) =>
    setProjects((projects) => {
      const next = [...projects];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const patch = (id, change) => setProjects((projects) => projects.map((project) => (project.id === id ? { ...project, ...change } : project)));

  const create = () => {
    const project = newProject();
    setProjects((projects) => [project, ...projects]);
    setEditingId(project.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Projetos</h1>
          <p className="text-sm text-muted-foreground">
            {content.projects.length} no portfólio. A ordem aqui é a ordem no site; os destaques vêm primeiro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SmallButton onClick={create}>
            <Plus size={16} /> Novo manual
          </SmallButton>
          <button type="button" onClick={() => setImporting((open) => !open)} className="cosmic-button px-4 py-2 text-sm">
            <Github size={16} /> Importar do GitHub
          </button>
        </div>
      </div>

      {importing && <ImportPanel onClose={() => setImporting(false)} />}

      <ul className="space-y-3">
        {content.projects.map((project, index) => (
          <li key={project.id} className={cn("flex flex-wrap items-center gap-4 rounded-2xl border bg-card/80 p-3 backdrop-blur-sm", project.hidden && "opacity-60")}>
            <button type="button" onClick={() => setEditingId(project.id)} aria-label={`Editar ${project.title}`} className="shrink-0">
              <ProjectCover project={project} src={resolve(project.cover)} className="aspect-video w-28 rounded-lg border" />
            </button>
            <div className="min-w-44 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-display font-bold">
                {project.title || "Sem título"}
                {project.featured && <span className="rounded-full bg-gold/15 px-2 py-0.5 font-sans text-[11px] font-bold text-gold">Destaque</span>}
                {project.hidden && <span className="rounded-full bg-secondary px-2 py-0.5 font-sans text-[11px] font-bold">Oculto</span>}
              </p>
              <p className="line-clamp-1 text-sm text-muted-foreground">{project.summary || "Sem resumo"}</p>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{(project.tags ?? []).join(" · ")}</p>
            </div>
            <div className="flex items-center">
              <IconButton label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp size={17} />
              </IconButton>
              <IconButton label="Mover para baixo" disabled={index === content.projects.length - 1} onClick={() => move(index, 1)}>
                <ArrowDown size={17} />
              </IconButton>
              <IconButton label={project.featured ? "Tirar dos destaques" : "Colocar em destaque"} onClick={() => patch(project.id, { featured: !project.featured })}>
                <Star size={17} className={project.featured ? "text-gold" : ""} fill={project.featured ? "currentColor" : "none"} />
              </IconButton>
              <IconButton label={project.hidden ? "Mostrar no site" : "Ocultar do site"} onClick={() => patch(project.id, { hidden: !project.hidden })}>
                {project.hidden ? <EyeOff size={17} /> : <Eye size={17} />}
              </IconButton>
              <IconButton label="Editar" onClick={() => setEditingId(project.id)}>
                <Pencil size={17} />
              </IconButton>
              <ConfirmDelete label="Excluir projeto" onConfirm={() => setProjects((projects) => projects.filter((item) => item.id !== project.id))}>
                <Trash2 size={17} />
              </ConfirmDelete>
            </div>
          </li>
        ))}
        {content.projects.length === 0 && (
          <li className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Nenhum projeto ainda. Importe do GitHub para começar.</li>
        )}
      </ul>
    </div>
  );
};
