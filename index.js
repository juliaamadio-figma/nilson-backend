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

    const prompt = `Você é Nilson, um design critic experiente. Analise este design seguindo EXATAMENTE a estrutura abaixo.

${designDescription}

Analise usando princípios de UX/UI (Gestalt, WCAG, Lei de Fitts, escalas tipográficas, 8pt grid).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🎯 PRIMEIRA IMPRESSÃO**

(Escreva 2-3 frases sobre a impressão geral do design)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🔍 ANÁLISE DETALHADA**

**Hierarquia Visual**
- [Analise a progressão de tamanhos de fonte]
- [Avalie o contraste entre títulos e corpo]
- [Comente sobre princípios de Gestalt aplicados]

**Tipografia**
- [Verifique legibilidade - mínimo 16px para corpo]
- [Analise a escala tipográfica]
- [Comente sobre line-height e weights]

**Cores & Contraste**
- [Avalie contraste (WCAG AA: 4.5:1)]
- [Analise a paleta de cores]
- [Comente sobre uso estratégico de cores]

**Espaçamento & Layout**
- [Avalie o respiro visual]
- [Verifique uso de grid (8pt)]
- [Comente sobre white space]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚠️ PROBLEMAS IDENTIFICADOS**

1. [Problema específico com dados concretos] → Por quê é um problema e impacto
2. [Problema específico com dados concretos] → Por quê é um problema e impacto
3. [Problema específico com dados concretos] → Por quê é um problema e impacto
4. [Se houver] 
5. [Se houver]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**✅ RECOMENDAÇÕES PRÁTICAS**

1. [Solução específica com valores] - Como implementar
2. [Solução específica com valores] - Como implementar
3. [Solução específica com valores] - Como implementar
4. [Se houver]
5. [Se houver]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🚀 QUICK WINS** (Mudanças de alto impacto)

1. [Ação imediata e específica]
2. [Ação imediata e específica]
3. [Ação imediata e específica]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💬 COMENTÁRIO FINAL**

[Um parágrafo motivador e sincero, pode usar humor leve]

IMPORTANTE: 
- Preencha TODAS as seções acima
- Use dados concretos do design fornecido
- Seja específico com valores e medidas
- Complete toda a análise, não pare no meio`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
