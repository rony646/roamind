# Roamind

Chat de IA para uso pessoal no iPhone. A conversa fica salva, a resposta chega em tempo real e o modelo é um só, configurado no backend.

Também é um projeto de portfólio: app, API, login, banco e streaming, de ponta a ponta.

## Estado

Em construção. Ainda não roda.

## Stack

- App: React Native com Expo
- API: NestJS
- Banco: Postgres no Neon, com Drizzle
- API no ar: Render, plano free
- Modelo: [OpenUncensored](https://api.openuncensored.com/v1), compatível com a API da OpenAI

Monorepo com pnpm e Turborepo.

```
apps/
  backend/      # NestJS
  mobile/       # Expo
packages/
  shared/       # tipos e schemas
  api-client/   # chamadas à API
```

## Primeira versão

- Login com email e senha
- Chat com resposta em streaming
- Histórico: listar, abrir e apagar
- Prompt de sistema
- Parar a resposta, regenerar a última e copiar
- Um modelo só, definido no ambiente do backend

## Modelo

- Provedor: OpenUncensored
- Id inicial: `deepseek-v4.1-flash-1017-uncensored`
- A chave fica só no backend
- Trocar de modelo, nesta versão, é mudar a variável de ambiente e fazer deploy

Uma lista curta de modelos fica para depois. Entram só os que forem escolhidos.

## Como rodar

Ainda não há comando. Quando o backend subir, o passo a passo entra aqui.

Até o TestFlight, o app abre pelo Expo Go.
