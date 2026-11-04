import fs from "node:fs/promises";
import path from "node:path";

const MAX_BODY = 64 * 1024 * 1024;
const CONTENT_PATH = "src/content/portfolio.json";
// Só estes caminhos podem ser gravados pelo admin local.
const ALLOWED_FILE = /^public\/(projects\/[a-z0-9._-]+\.(webp|png|jpe?g|gif)|meuCurriculo\.pdf)$/;

const isLocalHost = (host = "") => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("Arquivos grandes demais."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

/**
 * Durante o `npm run dev`, o admin salva direto nos arquivos do projeto.
 * Existe só no servidor de desenvolvimento: nada disso vai para o site publicado.
 */
export function adminDevPlugin() {
  return {
    name: "portfolio-admin-dev",
    apply: "serve",
    configureServer(server) {
      const root = server.config.root;

      server.middlewares.use("/__admin/save", async (req, res) => {
        const reply = (status, body) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };

        // Bloqueia outros sites tentando escrever nos seus arquivos pelo navegador.
        const origin = req.headers.origin ?? "";
        const originHost = origin.replace(/^https?:\/\//, "");
        if (
          req.method !== "POST" ||
          !isLocalHost(req.headers.host) ||
          originHost !== req.headers.host ||
          !req.headers["content-type"]?.includes("application/json")
        ) {
          return reply(403, { error: "Requisição não permitida." });
        }

        try {
          const { content, files = [] } = JSON.parse(await readBody(req));
          if (!content?.profile || !Array.isArray(content.projects)) {
            return reply(400, { error: "Conteúdo inválido." });
          }
          const invalid = files.find((file) => !ALLOWED_FILE.test(file.path));
          if (invalid) return reply(400, { error: `Caminho não permitido: ${invalid.path}` });

          for (const file of files) {
            const target = path.join(root, file.path);
            await fs.mkdir(path.dirname(target), { recursive: true });
            await fs.writeFile(target, Buffer.from(file.base64, "base64"));
          }
          await fs.writeFile(path.join(root, CONTENT_PATH), `${JSON.stringify(content, null, 2)}\n`);
          reply(200, { ok: true });
        } catch (error) {
          reply(500, { error: error.message });
        }
      });
    },
  };
}
