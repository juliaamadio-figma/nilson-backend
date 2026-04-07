import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Nilson Backend funcionando! 🎯',
    hasApiKey: !!GEMINI_API_KEY
  });
});

app.get('/debug', (req, res) => {
  res.json({
    hasApiKey: !!GEMINI_API_KEY,
    apiKeyLength: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
    apiKeyStart: GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + '...' : 'NENHUMA'
  });
});

app.get('/analyze', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Endpoint /analyze ativo. Use POST para analisar designs.' 
  });
});

app.post('/analyze', async (req, res) => {
  try {
    const { designInfo } = req.body;

    if (!designInfo || !designInfo.image) {
      return res.status(400).json({ error: 'Imagem obrigatória' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key não configurada' });
    }

    console.log('Recebendo análise para:', designInfo.name);
    console.log('Tamanho da imagem base64:', designInfo.image.length, 'chars');

    const prompt = `Você é Nilson, especialista em Usabilidade e UX/UI. Analise esta interface usando as 10 Heurísticas de Nielsen.

INFORMAÇÕES DO FRAME:
- Nome: "${designInfo.name}"
- Dimensões: ${designInfo.width}x${designInfo.height}px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analise a interface VISUALMENTE. Observe cores, tipografia, espaçamentos, hierarquia, alinhamentos, consistência.

**🎯 PRIMEIRA IMPRESSÃO**
[2-3 frases sobre o que você vê visualmente]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📋 ANÁLISE HEURÍSTICA** (1-2 frases por heurística)

**1. Visibilidade do Status do Sistema**
[O que você observa sobre feedbacks visuais, estados, indicadores?]

**2. Correspondência com o Mundo Real**
[Linguagem, ícones, metáforas são familiares?]

**3. Controle e Liberdade do Usuário**
[Há botões de navegação, cancelar, voltar?]

**4. Consistência e Padrões**
[Tipografia, cores, espaçamentos são uniformes?]

**5. Prevenção de Erros**
[Validações, confirmações, states desabilitados estão visíveis?]

**6. Reconhecimento vs Memorização**
[Informações importantes estão visíveis? Labels claros?]

**7. Flexibilidade e Eficiência**
[Interface otimizada? Há atalhos visíveis?]

**8. Estética e Design Minimalista**
[Interface limpa? Hierarquia visual clara? Elementos desnecessários?]

**9. Recuperação de Erros**
[Mensagens de erro, tooltips, ajuda contextual visíveis?]

**10. Ajuda e Documentação**
[Elementos de suporte, placeholders, instruções visíveis?]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚠️ TOP 3 PROBLEMAS VISUAIS**
1. [Problema visual + solução específica]
2. [Problema visual + solução específica]
3. [Problema visual + solução específica]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 SCORES**
Visibilidade: [X]/10 | Correspondência: [X]/10 | Controle: [X]/10
Consistência: [X]/10 | Prevenção: [X]/10 | Reconhecimento: [X]/10
Flexibilidade: [X]/10 | Minimalismo: [X]/10 | Recuperação: [X]/10
Ajuda: [X]/10

**SCORE GERAL: [X]/10**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💬 CONCLUSÃO**
[2 parágrafos: estado atual + próximos passos motivadores]

SEJA ESPECÍFICO sobre o que você VÊ na imagem. Cite cores, tamanhos, posições.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: designInfo.image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        })
      }
    );

    console.log('Status da resposta Gemini:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Gemini (status ${response.status}):`, errorText);
      return res.status(500).json({ 
        error: 'Erro ao chamar Gemini API', 
        status: response.status,
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('Resposta Gemini recebida com sucesso');
    
    if (data.candidates && data.candidates[0]) {
      const finishReason = data.candidates[0].finishReason;
      console.log('Finish Reason:', finishReason);
    }
    
    if (!data.candidates || !data.candidates[0]) {
      console.error('Estrutura de resposta inválida:', data);
      return res.status(500).json({ error: 'Resposta inválida da Gemini' });
    }

    const critique = data.candidates[0].content.parts[0].text;
    res.json({ success: true, critique });

  } catch (error) {
    console.error('Erro completo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remover app.listen para Vercel (serverless)
// O Vercel não usa listen()

export default app;