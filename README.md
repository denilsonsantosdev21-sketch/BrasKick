# BrasKick - Guia de Implantação (Vercel + Supabase)

Este projeto foi configurado para ser implantado na **Vercel** com persistência de dados no **Supabase**.

## 🚀 Passo a Passo para Implantação na Vercel

1.  **Prepare o Repositório:**
    *   Certifique-se de que seu código está em um repositório Git (GitHub, GitLab ou Bitbucket).

2.  **Importe no Vercel:**
    *   Acesse [vercel.com](https://vercel.com) e clique em "Add New" > "Project".
    *   Importe seu repositório.

3.  **Configure as Variáveis de Ambiente:**
    *   Durante a configuração do projeto na Vercel, vá até a seção **Environment Variables**.
    *   Adicione as seguintes variáveis (obtidas no seu painel do Supabase):
        *   `VITE_SUPABASE_URL`: Sua URL do projeto Supabase.
        *   `VITE_SUPABASE_ANON_KEY`: Sua chave anônima (anon key) do Supabase.

4.  **Configurações de Build:**
    *   A Vercel deve detectar automaticamente que o projeto usa **Vite**.
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
    *   **Install Command:** `npm install`

5.  **Deploy:**
    *   Clique em "Deploy". A Vercel cuidará do resto!

## 🛠️ Configuração do Supabase (Obrigatório)

Para que o salvamento funcione, você **precisa** criar a tabela no seu banco de dados Supabase:

1.  Vá ao **SQL Editor** no painel do Supabase.
2.  Cole e execute o seguinte script:

```sql
-- Tabela para salvar o progresso dos usuários
create table saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  game_state jsonb not null,
  updated_at timestamptz default now()
);

-- Habilitar RLS (Row Level Security)
alter table saves enable row level security;

-- Política: Usuários só podem ver/editar seus próprios dados
create policy "Users can manage their own saves"
on saves for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 🔒 Segurança

O arquivo `vercel.json` já inclui cabeçalhos de segurança básicos para proteger seu app contra ataques comuns (XSS, Clickjacking, etc.).

---
*BrasKick - O seu destino no futebol começa aqui.*
