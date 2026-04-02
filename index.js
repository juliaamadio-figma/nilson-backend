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

    const prompt = `Você é Nilson, um especialista em Usabilidade e UX que avalia interfaces usando as 10 Heurísticas de Nielsen.

${designDescription}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AS 10 HEURÍSTICAS DE NIELSEN:

1. Visibilidade do status do sistema
2. Correspondência entre o sistema e o mundo real
3. Controle e liberdade do usuário
4. Consistência e padrões
5. Prevenção de erros
6. Reconhecimento em vez de memorização
7. Flexibilidade e eficiência de uso
8. Estética e design minimalista
9. Ajudar usuários a reconhecer, diagnosticar e recuperar erros
10. Ajuda e documentação

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANTE:
- Analise o design APENAS sob a perspectiva das heurísticas de Nielsen
- NÃO liste dados brutos (RGB, tamanhos de fonte completos)
- Escreva em TEXTO CORRIDO (parágrafos fluidos e naturais)
- Seja CRÍTICO mas construtivo
- Mencione QUAL heurística está sendo violada ou bem aplicada
- Dê exemplos concretos do que você observa
- Sugira melhorias específicas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analise seguindo esta estrutura:

**🎯 VISÃO GERAL**

[Escreva 2-3 frases introdutórias sobre o design analisado e como as heurísticas de Nielsen serão aplicadas]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📋 AVALIAÇÃO HEURÍSTICA**

**Heurística 1: Visibilidade do Status do Sistema**
[Analise se o design comunica claramente o que está acontecendo. Há feedbacks visuais? Estados (hover, active, disabled) estão representados? O usuário sabe onde está? Seja específico sobre o que você vê nos dados.]

**Heurística 2: Correspondência entre Sistema e Mundo Real**
[A linguagem é familiar? Ícones e labels fazem sentido? Metáforas visuais são claras? Analise textos e elementos visuais.]

**Heurística 3: Controle e Liberdade do Usuário**
[Há botões de cancelar, voltar ou desfazer? O design permite que o usuário corrija erros facilmente? Comente sobre a navegação e interações possíveis.]

**Heurística 4: Consistência e Padrões**
[A tipografia é consistente? Cores seguem um padrão? Espaçamentos são uniformes? Elementos similares se parecem? Aponte inconsistências específicas que você observa.]

**Heurística 5: Prevenção de Erros**
[O design previne erros? Há confirmações? Validações? States desabilitados para ações impossíveis? Comente sobre possíveis pontos de erro.]

**Heurística 6: Reconhecimento em vez de Memorização**
[Informações importantes estão visíveis? O usuário precisa lembrar de algo de outra tela? Labels e instruções são claras?]

**Heurística 7: Flexibilidade e Eficiência de Uso**
[O design atende iniciantes e experts? Há atalhos? A interface é eficiente? Pode ser otimizada?]

**Heurística 8: Estética e Design Minimalista**
[Há elementos desnecessários? A interface é limpa? Informação está organizada por relevância? Comente sobre hierarquia visual e poluição.]

**Heurística 9: Ajuda para Reconhecer e Recuperar Erros**
[Mensagens de erro são claras? Há tooltips? Instruções? Como o design ajuda quando algo dá errado?]

**Heurística 10: Ajuda e Documentação**
[Há elementos de ajuda? Tooltips? Placeholders informativos? O design é autoexplicativo?]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚠️ PRINCIPAIS VIOLAÇÕES**

[Escreva 2-3 parágrafos em texto corrido sobre as violações mais críticas que você identificou. Para cada uma, mencione: qual heurística está sendo violada, por que isso é problemático, e como corrigir. Seja específico e use exemplos do design.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**✅ PONTOS POSITIVOS**

[Escreva um parágrafo sobre o que está funcionando bem em relação às heurísticas. Seja honesto - se não houver pontos fortes, diga isso de forma construtiva.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🚀 RECOMENDAÇÕES PRIORITÁRIAS**

[Escreva 2-3 parágrafos com as ações mais importantes que devem ser tomadas. Organize por impacto (alto para baixo). Para cada recomendação, explique qual heurística será melhorada e como implementar.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 SCORE HEURÍSTICO**

Visibilidade do Status: [X]/10
Correspondência com Mundo Real: [X]/10
Controle e Liberdade: [X]/10
Consistência: [X]/10
Prevenção de Erros: [X]/10
Reconhecimento: [X]/10
Flexibilidade: [X]/10
Minimalismo: [X]/10
Recuperação de Erros: [X]/10
Ajuda e Documentação: [X]/10

**SCORE GERAL DE USABILIDADE: [X]/10**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💬 PARECER FINAL**

[Escreva 2-3 parágrafos com uma conclusão geral sobre a usabilidade do design. Seja honesto sobre o nível de maturidade em termos de heurísticas de Nielsen. Termine de forma motivadora, indicando os próximos passos e o impacto que as melhorias terão na experiência do usuário.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LEMBRE-SE:
- Escreva em TEXTO CORRIDO (parágrafos naturais, não listas de bullets)
- NÃO repita dados técnicos (RGB, todos os tamanhos)
- FOQUE em insights de usabilidade
- CITE as heurísticas pelo nome ao analisar
- Seja ESPECÍFICO sobre o que você observa
- Mantenha tom profissional mas acessível`;

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
