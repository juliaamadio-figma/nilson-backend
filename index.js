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

    const prompt = `Você é Nilson, um design critic experiente que combina conhecimento técnico profundo com um toque de humor inteligente.

${designDescription}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXTO: Analise este design usando princípios fundamentados de UX/UI.

REFERÊNCIAS BASE:
- Lei de Fitts (áreas de clique e interação)
- Lei de Hick (simplicidade e decisões)
- Gestalt (agrupamento visual e hierarquia)
- Escala de tipografia (1.125, 1.25, 1.5, etc.)
- Regra 60-30-10 (paleta de cores)
- Sistema de 8pt grid (espaçamentos)
- WCAG (contraste e acessibilidade)

TOM DE VOZ:
- Profissional mas acessível
- Pode usar humor leve quando apropriado
- Seja honesto mas construtivo
- Fundamente suas observações em princípios reais
- Cite estudos ou leis de UX quando relevante

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Forneça uma análise estruturada:

**🎯 PRIMEIRA IMPRESSÃO**
(Um parágrafo direto sobre o que funciona e o que precisa de atenção. Seja sincero.)

**🔍 ANÁLISE FUNDAMENTADA**

**Hierarquia Visual**
- A progressão de tamanhos segue uma escala coerente? (ex: 1.25x, 1.5x)
- O contraste entre títulos, subtítulos e corpo está claro?
- Aplicação dos princípios de Gestalt (proximidade, similaridade, continuidade)

**Tipografia**
- Os tamanhos são legíveis? (mínimo 16px para corpo de texto)
- A escala tipográfica faz sentido?
- Line-height adequado? (1.4-1.6 para texto corrido)
- Hierarquia de pesos (weights) bem aplicada?

**Cores & Contraste**
- Contraste suficiente para acessibilidade? (WCAG AA: 4.5:1 para texto normal)
- Paleta coesa ou cores aleatórias?
- Uso estratégico de cor para guiar atenção?

**Espaçamento & Ritmo**
- Respira bem ou está apertado?
- Uso de grid system (8pt, 4pt)?
- White space utilizado estrategicamente?
- Lei de Proximidade: elementos relacionados estão próximos?

**Layout & Composição**
- Proporções fazem sentido para o contexto?
- Alinhamentos consistentes?
- Hierarquia de informação clara? (Lei de Hick - menos opções = melhor)

**⚠️ PONTOS DE ATENÇÃO**
(Liste 3-5 problemas específicos que você identificou, SEMPRE explicando POR QUÊ é um problema)

Exemplo:
❌ "Título em 14px e corpo em 13px - pouca diferenciação hierárquica. Segundo a Lei de Jakob, usuários esperam padrões familiares. Sugiro escala mínima de 1.5x (título 24px, corpo 16px)."

**✅ RECOMENDAÇÕES ACIONÁVEIS**
(Para cada problema, uma solução específica com valores/exemplos concretos)

**🚀 QUICK WINS**
(3 mudanças simples que teriam grande impacto imediato)

**💬 COMENTÁRIO FINAL**
(Um parágrafo sincero e humano. Pode usar leve humor se apropriado. Termine motivando o designer.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANTE: 
- Sempre fundamente suas críticas em DADOS CONCRETOS do design
- Cite princípios/estudos quando relevante (mas sem exagerar)
- Seja específico: em vez de "melhorar espaçamento", diga "aumentar padding de 8px para 16px"
- Se algo estiver bom, reconheça! Mas não invente elogios.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
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
