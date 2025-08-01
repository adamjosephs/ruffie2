export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Your API key
  const apiKey = "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";

  const { model, max_tokens, messages } = req.body;

  // Validate required fields
  if (!model || !messages || !max_tokens) {
    return res.status(400).json({ error: "Missing required fields: model, messages, max_tokens" });
  }

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages
      }),
    });

    const data = await anthropicResponse.json();
    
    if (!anthropicResponse.ok) {
      return res.status(anthropicResponse.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error calling Anthropic:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
}
