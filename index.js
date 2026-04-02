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

    const prompt = `Você é Nilson, um UX/UI Design Auditor EXIGENTE. Sua missão é fazer uma AUDITORIA TÉCNICA completa.

${designDescription}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUÇÕES CRÍTICAS:

1. ANALISE OS DADOS REAIS fornecidos acima - não invente informações
2. COMPARE com padrões da indústria (Material Design, iOS HIG, WCAG)
3. DÊ NÚMEROS ESPECÍFICOS - não use "pode melhorar", diga "aumentar de X para Y"
4. SEJA CRÍTICO - aponte todos os problemas reais que você identifica
5. FUNDAMENTE tudo em princípios de UX/UI (cite quando relevante)

PADRÕES DE REFERÊNCIA:
- Escala tipográfica recomendada: 1.25 (Minor Third) ou 1.5 (Perfect Fifth)
- Corpo de texto web: mínimo 16px
- Corpo de texto mobile: mínimo 14px
- Line-height ideal: 1.5 para corpo, 1.2 para títulos
- Contraste WCAG AA: 4.5:1 (texto normal), 3:1 (texto grande)
- Grid system: múltiplos de 4px ou 8px
- Espaçamento: escala consistente (8, 16, 24, 32, 48, 64px)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AGORA ANALISE SEGUINDO EXATAMENTE ESTA ESTRUTURA:

**🎯 AUDITORIA TÉCNICA - "${designInfo.name}"**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 ANÁLISE DE DADOS REAIS**

**Hierarquia Tipográfica**
DADOS: [Liste TODOS os tamanhos de fonte encontrados nos dados]
ANÁLISE:
- Qual é a escala sendo usada? (calcule a proporção entre os tamanhos)
- É uma escala reconhecida? (1.125, 1.25, 1.333, 1.5, 1.618?)
- Há saltos suficientes entre níveis hierárquicos?

VEREDITO: [Específico - exemplo: "Escala irregular: 24px → 18px (1.33x) mas 18px → 16px (apenas 1.12x). Recomendo escala uniforme."]

**Legibilidade**
DADOS: [Liste tamanhos de texto do corpo vs títulos]
ANÁLISE:
- Textos de corpo estão >= 16px? (padrão web) ou >= 14px (mobile)?
- Line-height está entre 1.4-1.6?
- Weights criam contraste suficiente?

VEREDITO: [Específico com números]

**Paleta de Cores**
DADOS: [Liste as cores RGB encontradas]
ANÁLISE:
- Quantas cores únicas? (ideal: 3-5 cores principais)
- Há uma hierarquia clara? (primária, secundária, neutros)
- Segue regra 60-30-10?

VEREDITO: [Específico - cite as cores problemáticas]

**Espaçamento & Grid**
DADOS: [Analise padding/spacing se houver Auto Layout]
ANÁLISE:
- Os valores seguem múltiplos de 4 ou 8?
- Há consistência nos espaçamentos?
- Respiro visual adequado?

VEREDITO: [Específico com valores]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS**

[Para CADA problema, use este formato:]

**Problema #1: [Nome do problema]**
📍 EVIDÊNCIA: [Cite dados concretos do design]
⚠️ IMPACTO: [Por que isso prejudica UX/UI]
📚 FUNDAMENTO: [Cite princípio/estudo relevante]
✅ SOLUÇÃO: [Ação específica com valores - "Mudar de X para Y"]

**Problema #2: [Nome do problema]**
📍 EVIDÊNCIA: 
⚠️ IMPACTO: 
📚 FUNDAMENTO: 
✅ SOLUÇÃO: 

**Problema #3: [Nome do problema]**
📍 EVIDÊNCIA: 
⚠️ IMPACTO: 
📚 FUNDAMENTO: 
✅ SOLUÇÃO: 

[Continue até listar TODOS os problemas - mínimo 3, máximo 8]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💡 RECOMENDAÇÕES ESPECÍFICAS**

**Tipografia**
→ [Ação concreta com valores] Exemplo: "Aumentar título de 18px para 24px (escala 1.5x)"
→ [Ação concreta com valores]
→ [Ação concreta com valores]

**Cores**
→ [Ação concreta com valores RGB/HEX]
→ [Ação concreta com valores RGB/HEX]

**Espaçamento**
→ [Ação concreta] Exemplo: "Padronizar spacing para múltiplos de 8px: usar 16px em vez de 14px"
→ [Ação concreta]

**Layout**
→ [Ação concreta com medidas]
→ [Ação concreta com medidas]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🚀 AÇÕES PRIORITÁRIAS (Quick Wins)**

1. **[Nome da ação]** - [Valor atual] → [Valor recomendado] | Impacto: [Alto/Médio/Baixo]
2. **[Nome da ação]** - [Valor atual] → [Valor recomendado] | Impacto: [Alto/Médio/Baixo]
3. **[Nome da ação]** - [Valor atual] → [Valor recomendado] | Impacto: [Alto/Médio/Baixo]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📈 SCORE DE QUALIDADE**

- Hierarquia Visual: [X]/10 - [Justificativa baseada nos dados]
- Tipografia: [X]/10 - [Justificativa baseada nos dados]
- Cores: [X]/10 - [Justificativa baseada nos dados]
- Espaçamento: [X]/10 - [Justificativa baseada nos dados]
- Acessibilidade: [X]/10 - [Justificativa baseada nos dados]

**SCORE GERAL: [X]/10**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💬 PARECER FINAL**

[2-3 parágrafos sinceros e diretos sobre o estado geral do design. Seja honesto sobre o que precisa melhorar, mas termine de forma construtiva. Pode usar humor leve, mas mantenha profissionalismo.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRAS OBRIGATÓRIAS:
✓ Use APENAS dados fornecidos - não invente
✓ Dê números específicos em TODAS as recomendações
✓ Compare com padrões da indústria
✓ Seja crítico mas construtivo
✓ Preencha TODAS as seções acima
✓ Não diga "pode estar ok" - seja específico sobre o que VÊ nos dados`;

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