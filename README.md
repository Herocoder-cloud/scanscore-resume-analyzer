# ScanScore — AI Resume Analyzer

Paste a resume, pick a target role, and get an ATS-style scorecard: an overall
compatibility score, section-by-section feedback (Contact Info, Skills,
Experience, Formatting, Keyword Match), and a short list of quick fixes.

**Live demo:** _add your Netlify URL here after deploying_

## Why this project

Most resumes are filtered by automated screening before a human ever reads
them. This tool simulates that first pass so a candidate can fix the obvious
gaps before applying. Built to also double as a real tool for freelance
resume-optimization clients.

## Tech stack

- **Frontend:** vanilla HTML/CSS/JS — no framework, no build step, loads instantly
- **Backend:** Netlify serverless function (`netlify/functions/analyze.js`)
- **AI:** Groq API (`llama-3.3-70b-versatile`), free tier, called directly via `fetch`, no SDK dependency
- **Hosting:** Netlify (static site + functions in one deploy)

## How it works

1. User pastes resume text and picks a target role in the browser.
2. The frontend calls `/.netlify/functions/analyze` — a serverless function,
   so the API key never touches the browser.
3. The function sends the resume to Groq (Llama 3.3 70B) with a strict
   JSON-only system prompt, parses the response, and returns a scorecard.
4. The frontend animates a scan-line and renders the score ring + section
   breakdown.

## Getting a free Groq API key

1. Go to [console.groq.com](https://console.groq.com) and sign up (free, no
   credit card required).
2. Go to **API Keys** → **Create API Key**, give it a name, copy the key.
3. Groq's free tier has generous rate limits — enough for portfolio demos
   and normal testing without paying anything.

## Deploying this yourself

1. Push this folder to a new GitHub repository.
2. Go to [Netlify](https://app.netlify.com) → **Add new site** → **Import an
   existing project** → connect the repo.
3. Build settings: leave build command empty, publish directory `.`
   (already set in `netlify.toml`).
4. In Netlify: **Site settings → Environment variables** → add
   `GROQ_API_KEY` with your key from console.groq.com.
5. Deploy. Netlify auto-detects the function in `netlify/functions/`.

## Local testing

Netlify functions need the Netlify CLI to run locally (plain `python -m
http.server` won't execute the function):

```bash
npm install -g netlify-cli
netlify dev
```

This serves the site and runs the function locally at the same time. Create
a `.env` file in the project root with:

```
GROQ_API_KEY=your_key_here
```

## Possible extensions

- PDF upload with client-side text extraction instead of paste-only
- Compare two resume versions side by side
- Export the scorecard as a PDF
- Save scan history (would need a database — Supabase/Firebase)
