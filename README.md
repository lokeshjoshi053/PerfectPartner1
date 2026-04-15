# PerfectPartner.AI - Rishta Scanner 🚀

Instagram profile scanner with AI rishta analysis. Works local + Vercel.

## Quick Start (Local)

1. **Install & Run:**
```bash
npm install
cp .env.example .env.local
# Edit .env.local → add SCRAPERAPI_KEY (free: scraperapi.com)
npm run dev
```

2. **Test API:**
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"username": "instagram"}'
```

3. **Frontend:** Open http://localhost:3000/index_1.html

## Vercel Deploy (Production)

1. **Push & Deploy:**
```bash
git add .
git commit -m "Vercel ready"
git push
vercel --prod
```

2. **Add Env Var in Vercel Dashboard:**
   - Project Settings → Environment Variables
   - `SCRAPERAPI_KEY` = your key from scraperapi.com

3. **Custom Domain (optional):**
```
vercel domains add yourdomain.com
```

## Features
- ✅ Instagram public profile scraping (ScraperAPI)
- ✅ Profile pic base64 (no CORS issues)
- ✅ AI analysis (7 metrics: sanskaar → fake-meter)
- ✅ Shareable screenshot cards
- ✅ Serverless ready (Vercel/Netlify)
- ✅ Rate limit retries + UA rotation

## Tech
- Next.js 15 (API routes)
- TailwindCSS + html2canvas
- ScraperAPI (free tier: 5k req/mo)

## Troubleshooting
```
❌ API 500? → Check SCRAPERAPI_KEY in .env.local/Vercel
❌ Rate limited? → Free tier limits or IG blocks
❌ Private profile → Shows error gracefully
```

**Live Demo:** [Update after deploy]

⭐ Star if rishta scanning vibes!  
🍵 Made with chai + serverless magic.

