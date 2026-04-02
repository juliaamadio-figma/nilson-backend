import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

app.get('/list-models', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key não configurada' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }

    const data = await response.json();
    
    const generateModels = data.models?.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );

    res.json({ 
      total: generateModels?.length || 0,
      models: generateModels?.map(m => m.name) || []
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

    if (!designInfo) {
      return res.status(400).json({ error: 'designInfo obrigatório' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key não configurada' });
    }

    let designDescription = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO DESIGN: "${designInfo.name}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📐 DIMENSÕES: ${designInfo.width}x${designInfo.height}px

🎨 BACKGROUND: ${designInfo.backgroundColor ? 
  `RGB(${designInfo.backgroundColor.r}, ${designInfo.backgroundColor.g}, ${designInfo.backgroundColor.b})` : 
  'Sem fundo definido'}

⚙️ AUTO LAYOUT: ${designInfo.autoLayout ? 
  `SIM - ${designInfo.layoutDetails.mode} | Spacing: ${designInfo.layoutDetails.spacing}px | Padding: ${designInfo.layoutDetails.padding.top}/${designInfo.layoutDetails.padding.right}/${designInfo.layoutDetails.padding.bottom}/${designInfo.layoutDetails.padding.left}px` : 
  'NÃO'}

📊 ELEMENTOS:
- Camadas de texto: ${designInfo.textLayers.length}
- Imagens: ${designInfo.images || 0}
- Formas/shapes: ${designInfo.shapes || 0}
- Cores únicas: ${designInfo.colors ? [...new Set(designInfo.colors.map(c => `${c.r},${c.g},${c.b}`))].length : 0}

✍️ TEXTOS ENCONTRADOS:
`;

    designInfo.textLayers.forEach((text, i) => {
      const lineHeight = text.lineHeight?.value ? ` | Line-height: ${text.lineHeight.value}` : '';
      designDescription += `${i + 1}. "${text.characters}" 
   → ${text.fontSize}px, ${text.fontName?.family || 'Unknown'}, weight ${text.fontWeight || 'normal'}${lineHeight}
`;
    });

    if (designInfo.colors && designInfo.colors.length > 0) {
      const uniqueColors = [...new Set(designInfo.colors.map(c => `RGB(${c.r}, ${c.g}, ${c.b})`))];
      designDescription += `\n🎨 PALETA DE CORES:\n`;
      uniqueColors.slice(0, 10).forEach((color, i) => {
        designDescription += `${i + 1}. ${color}\n`;
      });
    }

    designDescription += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    const prompt = `Você é Nilson, especialista em Usabilidade. Analise este design usando as 10 Heurísticas de Nielsen.

${designDescription}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analise TODAS as 10 heurísticas. Seja CONCISO mas completo.

**🎯 VISÃO GERAL**
[2-3 frases sobre o design]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📋 AVALIAÇÃO DAS 10 HEURÍSTICAS**

**1. Visibilidade do Status do Sistema**
[Parágrafo conciso sobre feedbacks visuais, estados, indicadores. O que você observa nos dados?]

**2. Correspondência com o Mundo Real**
[Parágrafo sobre linguagem, ícones, metáforas. Analise os textos e elementos.]

**3. Controle e Liberdade do Usuário**
[Parágrafo sobre navegação, cancelamento, reversão de ações.]

**4. Consistência e Padrões**
[Parágrafo sobre uniformidade tipográfica, cores, espaçamentos. Seja específico sobre inconsistências.]

**5. Prevenção de Erros**
[Parágrafo sobre validações, confirmações, states desabilitados.]

**6. Reconhecimento vs Memorização**
[Parágrafo sobre visibilidade de informações, clareza de labels.]

**7. Flexibilidade e Eficiência**
[Parágrafo sobre otimização para diferentes níveis de usuário.]

**8. Estética e Minimalismo**
[Parágrafo sobre limpeza visual, elementos desnecessários, hierarquia.]

**9. Recuperação de Erros**
[Parágrafo sobre mensagens de erro, ajuda contextual, tooltips.]

**10. Ajuda e Documentação**
[Parágrafo sobre elementos de suporte, autoexplicação.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚠️ TOP 3 VIOLAÇÕES CRÍTICAS**
[3 parágrafos concisos - uma violação por parágrafo]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🚀 TOP 3 AÇÕES PRIORITÁRIAS**
1. [Ação específica com valores]
2. [Ação específica com valores]
3. [Ação específica com valores]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 SCORES**
Visibilidade: [X]/10
Correspondência: [X]/10
Controle: [X]/10
Consistência: [X]/10
Prevenção: [X]/10
Reconhecimento: [X]/10
Flexibilidade: [X]/10
Minimalismo: [X]/10
Recuperação: [X]/10
Ajuda: [X]/10

**GERAL: [X]/10**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💬 CONCLUSÃO**
[2 parágrafos finais - estado atual e próximos passos]

REGRAS:
- Responda TODAS as 10 heurísticas
- Seja CONCISO (1 parágrafo por heurística)
- Use dados concretos do design
- NÃO repita dados brutos
- Complete a análise até o fim`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
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
    
    // Verificar se a resposta foi cortada
    if (data.candidates && data.candidates[0]) {
      const finishReason = data.candidates[0].finishReason;
      console.log('Finish Reason:', finishReason);
      
      if (finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ ATENÇÃO: Resposta foi cortada por atingir o limite de tokens!');
      }
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

export default app;