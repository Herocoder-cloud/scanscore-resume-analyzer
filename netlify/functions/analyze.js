// Netlify serverless function: calls the Groq API (free tier) to analyze a resume.
// No SDK required — uses the built-in fetch available in Netlify's Node runtime.
// Groq uses an OpenAI-compatible chat completions format.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GROQ_API_KEY is not set in Netlify environment variables.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { resumeText, targetRole } = payload;
  if (!resumeText || resumeText.length < 30) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Resume text is too short' }) };
  }

  const systemPrompt = `You are an ATS (Applicant Tracking System) simulator and resume reviewer. You analyze resumes the way an automated screening system plus a strict recruiter would. You respond ONLY with valid JSON, no markdown formatting, no code fences, no preamble, no explanation before or after. The JSON must match this exact shape:
{
  "score": <integer 0-100>,
  "sections": [
    { "name": "Contact Info", "status": "strong" | "ok" | "weak", "note": "<one sentence, specific>" },
    { "name": "Skills", "status": "strong" | "ok" | "weak", "note": "<one sentence>" },
    { "name": "Experience", "status": "strong" | "ok" | "weak", "note": "<one sentence>" },
    { "name": "Formatting", "status": "strong" | "ok" | "weak", "note": "<one sentence>" },
    { "name": "Keyword Match", "status": "strong" | "ok" | "weak", "note": "<one sentence>" }
  ],
  "quickFixes": ["<specific actionable fix>", "<specific actionable fix>", "<specific actionable fix>"]
}
Be specific and reference actual content from the resume, not generic advice. Score honestly — most first-draft resumes score 50-75.`;

  const userPrompt = `Target role: ${targetRole || 'General'}\n\nResume text:\n"""\n${resumeText}\n"""`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: 502, body: JSON.stringify({ error: `Groq API error: ${errText}` }) };
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      statusCode: 200,
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
