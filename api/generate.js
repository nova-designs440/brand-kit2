
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, industry, desc, vibe } = req.body || {};
  if (!name || !industry || !desc) return res.status(400).json({ error: 'Missing fields' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured on server' });

  const prompt = `You are a professional brand identity designer. Create a complete brand kit.

Business name: ${name}
Industry: ${industry}
Description: ${desc}
Brand vibe: ${vibe || 'Modern & Professional'}

Reply with ONLY a raw JSON object. No markdown, no backticks, nothing else:
{
  "logoInitials": "2-3 character monogram",
  "logoTagline": "3-5 word brand statement",
  "logoBg": "#hexcolor",
  "logoFg": "#hexcolor",
  "palette": [
    {"name": "Primary", "hex": "#hexcolor"},
    {"name": "Secondary", "hex": "#hexcolor"},
    {"name": "Accent", "hex": "#hexcolor"},
    {"name": "Light", "hex": "#hexcolor"},
    {"name": "Dark", "hex": "#hexcolor"}
  ],
  "fonts": {
    "display": {"name": "Font name", "use": "Headlines and logos", "sample": "Aa Bb Cc 123"},
    "body": {"name": "Font name", "use": "Body text and UI", "sample": "Clean and readable text"}
  },
  "taglines": ["Tagline one", "Tagline two", "Tagline three"],
  "brandVoice": "2-3 sentence brand personality description.",
  "personality": ["word1", "word2", "word3", "word4", "word5"]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data.error));

    const raw = (data.content || []).find(b => b.type === 'text')?.text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Unexpected response format');

    const kit = JSON.parse(match[0]);
    return res.status(200).json(kit);

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Generation failed' });
  }
}



