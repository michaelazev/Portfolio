# Portfólio de Michael Azevedo

Portfólio com tema cósmico: o nome se forma com estrelas, as habilidades viram constelações e cada projeto sem foto ganha um planeta exclusivo. Inclui uma área de admin para gerenciar tudo sem mexer no código.

Feito com React 19, Vite e Tailwind CSS 4.

## Rodar no computador

```bash
npm install
npm run dev
```

- Site: <http://localhost:5173>
- Admin: <http://localhost:5173/admin>

No computador, o admin abre sem login e salva direto nos arquivos do projeto. Depois é só enviar com `git push`.

## Colocar no ar

1. Envie o projeto para o repositório `michaelazev/Portfolio` no GitHub.
2. Na [Vercel](https://vercel.com/new), importe esse repositório. Ela detecta o Vite sozinha; não precisa mudar nada.
3. Pronto. Cada alteração enviada ao repositório atualiza o site em cerca de 1 minuto.

## Usar o admin no site publicado

Abra `seu-site.vercel.app/admin`. Na primeira vez:

1. Clique em **Crie o token aqui**. A página do GitHub já vem preenchida.
2. Em **Repository access**, escolha **Only select repositories** e marque só o `Portfolio`.
3. Gere o token, copie e cole no admin.

O token fica salvo apenas naquele navegador, até você clicar em **Sair**. Quando ele expirar (1 ano) ou se você perder o acesso ao aparelho, revogue-o em GitHub > Settings > Developer settings e crie outro.

**Segurança:** qualquer pessoa pode abrir `/admin`, mas sem o seu token não consegue alterar nada, porque quem autoriza a gravação é o próprio GitHub. Não há senha guardada no site nem servidor para invadir. Só não use o admin em computadores de terceiros.

### Adicionar um projeto do GitHub

1. Em **Projetos**, clique em **Importar do GitHub**.
2. Marque os repositórios e clique em **Importar**. Nome, descrição, tecnologias, estrelas, links e imagens do README são preenchidos automaticamente.
3. Clique no projeto para revisar o texto e trocar a foto: arraste uma imagem, cole com Ctrl+V ou use o cartão do GitHub.
4. Clique em **Publicar alterações**.

Tudo o que você edita fica em rascunho, mesmo se fechar a aba, até publicar. As imagens enviadas são reduzidas e convertidas para WebP automaticamente.

### O que mais dá para editar

- **Projetos:** ordem, destaque, ocultar, galeria e links.
- **Perfil:** textos, contatos, redes sociais e o PDF do currículo.
- **Habilidades:** nome, nível e categoria.
- **Trajetória:** formação e experiências.

## Formulário de contato

Sem configuração, o formulário abre o e-mail do visitante ou o WhatsApp com a mensagem pronta. Para receber mensagens direto, crie um formulário gratuito no [Formspree](https://formspree.io) e cole o endereço em **Perfil > Receber mensagens direto**.

## Onde fica cada coisa

| Caminho | Conteúdo |
| --- | --- |
| `src/content/portfolio.json` | Todo o conteúdo do site (é o que o admin edita) |
| `public/projects/` | Fotos dos projetos |
| `public/meuCurriculo.pdf` | Currículo |
| `src/components/` | Partes do site público |
| `src/admin/` | Área de admin (carregada só em `/admin`) |
| `scripts/admin-dev-plugin.js` | Gravação local, ativa só no `npm run dev` |
