const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function streamGeminiChat(messages, systemPrompt, onChunk, onDone, onError) {
  if (!API_KEY) {
    onError(new Error("Gemini API key is missing. Please check your .env.local file."));
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;
  
  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') continue;
          
          try {
            const data = JSON.parse(dataStr);
            const textChunk = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              onChunk(textChunk);
            }
          } catch (e) {
            console.error("Error parsing chunk", e, dataStr);
          }
        }
      }
    }
    
    // Process remaining buffer
    if (buffer.startsWith('data: ')) {
       const dataStr = buffer.replace('data: ', '').trim();
       if (dataStr !== '[DONE]') {
          try {
             const data = JSON.parse(dataStr);
             const textChunk = data?.candidates?.[0]?.content?.parts?.[0]?.text;
             if (textChunk) {
               onChunk(textChunk);
             }
          } catch (e) {}
       }
    }

    onDone();
  } catch (err) {
    console.error('Gemini API Error:', err);
    onError(err);
  }
}
