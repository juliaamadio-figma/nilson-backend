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

    const prompt = `Você é Nilson, um expert em UX/UI design. Analise este design e forneça uma critique profissional e detalhada.

${designDescription}

Forneça uma análise completa avaliando:

**1. HIERARQUIA VISUAL E TIPOGRAFIA**
- A hierarquia de tamanhos de fonte está adequada?
- Os textos estão em tamanhos legíveis?

**2. CORES E CONSISTÊNCIA**
- A paleta parece consistente?
- Sugestões de melhoria

**3. ESPAÇAMENTO E LAYOUT**
- As dimensões são adequadas?
- Sugestões de espaçamento

**4. DESIGN SYSTEM**
- Padrões que poderiam ser aplicados

**5. SUGESTÕES PRÁTICAS**
- Liste 3-5 ações específicas para melhorar

Seja específico, construtivo e acionável.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Gemini:', errorText);
      return res.status(500).json({ error: 'Erro ao chamar Gemini API' });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ error: 'Resposta inválida da Gemini' });
    }

    const critique = data.candidates[0].content.parts[0].text;
    res.json({ success: true, critique });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

export default app;