# FitApp AI Service

Serviço de Inteligência Artificial do FitApp construído com **FastAPI**, **LangChain**, **Google Gemini** e **LangGraph**.

## Features

### 1. Header Authentication Validation (`X-User-Id`)
- **Descrição**: Middleware de injeção de dependências que valida a presença do header `X-User-Id` em todas as rotas protegidas do AI Service.
- **Workflow**:
  1. Requisição chega na rota do FastAPI (`/chat` ou `/plans/generate`).
  2. A dependência `validate_user_header` intercepta o header `X-User-Id`.
  3. Se ausente ou vazio, lança exceção `401 Unauthorized`. Se válido, permite o prosseguimento.

### 2. Geração Estruturada de Planos de Dieta e Treino (`/plans/generate`)
- **Descrição**: Rota que utiliza modelos estruturados via Pydantic para gerar planos de dieta e treino totalmente alinhados ao objetivo do usuário.
- **Workflow**:
  1. O NestJS repassa a requisição POST `/plans/generate` com o header `X-User-Id`.
  2. O serviço executa a tool correspondente (`execute_generate_diet_plan` ou `execute_generate_workout_plan`).
  3. O LLM Gemini gera a resposta estruturada baseada no prompt do sistema (`nutritionist.md` ou `trainer.md`).
  4. O resultado estruturado é retornado ao NestJS que o persiste no PostgreSQL via Prisma.

### 3. Personalização de Planos (`/plans/customize`)
- **Descrição**: Permite o refinamento de um plano de dieta ou treino existente com base em um prompt do usuário.
- **Workflow**:
  1. O usuário solicita alterações no plano.
  2. O AI Service combina o prompt de customização com os prompts especializados.
  3. O plano refatorado é gerado via LLM e retornado em formato Pydantic.

### 4. Chat Orientado por Agente com SSE Stream (`/chat`)
- **Descrição**: Rota de chat em tempo real que utiliza grafo de estados (LangGraph) e StreamingResponse via Server-Sent Events (SSE).
- **Workflow**:
  1. O cliente envia uma mensagem POST `/chat`.
  2. O agente LangGraph inicializa seu estado (`AgentState`) com o `user_id` e histórico.
  3. O nó `context` busca informações do perfil e planos no banco de dados.
  4. O nó `router` avalia a intenção e roteia para execução de tools ou resposta direta do coach virtual (`coach.md`).
  5. A resposta final é transmitida via stream SSE (`text/event-stream`).
