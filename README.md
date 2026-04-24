# EXPOL PRO - Relatório Diário de Obras (RDO)

Este é o repositório oficial do aplicativo de Relatório Diário de Obras, desenvolvido para gerar relatórios padronizados de forma digital, com integração ao Supabase e deploy automático no GitHub Pages.

## 🔗 Links Importantes

- **Aplicativo no Ar (Produção):** [https://helveciopereira.github.io/rdo-app/](https://helveciopereira.github.io/rdo-app/)
- **Repositório no GitHub:** [https://github.com/helveciopereira/rdo-app](https://github.com/helveciopereira/rdo-app)
- **Banco de Dados:** [Supabase](https://supabase.com) (Projeto: `RDO-Backend`)

---

## 🏗️ Como a Arquitetura Funciona

O projeto foi construído usando:
- **Next.js (React)** para a estrutura de páginas e componentes.
- **Tailwind CSS** para estilização visual.
- **Supabase (PostgreSQL)** para persistência dos dados.
- **GitHub Actions** para automação de deploy (hospedagem no GitHub Pages).

### Principais Arquivos e Pastas
- `app/page.tsx`: **Este é o arquivo principal**. Quase toda a lógica da aplicação (formulário, geração de PDF, conexão com o banco e listas como "Efetivo" e "Serviços") está dentro dele. É aqui que você altera nomes de opções ou fluxos.
- `src/lib/supabase.ts`: Arquivo que exporta o cliente de conexão com o banco de dados.
- `.github/workflows/deploy.yml`: O script (Action) que o GitHub lê. Toda vez que ocorre um `push` (envio de código) para a branch `main`, esse script empacota o código e joga o site novo no ar.
- `public/pollux-logo.png`: A imagem base da logo utilizada no relatório.

---

## 🚀 Como Executar o Projeto Localmente

Se você estiver em um computador novo ou voltando ao projeto depois de um tempo:

1. **Requisitos:** Tenha o [Node.js](https://nodejs.org/) instalado no computador.
2. Abra a pasta do projeto no seu terminal (ou VSCode).
3. Instale as dependências executando:
   ```bash
   npm install
   ```
4. Crie um arquivo chamado `.env.local` na raiz do projeto contendo as chaves do seu Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
   ```
5. Rode o projeto no ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```
6. Acesse no navegador: `http://localhost:3000`

---

## 📤 Como Atualizar o Site no Ar

Qualquer alteração que você fizer no código (por exemplo, adicionar um novo serviço ao menu suspenso em `app/page.tsx`), você só precisa salvar e enviar para o GitHub usando os comandos do Git:

```bash
git add .
git commit -m "Descreva sua alteração aqui"
git push
```

**Pronto!** Em cerca de 1 a 2 minutos, a ação do GitHub (GitHub Actions) vai automaticamente:
1. Puxar o código que você acabou de enviar.
2. Compilar o React/Next.js.
3. Atualizar a página `https://helveciopereira.github.io/rdo-app/`.

Se quiser ver o andamento do envio, basta ir na aba **Actions** no [repositório do GitHub](https://github.com/helveciopereira/rdo-app/actions).

---

## 📝 Observações Adicionais

- **Imagens:** Conforme solicitado durante o desenvolvimento, as imagens *não* são enviadas para o Storage do Supabase (para economizar espaço e otimizar tempo). Elas são processadas localmente pelo navegador exclusivamente para a geração do PDF.
- **Datalists:** Os menus de sugestão de `Efetivo` e `Local do Serviço` são montados no HTML nativo (tags `<datalist>`) para que seja possível tanto selecionar um pronto quanto digitar um novo livremente. Você pode adicionar novas sugestões no arquivo `app/page.tsx`.
