# Pocket Pal Finance Journal

Crie um App de Finanças Pessoais com base no seguinte PRD (Product Requirements Document)

# PRD - Assistente Financeiro Conversacional
## Visão do Produto
Criar um aplicativo de finanças pessoais que permita ao usuário registrar, consultar e acompanhar sua vida financeira por meio de conversas em linguagem natural, eliminando a complexidade de planilhas e aplicativos tradicionais.
O produto deve atuar como um assistente financeiro pessoal, ajudando usuários iniciantes a entenderem melhor seus hábitos financeiros, economizarem dinheiro e alcançarem metas financeiras.
---
# Problema
Muitas pessoas desistem de controlar suas finanças porque:
- Precisam preencher formulários manualmente.
- Não sabem categorizar despesas corretamente.
- Consideram relatórios financeiros difíceis de entender.
- Recebem pouca orientação personalizada.
- Perdem a motivação após alguns dias de uso.
Como consequência, perdem visibilidade sobre seus gastos e têm dificuldade em atingir objetivos financeiros.
---
# Objetivo do Produto
Tornar a gestão financeira simples, intuitiva e acessível por meio de uma experiência conversacional baseada em IA.
O usuário deve conseguir registrar movimentações financeiras da mesma forma que conversa com uma pessoa.
Exemplos:
Usuário:
"Gastei R$ 45 no almoço hoje."
Sistema:
"Registrei uma despesa de R$ 45 na categoria Alimentação."
Usuário:
"Recebi meu salário de R$ 3.500."
Sistema:
"Receita registrada na categoria Salário."
---
# Público-Alvo
## Público Primário
Pessoas iniciantes em educação financeira e organização pessoal.
## Público Secundário
- Usuários que abandonaram aplicativos financeiros tradicionais.
- Pessoas que não gostam de planilhas.
- Usuários com pouco conhecimento financeiro.
- Pessoas que desejam criar o hábito de acompanhar gastos.
---
# Proposta de Valor
O aplicativo elimina a necessidade de preenchimentos complexos e oferece:
- Registro de gastos por conversa.
- Categorização automática.
- Acompanhamento de metas financeiras.
- Recomendações personalizadas de economia.
- Relatórios simples e fáceis de entender.
- Orientação contínua através de um agente financeiro virtual.
---
# Funcionalidades do MVP
## 1. Chat Financeiro
Permitir registro de receitas e despesas por linguagem natural.
Exemplos:
- "Gastei R$ 80 no mercado."
- "Paguei R$ 120 de internet."
- "Recebi R$ 2.500 de salário."
### Critérios de Sucesso
O sistema deve identificar:
- Valor
- Tipo da transação
- Categoria
- Data
---
## 2. Categorização Automática
Classificar transações automaticamente.
Categorias iniciais:
- Alimentação
- Transporte
- Moradia
- Saúde
- Educação
- Lazer
- Salário
- Outros
### Critério de Sucesso
Mais de 80% das transações devem ser classificadas corretamente sem intervenção do usuário.
---
## 3. Metas Financeiras
Permitir a criação de objetivos financeiros.
Exemplos:
- Reserva de emergência
- Viagem
- Compra de notebook
- Compra de veículo
### Recursos
- Nome da meta
- Valor desejado
- Prazo
- Progresso percentual
---
## 4. Agente Financeiro
Assistente virtual que analisa os hábitos do usuário e gera recomendações.
Exemplos:
- "Você gastou 18% a mais com delivery este mês."
- "Se economizar R$ 10 por dia, poderá guardar R$ 300 por mês."
- "Seu maior gasto atual está na categoria Alimentação."
---
## 5. Dashboard Simplificado
Apresentar informações financeiras de forma clara.
Indicadores:
- Receitas do mês
- Despesas do mês
- Saldo atual
- Categorias com maior gasto
- Evolução dos gastos
- Progresso das metas
---
# Fluxo Principal do Usuário
## Primeiro Acesso
1. Criar conta.
2. Informar objetivo financeiro principal.
3. Receber introdução rápida ao funcionamento do aplicativo.
## Uso Recorrente
1. Registrar movimentações no chat.
2. Receber confirmação da operação.
3. Consultar dashboard.
4. Receber insights do agente financeiro.
5. Acompanhar metas.
---
# Design Universal e Acessibilidade
## Objetivo
O produto deverá seguir princípios de Design Universal para garantir uma boa experiência para o maior número possível de pessoas, independentemente de:
- Idade
- Conhecimento financeiro
- Experiência digital
- Limitações visuais
- Limitações motoras
- Limitações cognitivas
---
## Requisitos de Usabilidade
### Linguagem
- Utilizar linguagem simples e amigável.
- Evitar termos técnicos desnecessários.
- Explicar conceitos financeiros quando necessário.
### Navegação
- Fluxos intuitivos.
- Poucas etapas para executar ações importantes.
- Priorizar simplicidade.
### Leitura
- Alto contraste entre texto e fundo.
- Fontes legíveis.
- Espaçamento adequado.
- Layout responsivo.
### Acessibilidade
- Compatibilidade com leitores de tela.
- Ícones acompanhados por texto.
- Feedback visual e textual.
- Botões com área de toque adequada.
### Inclusão Cognitiva
- Evitar excesso de informações.
- Mostrar apenas informações relevantes.
- Utilizar visualizações simples.
- Guiar o usuário em tarefas importantes.
### Flexibilidade
O usuário deve conseguir:
- Registrar gastos pelo chat.
- Corrigir lançamentos facilmente.
- Utilizar a aplicação sem conhecimento prévio de finanças.
---
# Requisitos Não Funcionais
## Performance
- Respostas do chat em até 3 segundos.
## Segurança
- Dados criptografados.
- Autenticação por e-mail ou Google.
- Conformidade com LGPD.
## Responsividade
- Mobile-first.
- Funcionamento adequado em smartphones, tablets e desktop.
---
# Métricas de Sucesso
## Adoção
- Número de usuários ativos semanalmente.
- Número de usuários ativos mensalmente.
## Engajamento
- Retenção após 7 dias.
- Retenção após 30 dias.
- Quantidade média de registros por usuário.
## Valor Gerado
- Percentual de usuários que criaram metas.
- Percentual de usuários que registraram mais de 10 transações.
- Percentual de usuários que retornam ao aplicativo semanalmente.
---
# Plano de Validação Inicial
## Hipótese Principal
Usuários preferem registrar movimentações financeiras por conversa em vez de utilizar formulários tradicionais.
## Experimento
Disponibilizar o MVP para um grupo inicial de 10 a 20 usuários.
## Objetivos da Validação
- Verificar facilidade de uso.
- Medir precisão da categorização.
- Avaliar utilidade dos insights financeiros.
- Medir frequência de uso.
## Perguntas para Feedback
1. Foi fácil registrar gastos?
2. As categorias sugeridas fizeram sentido?
3. As recomendações ajudaram você?
4. Você utilizaria o aplicativo semanalmente?
5. O que sentiu falta?
---
# Principais Telas
## Tela de Login
Objetivo:
Permitir autenticação do usuário.
Elementos:
- Login com Google
- Login por e-mail
- Recuperação de senha
---
## Tela de Chat
Objetivo:
Principal ponto de interação com o usuário.
Elementos:
- Histórico de conversas
- Campo de mensagem
- Sugestões rápidas
---
## Dashboard Financeiro
Objetivo:
Visualizar situação financeira atual.
Elementos:
- Receita total
- Despesa total
- Saldo
- Gráficos simplificados
- Principais categorias
---
## Tela de Metas
Objetivo:
Gerenciar objetivos financeiros.
Elementos:
- Lista de metas
- Progresso
- Prazo
- Valor acumulado
---
## Perfil e Configurações
Objetivo:
Personalização e controle da conta.
Elementos:
- Dados do usuário
- Preferências
- Segurança
- Privacidade
---
# Recursos Técnicos Necessários
## Frontend
- Interface responsiva
- Chat conversacional
- Dashboard financeiro
- Gestão de metas
## Backend
- Banco de dados
- Sistema de autenticação
- API de IA
- Processamento de linguagem natural
- Motor de categorização
## Inteligência Artificial
- Extração de informações financeiras
- Classificação automática
- Geração de insights
- Assistente conversacional
---
# Definição de Sucesso do MVP
O MVP será considerado validado quando:
- Pelo menos 70% dos usuários conseguirem registrar movimentações sem ajuda.
- Pelo menos 50% retornarem após 7 dias.
- A categorização automática atingir mais de 80% de acerto.
- Os usuários considerarem o chat mais simples que planilhas ou aplicativos tradicionais.

Pode continuar no modo gratuito.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/21ceef26-9a12-41be-9417-18010fac1f34).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
