export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // You'll need to get an OpenAI API key from https://platform.openai.com/api-keys
  const apiKey = "YOUR_OPENAI_API_KEY_HERE";

  const { messages, max_tokens = 1500 } = req.body;

  // Validate required fields
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing required field: messages (array)" });
  }

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast, affordable, and very capable
        max_tokens: max_tokens,
        messages: messages,
        temperature: 0.7
      }),
    });

    console.log("OpenAI Response Status:", openaiResponse.status);
    
    const data = await openaiResponse.json();
    
    if (!openaiResponse.ok) {
      console.error("OpenAI API Error:", data);
      return res.status(openaiResponse.status).json({ 
        error: "OpenAI API Error", 
        details: data,
        status: openaiResponse.status
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
}
