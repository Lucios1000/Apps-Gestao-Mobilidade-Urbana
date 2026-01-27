# Implementação da API de IA no TKX Franca Dashboard

## ✅ IMPLEMENTAÇÃO ATUAL: Google Gemini

O projeto já está configurado para usar o **Google Gemini** como provedor de IA.

### Configuração Realizada:
- ✅ Pacote `@google/generative-ai` instalado
- ✅ Arquivo `.env` criado com variável `REACT_APP_GEMINI_API_KEY`
- ✅ Componente `AITab.tsx` atualizado para usar Gemini
- ✅ Função `callGeminiAI` implementada

### Para Ativar:
1. **Obtenha sua chave da API** seguindo o passo a passo acima
2. **Substitua no arquivo `.env`**:
   ```
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```
3. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## Funcionalidades Atuais
- Chat em tempo real com Gemini Pro
- Contexto completo do dashboard TKX Franca
- Respostas em português sobre dados financeiros
- Análise inteligente de cenários e projeções

### 1. Instalar dependências
```bash
npm install openai
# ou
npm install @anthropic-ai/sdk
```

### 2. Configurar API Key
Adicione ao arquivo `.env`:
```
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
# ou para Anthropic
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 3. Substituir a função `simulateAIResponse`
No arquivo `components/AITab.tsx`, substitua a função `simulateAIResponse` por:

#### Para OpenAI:
```typescript
const callOpenAI = async (prompt: string): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Erro na API do OpenAI');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
```

#### Para Anthropic Claude:
```typescript
const callAnthropic = async (prompt: string): Promise<string> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error('Erro na API do Anthropic');
  }

  const data = await response.json();
  return data.content[0].text;
};
```

### 4. Melhorar o contexto
O contexto atual inclui:
- Parâmetros de simulação
- Projeções mensais (primeiros 12 meses)
- Dados de auditoria
- Resumo financeiro

Para melhorar as respostas, considere adicionar mais contexto das outras abas.

### 5. Tratamento de Erros
Implemente tratamento adequado para:
- Limites de API
- Erros de rede
- Respostas inválidas

## Funcionalidades
- Chat em tempo real
- Análise de dados do dashboard
- Respostas contextualizadas
- Interface responsiva

## Próximos Passos
1. Escolher provedor de IA (OpenAI, Anthropic, Google, etc.)
2. Implementar autenticação segura
3. Adicionar histórico de conversas
4. Melhorar prompts para respostas mais precisas
5. Adicionar análise de gráficos e visualizações