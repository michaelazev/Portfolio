import { AlertTriangle, CloudUpload, ExternalLink, FolderKanban, GitBranch, KeyRound, Loader2, LogOut, Milestone, RotateCcw, Sparkle, Sparkles, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StarBackground } from "@/components/StarBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { content as bundledContent, normalizeContent } from "@/lib/content";
import { connect, loadRemoteContent, publishLocally, publishToGitHub } from "./github";
import { AdminContext } from "./store";
import { ProjectsTab } from "./ProjectsTab";
import { ProfileTab, SkillsTab, TimelineTab } from "./ContentTabs";
import { TextField } from "./ui";

const LOCAL_MODE = import.meta.env.DEV;
const CONNECTION_KEY = "portfolio-admin-connection";
const DRAFT_KEY = "portfolio-admin-draft";
const DEFAULT_REPO = "michaelazev/Portfolio";

const TOKEN_URL =
  "https://github.com/settings/personal-access-tokens/new?name=Portfolio+Admin&description=Publicar+pelo+admin+do+portfolio&contents=write&expires_in=366";

const TABS = [
  { id: "projects", label: "Projetos", Icon: FolderKanban, Component: ProjectsTab },
  { id: "profile", label: "Perfil", Icon: UserRound, Component: ProfileTab },
  { id: "skills", label: "Habilidades", Icon: Sparkles, Component: SkillsTab },
  { id: "timeline", label: "Trajetória", Icon: Milestone, Component: TimelineTab },
];

const storage = {
  read(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Sem storage não há o que remover.
    }
  },
};

/** Só bloqueia problemas que quebrariam o site publicado. */
const validate = (content) => {
  const slugs = new Set();
  for (const project of content.projects) {
    if (!project.title?.trim()) return "Há um projeto sem título. Dê um nome a ele ou exclua-o.";
    if (!project.slug) return `O projeto "${project.title}" está sem endereço de página.`;
    if (slugs.has(project.slug)) return `Dois projetos usam o endereço "${project.slug}". Altere um deles.`;
    slugs.add(project.slug);
  }
  const untitled = [
    ["Carreira", content.career],
    ["Formação", content.education],
    ["Cursos", content.courses],
  ].find(([, items]) => items.some((item) => !item.title?.trim()));
  if (untitled) return `Há um item sem título em ${untitled[0]}, na aba Trajetória. Preencha ou exclua.`;

  const names = new Set();
  for (const skill of content.skills) {
    const name = skill.name.trim().toLowerCase();
    if (!name) return "Há uma habilidade sem nome.";
    if (names.has(name)) return `A habilidade "${skill.name}" aparece duas vezes.`;
    names.add(name);
  }
  return "";
};

const ConnectScreen = ({ onConnected }) => {
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [branch, setBranch] = useState("main");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onConnected(await connect({ repo: repo.trim(), branch: branch.trim(), token: token.trim() }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4 text-foreground">
      <StarBackground />
      <main className="gradient-border relative z-10 w-full max-w-md p-7">
        <p className="kicker flex items-center gap-2">
          <Sparkle size={13} fill="currentColor" /> Sala de controle
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Entrar no admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O acesso é o seu token do GitHub. Sem ele, ninguém consegue alterar o site, mesmo abrindo esta página.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <TextField label="Repositório do site" value={repo} onChange={setRepo} required />
          <TextField label="Branch" value={branch} onChange={setBranch} required />
          <TextField
            label="Token do GitHub"
            type="password"
            autoComplete="off"
            required
            value={token}
            onChange={setToken}
            hint="Fica salvo só neste navegador, até você clicar em Sair."
          />
          {error && (
            <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="cosmic-button w-full">
            {busy ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />} Conectar
          </button>
        </form>

        <div className="mt-5 rounded-xl border bg-secondary/40 p-4 text-sm">
          <p className="font-semibold">Primeira vez?</p>
          <ol className="mt-1 list-inside list-decimal space-y-1 text-muted-foreground">
            <li>
              <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2">
                Crie o token aqui
              </a>{" "}
              (a página já vem preenchida).
            </li>
            <li>Em <b>Repository access</b>, escolha só o repositório do portfólio.</li>
            <li>Gere, copie e cole no campo acima.</li>
          </ol>
        </div>
      </main>
    </div>
  );
};

const AdminApp = () => {
  const { toast } = useToast();
  const [connection, setConnection] = useState(() => (LOCAL_MODE ? null : storage.read(CONNECTION_KEY)));
  const [content, setContent] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [files, setFiles] = useState({});
  const [tab, setTab] = useState("projects");
  const [loadError, setLoadError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [restored, setRestored] = useState(false);
  const storageWarned = useRef(false);

  const ready = LOCAL_MODE || connection;
  const token = connection?.token;

  useEffect(() => {
    document.title = "Admin | Portfólio";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  // Em produção, a fonte da verdade é o repositório: a versão do site pode estar
  // alguns instantes atrasada e sobrescrever uma publicação recém-feita.
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const source = LOCAL_MODE ? bundledContent : (normalizeContent(await loadRemoteContent(connection)) ?? bundledContent);
        if (cancelled) return;
        const draft = storage.read(DRAFT_KEY);
        const sourceText = JSON.stringify(source);
        setBaseline(sourceText);
        if (draft?.content && JSON.stringify(draft.content) !== sourceText) {
          setContent(normalizeContent(draft.content));
          setFiles(draft.files ?? {});
          setRestored(true);
        } else {
          setContent(source);
        }
      } catch (failure) {
        if (!cancelled) setLoadError(failure.message);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Recarrega apenas ao trocar de conexão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const dirty = useMemo(() => {
    if (!content) return false;
    return Object.keys(files).length > 0 || JSON.stringify(content) !== baseline;
  }, [content, files, baseline]);

  useEffect(() => {
    if (!content) return;
    if (!dirty) {
      storage.remove(DRAFT_KEY);
      return;
    }
    const saved = storage.write(DRAFT_KEY, { content, files });
    if (!saved && !storageWarned.current) {
      storageWarned.current = true;
      toast({ title: "Rascunho grande demais", description: "Publique logo: se fechar esta aba agora, as imagens novas se perdem." });
    }
  }, [content, files, dirty, toast]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Registra um arquivo a publicar e devolve o caminho público dele. */
  const addFile = useCallback((publicPath, dataUrl) => {
    setFiles((current) => ({ ...current, [`public${publicPath}`]: { dataUrl } }));
    return publicPath;
  }, []);

  const resolve = useCallback(
    (src) => {
      if (!src) return "";
      const pending = files[`public${src}`];
      if (pending) return pending.dataUrl;
      if (connection && src.startsWith("/projects/")) {
        return `https://raw.githubusercontent.com/${connection.repo}/${connection.branch}/public${src}`;
      }
      return src;
    },
    [files, connection],
  );

  const discard = () => {
    setContent(JSON.parse(baseline));
    setFiles({});
    setRestored(false);
    storage.remove(DRAFT_KEY);
    toast({ title: "Alterações descartadas" });
  };

  const publish = async () => {
    const problem = validate(content);
    if (problem) {
      toast({ variant: "destructive", title: "Falta um ajuste antes de publicar", description: problem });
      return;
    }

    setPublishing(true);
    try {
      const payload = Object.entries(files).map(([path, { dataUrl }]) => ({
        path,
        base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
      }));
      if (LOCAL_MODE) {
        await publishLocally({ content, files: payload });
      } else {
        await publishToGitHub(connection, { content, files: payload, message: "conteúdo: atualização pelo admin" });
      }
      setBaseline(JSON.stringify(content));
      setFiles({});
      setRestored(false);
      storage.remove(DRAFT_KEY);
      toast({
        title: LOCAL_MODE ? "Salvo nos arquivos do projeto" : "Publicado!",
        description: LOCAL_MODE ? "Confira no site local. Depois é só enviar com git push." : "O site se atualiza em cerca de 1 minuto.",
      });
    } catch (failure) {
      toast({ variant: "destructive", title: "Não publicado", description: failure.message });
    } finally {
      setPublishing(false);
    }
  };

  const signOut = () => {
    storage.remove(CONNECTION_KEY);
    setConnection(null);
    setContent(null);
    setBaseline("");
    setFiles({});
  };

  const onConnected = (next) => {
    storage.write(CONNECTION_KEY, next);
    setConnection(next);
  };

  if (!ready) return <ConnectScreen onConnected={onConnected} />;

  if (loadError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <AlertTriangle className="text-destructive" size={32} />
        <p className="max-w-md">{loadError}</p>
        <button type="button" onClick={signOut} className="cosmic-button">
          Conectar de novo
        </button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-primary">
        <Loader2 className="animate-spin" size={32} aria-label="Carregando" />
      </div>
    );
  }

  const ActiveTab = TABS.find((item) => item.id === tab).Component;

  return (
    <AdminContext.Provider value={{ content, setContent, files, addFile, resolve, token, toast }}>
      <div className="min-h-svh bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Sparkle size={18} className="shrink-0 text-primary" fill="currentColor" />
              <div className="min-w-0">
                <p className="font-display leading-tight font-bold">Sala de controle</p>
                <p className="flex items-center gap-1 truncate font-mono text-[11px] text-muted-foreground">
                  {LOCAL_MODE ? (
                    "modo local: salva nos arquivos"
                  ) : (
                    <>
                      <GitBranch size={11} /> {connection.repo}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <a href="/" target="_blank" rel="noreferrer" aria-label="Ver site" title="Ver site" className="rounded-full p-2 transition-colors hover:bg-primary/10 hover:text-primary">
                <ExternalLink size={19} />
              </a>
              {!LOCAL_MODE && (
                <button type="button" onClick={signOut} aria-label="Sair" title="Sair" className="rounded-full p-2 transition-colors hover:bg-primary/10 hover:text-primary">
                  <LogOut size={19} />
                </button>
              )}
              {dirty && (
                <button type="button" onClick={discard} aria-label="Descartar alterações" title="Descartar alterações" className="rounded-full p-2 transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <RotateCcw size={19} />
                </button>
              )}
              <button type="button" onClick={publish} disabled={!dirty || publishing} className="cosmic-button px-4 py-2 text-sm">
                {publishing ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                {publishing ? "Publicando..." : dirty ? "Publicar alterações" : "Tudo publicado"}
              </button>
            </div>
          </div>

          <nav aria-label="Seções do admin" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                  tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl p-4 pb-16 md:py-8">
          {restored && dirty && (
            <p className="mb-5 rounded-xl border border-gold/50 bg-gold/10 p-3 text-sm">
              Recuperei um rascunho que você não publicou. Publique ou use o botão de descartar.
            </p>
          )}
          <ActiveTab />
        </main>
      </div>
    </AdminContext.Provider>
  );
};

export default AdminApp;
