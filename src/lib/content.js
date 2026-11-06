import portfolio from "@/content/portfolio.json";

const isEducation = (item) =>
  /(faculdade|universidade|escola|col[eé]gio|instituto|ensino|gradua|bacharel|tecn[oó]logo)/i.test(`${item.place} ${item.title}`);

/** Aceita o formato antigo (uma lista só em `timeline`), que pode vir de um rascunho salvo no navegador. */
export const normalizeContent = (data) => {
  if (!data) return data;
  const { timeline = [], ...rest } = data;
  return {
    ...rest,
    career: rest.career ?? timeline.filter((item) => !isEducation(item)),
    education: rest.education ?? timeline.filter(isEducation),
    courses: rest.courses ?? [],
  };
};

export const content = normalizeContent(portfolio);

export const SKILL_CATEGORIES = [
  { id: "frontend", label: "Front-end", constellation: "Constelação da Interface" },
  { id: "backend", label: "Back-end e dados", constellation: "Constelação do Motor" },
  { id: "tools", label: "Ferramentas", constellation: "Constelação da Oficina" },
];

export const skillTier = (level) => {
  if (level >= 85) return "Avançado";
  if (level >= 65) return "Intermediário";
  return "Em evolução";
};

/** Destaques primeiro, mantendo a ordem definida no admin; ocultos ficam de fora. */
export const visibleProjects = (projects = []) => {
  const visible = projects.filter((project) => !project.hidden);
  return [...visible.filter((p) => p.featured), ...visible.filter((p) => !p.featured)];
};

export const slugify = (text = "") =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Aceita somente links http(s), mailto e tel; o resto vira vazio e o botão não aparece. */
export const safeUrl = (url = "") => {
  const value = String(url).trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return "";
};

export const whatsappUrl = (phone = "", text = "") => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

export const hashString = (text = "") => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** Gerador pseudoaleatório com semente: a mesma entrada sempre desenha a mesma arte. */
export const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Escolha feita no botão do rodapé; a classe é aplicada em index.html antes da primeira pintura. */
export const prefersReducedMotion = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("reduce-motion");

/** Configuração do sistema: não desliga os efeitos, só tira o que mais incomoda (riscos ao rolar). */
export const systemPrefersCalm = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const setMotionOff = (off) => {
  try {
    if (off) localStorage.setItem("motion", "off");
    else localStorage.removeItem("motion");
  } catch {
    // Sem storage, a escolha vale só até a próxima visita.
  }
  document.documentElement.classList.toggle("reduce-motion", off);
};
