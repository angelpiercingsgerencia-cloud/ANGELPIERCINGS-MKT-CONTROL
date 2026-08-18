# ANGELPIERCINGS-MKT-CONTROL

Painel de controle de marketing e parcerias da Angel Piercings.

## Arquivos

- `index.html`: aplicativo principal.
- `payload/`: pacote compactado do aplicativo usado pelo carregador publicado no GitHub.
- `config.js`: URL do banco/API usada pelo site.
- `apps-script-backend.gs`: backend para usar uma planilha Google Sheets como banco de dados.

## Conectar ao banco

1. Crie um projeto no Google Apps Script.
2. Cole o conteudo de `apps-script-backend.gs`.
3. Execute `setupDatabase` uma vez e autorize o acesso.
4. Implante como Web App com acesso para quem tiver o link.
5. Copie a URL terminada em `/exec`.
6. Cole essa URL em `config.js`, no campo `databaseUrl`.

Enquanto `databaseUrl` estiver vazio, o painel funciona com armazenamento local do navegador.

## Publicar

No GitHub, habilite Pages em `Settings > Pages`, usando a branch `main` e a pasta raiz.
