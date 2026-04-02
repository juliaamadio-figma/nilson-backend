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

    let designDescription = `ANÁLISE DE DESIGN - Frame: "${designInfo.name}"

DIMENSÕES: ${designInfo.width}x${designInfo.height}px
TEXTOS: ${designInfo.textLayers.length} camadas

TEXTOS ENCONTRADOS:
`;

    designInfo.textLayers.forEach((text, i) => {
      designDescription += `${i + 1}. "${text.characters}" - ${text.fontSize}px (${text.fontName?.family || 'Unknown'})\n`;
    });

    const prompt = `Você é Nilson, um especialista em UX/UI design que oferece feedback construtivo e profissional.

${designDescription}

Sua missão é ajudar designers a melhorarem seus trabalhos através de observações práticas e acionáveis.

ESTILO DE COMUNICAÇÃO:
- Seja honesto e direto, mas sempre respeitoso
- Aponte problemas de forma construtiva
- Ofereça soluções práticas para cada ponto levantado
- Use tom profissional e amigável
- Foque em melhorias, não em críticas destrutivas

Analise este design e forneça feedback estruturado:

**🔍 OBSERVAÇÕES PRINCIPAIS**
Identifique 3-5 pontos que podem ser melhorados neste design (hierarquia, espaçamento, tipografia, cores, consistência)

**💡 OPORTUNIDADES DE MELHORIA**
- O que pode tornar a experiência mais clara para o usuário?
- Quais ajustes melhorariam a hierarquia visual?
- Onde podemos aplicar melhores práticas de UX/UI?

**✅ RECOMENDAÇÕES PRÁTICAS**
Para cada observação, sugira uma solução específica e implementável.

**📊 ANÁLISE TÉCNICA**
- **Tipografia**: Avalie a escala tipográfica, contraste entre títulos e textos, legibilidade
- **Espaçamento**: Verifique consistência, respiro visual, alinhamentos
- **Layout**: Analise se as dimensões e proporções fazem sentido para o contexto

**🎯 PRÓXIMOS PASSOS**
Liste 3-5 ações prioritárias que trarão maior impacto visual e funcional ao design.

Seja específico, técnico e sempre ofereça uma alternativa melhor quando apontar um problema.`;

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
