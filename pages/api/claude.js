export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Your API key (corrected - removed extra dash)
  const apiKey = "sk-ant-api03-HkbWZaOvsVfvWvzSh2bBGmeAVQpiaT8mLOOnMSkjL6a1D0XnRVMYie2GHj8R1E2ar5a3yLBekHvU9KyakfJ9w-OwLQEQAA";

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
        "content-type": "application/json",
        "anthropic-beta": "messages-2023-12-15"
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages
      }),
    });

    // Log the response for debugging
    console.log("Anthropic Response Status:", anthropicResponse.status);
    
    const data = await anthropicResponse.json();
    console.log("Anthropic Response Data:", data);
    
    if (!anthropicResponse.ok) {
      return res.status(anthropicResponse.status).json({ 
        error: "Anthropic API Error", 
        details: data,
        status: anthropicResponse.status
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error calling Anthropic:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
}
