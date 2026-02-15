# 🌟 Google Gemini Setup Guide

## Step 1: Get Your FREE Gemini API Key

### 1. Visit Google AI Studio

Go to: <https://aistudio.google.com/app/apikey>

### 2. Sign In

- Use your Google account
- Accept terms of service

### 3. Create API Key

- Click **"Get API Key"**
- Click **"Create API key in new project"** (or use existing)
- Copy the API key (starts with `AIza...`)

**✅ That's it! Completely FREE!**

---

## Step 2: Add API Key to Your Project

### Update `.env.local` file

```env
# Remove or comment out OpenAI key
# VITE_OPENAI_API_KEY=sk-...

# Add Gemini API key
VITE_GEMINI_API_KEY=AIzaSy...your_key_here
```

### Update Supabase Edge Function env

```bash
# In Supabase dashboard > Edge Functions > Secrets
# Add:
GEMINI_API_KEY=AIzaSy...your_key_here
```

---

## Step 3: Test the Integration

### Run your dev server

```bash
npm run dev
```

### Test AI Chat

1. Go to Dashboard
2. Open AI Chatbot
3. Ask: "What data do I have?"
4. ✅ Should get response from Gemini!

---

## What Changed?

### Before (OpenAI)

- ❌ Paid ($0.00015 per 1K tokens)
- ✅ Good quality
- ✅ 128K context window

### After (Gemini)

- ✅ **100% FREE!**
- ✅ **Better quality** (Gemini 1.5 Flash)
- ✅ **1M context window** (8x larger!)
- ✅ 60 requests/minute
- ✅ Multimodal capable

---

## Gemini Free Tier Limits

**Requests:** 60 per minute  
**Context:** 1 million tokens  
**Cost:** $0.00 (FREE!)  
**Quality:** Excellent  

**Perfect for your use case!** 🎉

---

## Files Updated

✅ `src/hooks/useAIConversation.ts` - Using Gemini API  
✅ `supabase/functions/rag-query/index.ts` - Using Gemini  
✅ Environment variables - VITE_GEMINI_API_KEY  

---

## Migration Complete Checklist

- [ ] Get Gemini API key from <https://aistudio.google.com/app/apikey>
- [ ] Add `VITE_GEMINI_API_KEY` to `.env.local`
- [ ] Add `GEMINI_API_KEY` to Supabase Edge Functions secrets
- [ ] Restart dev server (`npm run dev`)
- [ ] Test AI chatbot
- [ ] Deploy to production

---

## Benefits of Gemini

### 1. **FREE Forever**

- No credit card required
- Generous rate limits
- Production-ready

### 2. **Faster Development**

- No cost concerns
- Experiment freely
- Unlimited testing

### 3. **Better Features**

- 1M token context (huge!)
- Multimodal (images, video, audio)
- Latest Google AI tech

### 4. **Simple Migration**

- Same functionality
- Better performance
- Zero cost

---

## Troubleshooting

### "API key not valid"

- Check key starts with `AIzaSy`
- Ensure no extra spaces
- Verify key is enabled in Google AI Studio

### "Quota exceeded"

- Wait 1 minute (60 req/min limit)
- Consider batching requests
- Still completely free!

### "Model not found"

- Using `gemini-1.5-flash` (default)
- Can upgrade to `gemini-1.5-pro` if needed
- Both are FREE!

---

## Next Steps

Once API key is set:

1. **Test locally** - Verify chatbot works
2. **Deploy** - Push to production
3. **Enjoy** - Free AI forever! 🎉

**No more AI costs!** ✨

---

## Support

**Gemini Docs:** <https://ai.google.dev/docs>  
**API Reference:** <https://ai.google.dev/api>  
**Pricing:** <https://ai.google.dev/pricing> (FREE tier!)

**Questions?** Check the docs or ask me! 😊
