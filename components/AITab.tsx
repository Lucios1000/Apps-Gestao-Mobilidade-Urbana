import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { SimulationParams, MonthlyResult } from '../types';

interface AITabProps {
  currentParams: SimulationParams;
  projections: MonthlyResult[];
  audits: any;
  scenario: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AITab: React.FC<AITabProps> = ({ currentParams, projections, audits, scenario }) => {
  const [messages, setMessages] = useState<Message[]>([
   {
  id: 'debug-auth',
  role: 'assistant',
  content: `🔧 Debug: API Key configurada: ${import.meta.env.VITE_GEMINI_API_KEY ? '✅ Sim' : '❌ Não (Verifique VITE_GEMINI_API_KEY no .env)'}`,
  timestamp: new Date(),
},
]);
const [input, setInput] = useState('');
const [isLoading, setIsLoading] = useState(false);

const generateContext = () => {
  const context = {
    scenario,
    params: currentParams,
    projections: projections.slice(0, 12),
    audits,
    summary: {
      totalRevenue: `R$ ${projections.reduce((sum, p) => sum + p.revenue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalCosts: `R$ ${projections.reduce((sum, p) => sum + p.totalCosts, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      netProfit: `R$ ${projections.reduce((sum, p) => sum + p.netProfit, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      marketShare: `${(currentParams.marketShare || 0).toFixed(2)}%`,
      targetUsers: currentParams.targetUsers,
    },
  };
  return JSON.stringify(context, null, 2);
};

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = generateContext();
      const prompt = `Você é um assistente especializado em análise de viabilidade financeira para o projeto TKX Franca, um serviço de mobilidade urbana.

Dados do contexto atual:
${context}

Pergunta do usuário: ${input}

Forneça uma resposta detalhada, profissional e baseada nos dados fornecidos. Use formatação clara e, se apropriado, sugira insights ou recomendações.`;

      // Chamada para API do Gemini
      const response = await callGeminiAI(prompt);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Erro ao processar sua pergunta.

**Detalhes do erro:**
${error instanceof Error ? error.message : 'Erro desconhecido'}

**Verificações:**
- 🔑 API Key configurada: ${import.meta.env.VITE_GEMINI_API_KEY ? '✅ Sim' : '❌ Não'}
- 🌐 Conexão com internet: Verifique sua conexão
- 🔐 Chave válida: Confirme se a chave do Google AI Studio está correta

**Soluções possíveis:**
1. Verifique se a chave da API está correta no arquivo .env
2. Confirme se a API do Gemini está habilitada no Google Cloud Console
3. Aguarde alguns minutos caso tenha excedido a quota
4. Tente novamente em alguns instantes

Abra o console do navegador (F12) para ver logs detalhados.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const callGeminiAI = async (prompt: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    console.log('🔑 API Key encontrada:', apiKey ? 'Sim' : 'Não');
    console.log('🔑 API Key length:', apiKey?.length);

    if (!apiKey) {
      throw new Error('Chave da API não encontrada. Crie um arquivo .env na raiz com: VITE_GEMINI_API_KEY=sua_chave_aqui');
    }

    try {
      console.log('🤖 Fazendo chamada direta para API do Gemini...');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      console.log('📤 Status da resposta:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro da API:', errorData);

        // Verificar se é erro de quota
        if (response.status === 429 || errorData.includes('QUOTA_EXCEEDED') || errorData.includes('RESOURCE_EXHAUSTED')) {
          throw new Error('Quota da API Gemini excedida. A chave gratuita atingiu o limite diário. Aguarde até amanhã ou configure uma chave paga no Google AI Studio.');
        }

        // Verificar se é erro de chave inválida
        if (response.status === 400 || errorData.includes('API_KEY_INVALID')) {
          throw new Error('Chave da API inválida. Verifique se a chave do Google AI Studio está correta.');
        }

        throw new Error(`Erro na API Gemini: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('✅ Dados recebidos:', data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const text = data.candidates[0].content.parts[0].text;
        console.log('✅ Texto extraído:', text.substring(0, 100) + '...');
        return text;
      } else {
        throw new Error('Resposta da API não contém texto esperado');
      }

    } catch (error) {
      console.error('❌ Erro na chamada da API:', error);

      if (error instanceof Error) {
        console.error('Detalhes:', error.message);
      }

      throw error;
    }
  };

  // Função simulada - substitua pela chamada real da API de IA
  const simulateAIResponse = async (prompt: string): Promise<string> => {
    // Para implementação real, substitua por chamada à API de IA (ex: OpenAI)
    // Exemplo com OpenAI:
    /*
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
    const data = await response.json();
    return data.choices[0].message.content;
    */

    // Simulação de delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Respostas simuladas baseadas em palavras-chave
    if (prompt.toLowerCase().includes('receita')) {
      const totalRevenue = projections.reduce((sum, p) => sum + p.revenue, 0);
      return `Analisando as projeções, a receita total estimada para os próximos 36 meses é de ${totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Isso representa um crescimento consistente baseado nos parâmetros atuais de market share (${currentParams.marketShare}%) e demanda projetada.`;
    }

    if (prompt.toLowerCase().includes('lucro')) {
      const netProfit = projections.reduce((sum, p) => sum + p.netProfit, 0);
      return `O lucro líquido projetado é de ${netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para o período completo. Este valor considera todos os custos operacionais, incluindo drivers, marketing e infraestrutura.`;
    }

    if (prompt.toLowerCase().includes('cenário')) {
      return `Atualmente estamos analisando o cenário ${scenario}. Este cenário considera os parâmetros configurados, incluindo taxa de crescimento de ${(currentParams.growthRate * 100).toFixed(1)}% ao ano e market share alvo de ${currentParams.marketShare}%.`;
    }

    return `Com base nos dados atuais do dashboard TKX Franca, posso fornecer insights sobre:

• **Projeções Financeiras**: Receitas, custos e lucros projetados
• **Análise de Cenários**: Comparação entre diferentes abordagens
• **KPIs**: Métricas de performance como market share, satisfação do cliente
• **Parâmetros**: Configurações atuais e impacto nas projeções
• **Recomendações**: Sugestões baseadas nos dados analisados

Qual aspecto específico você gostaria de explorar?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900/70 to-slate-800/50 border border-slate-700/40 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Bot className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-xl font-bold text-white">Assistente IA TKX Franca</h2>
            <p className="text-slate-400 text-sm">Análise inteligente dos dados do dashboard</p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-slate-950/50 border border-slate-700/30 rounded-lg h-96 overflow-y-auto mb-4 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Bot className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-yellow-500 text-slate-900'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <User className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Bot className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                <div className="bg-slate-800 p-3 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre o dashboard..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          <p>💡 Dicas: Pergunte sobre "receitas projetadas", "análise de cenários", "impacto de parâmetros", etc.</p>
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                const testPrompt = 'Responda apenas: "Teste bem-sucedido! A API do Gemini está funcionando."';
                const response = await callGeminiAI(testPrompt);
                alert(`✅ API funcionando!\n\nResposta: ${response}`);
              } catch (error) {
                alert(`❌ Erro na API:\n\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
              } finally {
                setIsLoading(false);
              }
            }}
            className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
            disabled={isLoading}
          >
            🔧 Testar API
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITab;