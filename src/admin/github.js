import { slugify } from "@/lib/content";
import { parseReadme, prettifyRepoName } from "./readme";

const API = "https://api.github.com";
export const CONTENT_PATH = "src/content/portfolio.json";

const headers = (token, accept = "application/vnd.github+json") => ({
  Accept: accept,
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const failure = async (response) => {
  if (response.status === 401) return new Error("Token inválido ou expirado. Gere um novo e conecte de novo.");
  if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
    const reset = new Date(Number(response.headers.get("x-ratelimit-reset")) * 1000);
    return new Error(`Limite de consultas do GitHub atingido. Tente de novo às ${reset.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`);
  }
  if (response.status === 403) return new Error("O token não tem permissão para isso. Confira se ele tem Contents: Read and write neste repositório.");
  if (response.status === 404) return new Error("Não encontrei isso no GitHub. Confira o nome do usuário, do repositório e da branch.");
  const body = await response.json().catch(() => ({}));
  return new Error(body.message || `GitHub respondeu com erro ${response.status}.`);
};

const call = async (path, { token, method = "GET", body, accept } = {}) => {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: { ...headers(token, accept), ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Sem conexão com o GitHub. Verifique sua internet.");
  }
  if (!response.ok) throw await failure(response);
  return accept?.includes("raw") ? response.text() : response.json();
};

export const parseGithubUser = (value = "") => {
  const match = value.trim().match(/(?:github\.com\/)?([A-Za-z0-9-]+)\/?$/);
  return match ? match[1] : "";
};

export const parseRepoUrl = (url = "") => {
  const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  return match ? { owner: match[1], repo: match[2].replace(/\.git$/, "") } : null;
};

export const listRepos = async (user, token) => {
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await call(`/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed&page=${page}`, { token });
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
};

const fetchReadme = async (owner, repo, token) => {
  try {
    return await call(`/repos/${owner}/${repo}/readme`, { token, accept: "application/vnd.github.raw+json" });
  } catch {
    return ""; // Repositório sem README: seguimos com os dados básicos.
  }
};

export const fetchReadmeImages = async (repoUrl, token) => {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) return [];
  const info = await call(`/repos/${parsed.owner}/${parsed.repo}`, { token });
  const readme = await fetchReadme(parsed.owner, parsed.repo, token);
  return parseReadme(readme, { ...parsed, branch: info.default_branch }).images;
};

export const socialCardUrl = (repoUrl) => {
  const parsed = parseRepoUrl(repoUrl);
  return parsed ? `https://opengraph.githubassets.com/1/${parsed.owner}/${parsed.repo}` : "";
};

/** Monta um rascunho de projeto a partir de um repositório. */
export const repoToProject = async (repo, token) => {
  const owner = repo.owner.login;
  const [languages, readme] = await Promise.all([
    call(`/repos/${owner}/${repo.name}/languages`, { token }).catch(() => ({})),
    fetchReadme(owner, repo.name, token),
  ]);
  const parsed = parseReadme(readme, { owner, repo: repo.name, branch: repo.default_branch });
  const tags = [...(repo.topics ?? []), ...Object.keys(languages).slice(0, 4)];
  const seen = new Set();

  return {
    id: `${slugify(repo.name)}-${Date.now().toString(36)}`,
    slug: slugify(repo.name),
    title: parsed.title || prettifyRepoName(repo.name),
    summary: repo.description || parsed.summary,
    description: parsed.description,
    highlights: parsed.highlights,
    tags: tags
      .filter((tag) => {
        const key = tag.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6),
    year: new Date(repo.created_at).getFullYear(),
    cover: parsed.images[0] ?? "",
    gallery: parsed.images.slice(1, 7),
    demoUrl: repo.homepage || "",
    repoUrl: repo.html_url,
    stars: repo.stargazers_count ?? 0,
    featured: false,
    hidden: false,
  };
};

/** Atualiza estrelas e ano, e preenche somente o que estiver vazio. */
export const refreshProject = async (project, token) => {
  const parsed = parseRepoUrl(project.repoUrl);
  if (!parsed) throw new Error("Este projeto não tem um link válido do GitHub.");
  const repo = await call(`/repos/${parsed.owner}/${parsed.repo}`, { token });
  const fresh = await repoToProject(repo, token);
  return {
    ...project,
    stars: fresh.stars,
    year: fresh.year,
    summary: project.summary || fresh.summary,
    description: project.description || fresh.description,
    highlights: project.highlights?.length ? project.highlights : fresh.highlights,
    tags: project.tags?.length ? project.tags : fresh.tags,
    cover: project.cover || fresh.cover,
    demoUrl: project.demoUrl || fresh.demoUrl,
  };
};

/** Confere se o token existe e pode escrever no repositório. */
export const connect = async ({ repo, branch, token }) => {
  const info = await call(`/repos/${repo}`, { token });
  if (!info.permissions?.push) {
    throw new Error("Este token não pode escrever no repositório. Ao criar, escolha Contents: Read and write.");
  }
  await call(`/repos/${repo}/branches/${encodeURIComponent(branch)}`, { token });
  return { repo, branch, token };
};

export const loadRemoteContent = async ({ repo, branch, token }) => {
  try {
    const raw = await call(`/repos/${repo}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(branch)}`, {
      token,
      accept: "application/vnd.github.raw+json",
    });
    return JSON.parse(raw);
  } catch (error) {
    if (/Não encontrei/.test(error.message)) return null; // O arquivo ainda não foi enviado.
    throw error;
  }
};

/**
 * Publica tudo em um único commit (JSON + imagens), evitando vários deploys seguidos.
 * files: [{ path, base64 }]
 */
export const publishToGitHub = async ({ repo, branch, token }, { content, files, message }) => {
  const ref = await call(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, { token });
  const parentSha = ref.object.sha;
  const parent = await call(`/repos/${repo}/git/commits/${parentSha}`, { token });

  const tree = [];
  for (const file of files) {
    const blob = await call(`/repos/${repo}/git/blobs`, {
      token,
      method: "POST",
      body: { content: file.base64, encoding: "base64" },
    });
    tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const contentBlob = await call(`/repos/${repo}/git/blobs`, {
    token,
    method: "POST",
    body: { content: `${JSON.stringify(content, null, 2)}\n`, encoding: "utf-8" },
  });
  tree.push({ path: CONTENT_PATH, mode: "100644", type: "blob", sha: contentBlob.sha });

  const newTree = await call(`/repos/${repo}/git/trees`, {
    token,
    method: "POST",
    body: { base_tree: parent.tree.sha, tree },
  });
  const commit = await call(`/repos/${repo}/git/commits`, {
    token,
    method: "POST",
    body: { message, tree: newTree.sha, parents: [parentSha] },
  });
  await call(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    token,
    method: "PATCH",
    body: { sha: commit.sha },
  });
  return commit.sha;
};

export const publishLocally = async ({ content, files }) => {
  const response = await fetch("/__admin/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, files }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Não consegui salvar os arquivos.");
};

const dataUrlOf = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não consegui ler o arquivo."));
    reader.readAsDataURL(file);
  });

/** Reduz fotos para WebP, para o site continuar leve. GIFs ficam como estão, para manter a animação. */
export const prepareImage = async (file) => {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("Envie uma imagem PNG, JPG, WebP ou GIF.");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("A imagem passa de 15 MB. Escolha uma menor.");

  if (file.type === "image/gif") {
    if (file.size > 5 * 1024 * 1024) throw new Error("GIFs podem ter no máximo 5 MB.");
    return { dataUrl: await dataUrlOf(file), extension: "gif" };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { dataUrl: canvas.toDataURL("image/webp", 0.85), extension: "webp" };
};

export const prepareFile = async (file) => ({ dataUrl: await dataUrlOf(file) });
