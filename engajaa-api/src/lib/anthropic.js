const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateSuggestions(profileContext) {
  const prompt = `Você é um especialista em crescimento no Instagram. Com base nos dados do perfil abaixo, gere 6 sugestões estratégicas de conteúdo.

DADOS DO PERFIL:
${JSON.stringify(profileContext, null, 2)}

Retorne SOMENTE um JSON válido com o seguinte formato (sem markdown, sem texto extra):
{
  "suggestions": [
    {
      "type": "Reels|Carrossel|Feed|Stories",
      "title": "Título curto e direto",
      "insight": "Explicação de 1-2 frases baseada nos dados reais do perfil",
      "tag": "Alto Impacto|Engajamento|Conversão|Audiência",
      "icon": "🎯|📈|💡|🔥|⭐|🎬"
    }
  ]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  return JSON.parse(text);
}

module.exports = { generateSuggestions };
