// Extrai do README o que serve para o portfólio. Funções puras, sem acesso à rede.

const BADGE = /(shields\.io|badgen\.net|badge|travis-ci|codecov|\.svg(\?|$)|komarev|github-readme-stats|skillicons)/i;
const FEATURE_HEADING = /(funcionalidad|features|o que faz|recursos|destaques|principais)/i;

const stripEmoji = (text) => text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "");

export const cleanInline = (text) =>
  stripEmoji(text)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|\*|`)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const resolveImage = (url, { owner, repo, branch }) => {
  const clean = url.trim().replace(/^<|>$/g, "").split(/\s+/)[0];
  const blob = clean.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/);
  if (blob) return `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3].replace(/\?.*$/, "")}`;
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith("data:") || clean.startsWith("#")) return "";
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${clean.replace(/^\.?\//, "")}`;
};

export const extractImages = (markdown, source) => {
  const urls = [];
  for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)|<img[^>]+src=["']([^"']+)["']/gi)) {
    const url = resolveImage(match[1] ?? match[2], source);
    if (url && !BADGE.test(url) && !urls.includes(url)) urls.push(url);
  }
  return urls;
};

const truncate = (text, max) => {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const sentence = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "));
  if (sentence > max * 0.5) return slice.slice(0, sentence + 1);
  return `${slice.slice(0, slice.lastIndexOf(" "))}…`;
};

export const parseReadme = (markdown = "", source = {}) => {
  const text = markdown.replace(/<!--[\s\S]*?-->/g, "").replace(/\r/g, "");
  const withoutCode = text.replace(/```[\s\S]*?```/g, "");

  const heading = withoutCode.match(/^#\s+(.+)$/m) ?? withoutCode.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = heading ? cleanInline(heading[1]) : "";

  // Títulos, listas e tabelas saem antes: o parágrafo pode vir colado neles, sem linha em branco.
  const prose = withoutCode
    .split("\n")
    .map((line) => (/^\s*(#{1,6}\s|\||[-*+]\s|\d+\.\s|>|-{3,}|={3,})/.test(line) ? "" : line))
    .join("\n");
  const blocks = prose.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const paragraphs = [];
  for (const block of blocks) {
    if (/^<(table|div|h\d|p\s+align)/i.test(block)) continue;
    const clean = cleanInline(block);
    if (clean.length < 40 || clean.endsWith(":") || /^(clique|baixe|execute|instale|para rodar)/i.test(clean)) continue;
    paragraphs.push(clean);
    if (paragraphs.length === 2) break;
  }

  // READMEs escritos em HTML guardam o texto dentro de <p>.
  if (paragraphs.length === 0) {
    for (const match of withoutCode.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const clean = cleanInline(match[1]);
      if (clean.length >= 40) paragraphs.push(clean);
      if (paragraphs.length === 2) break;
    }
  }

  const highlights = [];
  const lines = withoutCode.split("\n");
  const start = lines.findIndex((line) => /^#{1,4}\s/.test(line) && FEATURE_HEADING.test(line));
  if (start !== -1) {
    for (const line of lines.slice(start + 1)) {
      if (/^#{1,4}\s/.test(line)) break;
      const bullet = line.match(/^\s{0,1}[-*+]\s+(.+)$/);
      if (bullet) {
        const clean = cleanInline(bullet[1]);
        if (clean && !clean.endsWith(":")) highlights.push(clean.length > 140 ? truncate(clean, 140) : clean);
      }
      if (highlights.length === 6) break;
    }
  }

  return {
    title: title.length <= 60 ? title : "",
    summary: paragraphs[0] ? truncate(paragraphs[0], 170) : "",
    description: paragraphs.join("\n\n"),
    highlights,
    images: extractImages(text, source),
  };
};

export const prettifyRepoName = (name = "") =>
  name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (first) => first.toUpperCase());
