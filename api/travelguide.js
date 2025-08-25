
// /api/travelguide.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY missing on server" });

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Body must include { messages: [...] }" });
    }

    const systemPrompt =
      "Du bist ein freundlicher, präziser Travelguide für Roadtrips. " +
      "Sprich knapp, nenne konkrete Orte, Zeiten, Kostenordnungen und Sicherheitsaspekte. " +
      "Wenn Informationen fehlen, frage nach.";

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [{ role: "system", content: systemPrompt }, ...messages]
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: "OpenAI error", details: text });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
