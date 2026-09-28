import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, userFirstName, userRole } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const grokKey = process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY;

    const nameContext = userFirstName ? ` El usuario se llama ${userFirstName}. Dirígete a él o salúdalo con respeto por su primer nombre.` : '';
    const roleContext = userRole ? ` Su rol en el sistema es "${userRole}".` : '';
    const systemPrompt = `Eres DomunBot, el asistente inteligente oficial de DomunNet (Control de Obras y Supervisión).${nameContext}${roleContext}
REGLAS ESTRICTAS DE RESPUESTA:
- Responde siempre en español, de forma clara, directa, profesional y concisa.
- NUNCA uses emojis de ningún tipo.
- NUNCA uses símbolos de numeral (# o ##) para encabezados ni caracteres especiales decorativos. Usa texto limpio y títulos en mayúsculas o negrita suave si es necesario.
- Puedes usar listas con guiones (-) simples para enumerar puntos.`;

    // 1. Proveedor: Google Gemini (100% GRATIS sin tarjeta en aistudio.google.com)
    if (geminiKey) {
      try {
        const contents = (messages || []).map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return NextResponse.json({ reply, provider: 'Google Gemini (Gratis)' });
        }
      } catch (e) {
        console.warn('Error llamando a Gemini API:', e);
      }
    }

    // 2. Proveedor: DeepSeek Oficial
    if (deepseekKey) {
      try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return NextResponse.json({ reply, provider: 'DeepSeek AI' });
        }
      } catch (e) {
        console.warn('Error llamando a DeepSeek API:', e);
      }
    }

    // 3. Proveedor: OpenRouter (DeepSeek R1 / V3 Gratis)
    if (openrouterKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1:free',
            messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return NextResponse.json({ reply, provider: 'DeepSeek (OpenRouter Gratis)' });
        }
      } catch (e) {
        console.warn('Error llamando a OpenRouter API:', e);
      }
    }

    // 4. Proveedor: Groq Cloud (Ultra rápido)
    if (groqKey) {
      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
      for (const model of groqModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])]
            })
          });

          if (res.ok) {
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) return NextResponse.json({ reply, provider: 'Groq Cloud' });
          }
        } catch (e) {
          console.warn(`Error llamando a Groq API con modelo ${model}:`, e);
        }
      }
    }

    // 5. Proveedor: xAI Grok (Requiere pago $5 min)
    if (grokKey) {
      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokKey}`
          },
          body: JSON.stringify({
            model: 'grok-2-latest',
            messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return NextResponse.json({ reply, provider: 'xAI Grok' });
        }
      } catch (e) {
        console.warn('Error llamando a Grok API:', e);
      }
    }

    // Ninguna API Key configurada
    return NextResponse.json({
      error: 'NO_API_KEY',
      reply: '⚠️ **Ninguna API Key configurada.**\n\nPuedes agregar una clave gratuita sin tarjeta en tu `.env.local`:\n- `GEMINI_API_KEY` (Google Gemini 100% Gratis)\n- `DEEPSEEK_API_KEY` (DeepSeek Oficial)\n- `GROQ_API_KEY` (Groq Cloud Gratis)\n- `OPENROUTER_API_KEY` (OpenRouter Gratis)'
    });
  } catch (error: any) {
    console.error('Error interno en /api/chat:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', reply: '❌ Error interno del servidor de chat.' }, { status: 500 });
  }
}
