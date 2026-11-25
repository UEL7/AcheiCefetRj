# AcheiCefetRJ

Site inicial de achados e perdidos do CEFET/RJ.

## Tecnologias
- HTML, CSS e JavaScript
- Supabase: banco de dados, login e armazenamento de fotos
- Vercel: publicação gratuita do site

## 1. Abrir no VS Code
Extraia a pasta. No VS Code, use Arquivo > Abrir Pasta e selecione `AcheiCefetRJ`.
Instale a extensão **Live Server**. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.

## 2. Criar o Supabase
1. Crie uma conta em https://supabase.com e um projeto.
2. Abra SQL Editor > New query.
3. Copie todo o conteúdo de `supabase.sql` e clique em Run.
4. Em Authentication > Providers, deixe Email habilitado.
5. Em Authentication > URL Configuration, adicione a URL local e depois a URL da Vercel em Redirect URLs, se necessário.
6. Em Project Settings > API, copie Project URL e a chave `anon`/`publishable` (nunca a `service_role`).
7. Faça uma cópia de `config.js.example` com o nome `config.js` e cole os dois valores.

## 3. Testar
Abra o site com Live Server. Crie uma conta com e-mail válido, entre e cadastre um objeto. Confira se ele aparece no mural. Teste também com outro campus e outro usuário.
Se a confirmação de e-mail estiver ativa, confirme pelo e-mail antes de entrar.

## 4. Publicar grátis na Vercel
1. Crie uma conta em https://github.com.
2. Crie um repositório chamado `AcheiCefetRJ`.
3. Envie os arquivos do projeto para o repositório, incluindo `config.js`.
4. Crie uma conta em https://vercel.com e conecte ao GitHub.
5. Clique em Add New > Project e importe `AcheiCefetRJ`.
6. Como é um site estático, não precisa de Build Command nem Output Directory; deixe os padrões e clique Deploy.
7. Abra o domínio `.vercel.app` gerado.
8. No Supabase, em Authentication > URL Configuration, configure Site URL com o domínio Vercel e adicione também o domínio em Redirect URLs.
9. Teste cadastro, login, foto, pesquisa e remoção no endereço público.

## 5. Expiração de um ano
A coluna `expires_at` é criada automaticamente como a data do cadastro + 1 ano. A consulta pública não mostra anúncios expirados. O agendamento pg_cron tenta apagar diariamente os registros vencidos. Confira em Database > Extensions se `pg_cron` está habilitada e em Database > Cron Jobs se o agendamento foi criado.

## Segurança e limitações desta primeira versão
- Visitantes podem consultar anúncios ativos.
- Apenas o usuário que cadastrou pode excluir seu anúncio.
- O contato informado no formulário fica público. Use um contato apropriado para divulgação.
- A chave anon/public do Supabase é usada no navegador; a proteção real depende das políticas RLS do SQL. Nunca exponha a chave `service_role`.
- A exclusão de um anúncio não apaga automaticamente a foto do Storage nesta versão; fotos órfãs podem ser limpas periodicamente no painel.
- Antes de divulgar amplamente, teste as permissões com duas contas diferentes e peça autorização institucional para uso do nome/marca do CEFET/RJ.
