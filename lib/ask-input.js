// Validate before quota reservation or a paid upstream request.
export function parseAskMessages(body) {
  if (typeof body === 'string') {
    if (body.length > 100000) return null;
    try { body = JSON.parse(body); } catch { return null; }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 9) return null;
  const messages = [];
  let total = 0;
  for (const message of body.messages) {
    if (!message || typeof message !== 'object' || Array.isArray(message) || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 14000) return null;
    total += message.content.length;
    if (total > 24000) return null;
    messages.push({ role: message.role, content: message.content });
  }
  if (messages[0].role !== 'user' || !messages[0].content.includes('Linn IT, Mobile & Electronics Mart')) return null;
  return messages;
}
