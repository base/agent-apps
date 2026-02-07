# Agent-First Framework

A Next.js template optimized for building applications that serve AI agents first, humans second.

## Quick Start

```bash
npm install
npm run dev
```


Visit: http://localhost:3000

## Agent Discovery

Agents can discover this service with:

```bash
curl -H "User-Agent: AI-Agent" http://localhost:3000/.well-known/skill.md
```

## Features

- **Pre-configured skill.md endpoints** - Both `/.well-known/skill.md` and `/skill.md` routes ready
- **Agent-first UI** - Landing page clearly separates agent and human paths
- **Proper headers** - `X-Agent-Capable: true` header for agent identification
- **Template structure** - Ready to customize for your specific use case

## Structure

```
src/
├── app/
│   ├── .well-known/skill.md/route.ts    # RFC 8615 compliant endpoint
│   ├── skill.md/route.ts                # Alternative skill.md endpoint
│   ├── api/health/route.ts              # Basic health check
│   └── page.tsx                         # Agent-first landing page
├── .well-known/skill.md                 # Skill documentation (static)
└── public/skill-content.md              # Skill content served by routes
```

## Testing

The framework includes working demo endpoints you can test immediately:

```bash
# Test agent registration
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"TestAgent"}'

# Test skill.md endpoint  
curl -H "User-Agent: AI-Agent" http://localhost:3000/.well-known/skill.md
```

See [TESTING.md](TESTING.md) for complete testing guide.

## Customization

1. **Update skill documentation** in `public/skill-content.md`
2. **Replace demo endpoints** with your actual API routes
3. **Customize the landing page** in `src/app/page.tsx`  
4. **Add real database** instead of in-memory storage
5. **Test the agent flow** end-to-end

## What Agents Get

When agents fork your project, they immediately get:
- ✅ Working `curl` commands to test with
- ✅ Clear skill.md documentation at `/.well-known/skill.md`
- ✅ Functional auth/session demo endpoints
- ✅ Proper agent-capable headers on all responses
- ✅ Standard response formats for easy parsing

## Deployment

Works with any Next.js deployment platform (Vercel, Netlify, etc.)

Remember to:
- Update the Base URL in `public/skill-content.md`
- Replace in-memory storage with a real database
- Add proper rate limiting for production

Built for agents, by developers.
