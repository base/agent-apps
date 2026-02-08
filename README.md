# Agent App Framework ---experimental

A Next.js template for building applications that serve AI agents first, humans second. Authentication uses [fishnet-auth](https://www.npmjs.com/package/fishnet-auth) -- a reverse CAPTCHA that verifies callers are AI agents by having them solve reasoning tasks.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local and set a strong FISHNET_AUTH_SECRET

# 3. Start the dev server
npm run dev
```

Visit http://localhost:3000

## How It Works

### Agent Authentication Flow

1. Agent requests a challenge: `GET /api/agent-auth?name=AgentName`
2. Server returns reasoning tasks (reverse strings, sort arrays, etc.)
3. Agent solves tasks and submits answers: `POST /api/agent-auth`
4. Server verifies answers and issues a bearer token
5. Agent uses the token for all subsequent API calls

No API keys to manage. No LLM cost on the server. Agents prove intelligence on their own.

### Agent Discovery

Agents discover your service via the standard `skill.md` endpoint:

```bash
curl http://localhost:3000/.well-known/skill.md
```

## Project Structure

```
src/
  app/
    .well-known/skill.md/route.ts   # RFC 8615 compliant discovery endpoint
    skill.md/route.ts               # Alternative skill.md endpoint
    api/
      agent-auth/                   # fishnet-auth handlers (GET challenge, POST solve)
        [[...fishnet-auth]]/route.ts
        protected/route.ts          # Example protected endpoint
      health/route.ts               # Health check
      sessions/                     # Demo session management
        join/route.ts
        [sessionId]/state/route.ts
      test/route.ts                 # Auth test endpoint
      demo/solve/route.ts           # Demo solver endpoint
    demo/fishnet/page.tsx           # Interactive auth demo UI
    page.tsx                        # Landing page
  lib/
    fishnet.ts                      # fishnet-auth configuration
.well-known/skill.md                # Static skill documentation
public/skill-content.md             # Skill content served by routes
```

## Features

- **fishnet-auth** -- Reverse CAPTCHA authentication. Agents solve reasoning tasks to prove intelligence.
- **skill.md endpoints** -- Both `/.well-known/skill.md` and `/skill.md` routes for agent discovery.
- **Agent-first UI** -- Landing page separates agent and developer paths.
- **Skill prompt template** -- `skill-prompt.md` generates your `skill.md` docs via LLM.
- **Demo endpoints** -- Working session management and auth flow to test with immediately.
- **End-to-end test script** -- `test-anthropic.sh` runs the full auth flow using Claude as the solver. See [TESTING.md](TESTING.md) for details.

## Customization

1. Update `public/skill-content.md` with your API documentation
2. Replace demo session endpoints with your actual API routes
3. Adjust fishnet-auth difficulty in `src/lib/fishnet.ts`
4. Add a real database to replace the in-memory demo storage
5. Use `skill-prompt.md` to regenerate your `skill.md` when your API changes

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FISHNET_AUTH_SECRET` | Yes | Secret used to sign fishnet-auth tokens. Generate a strong random string. |
| `NEXT_PUBLIC_BASE_URL` | No | Base URL for the app. Defaults to `http://localhost:3000`. |
| `ANTHROPIC_API_KEY` | No | Anthropic API key. Only needed for running `test-anthropic.sh`. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys). |

## Deployment

Works with any Next.js deployment platform (Vercel, Netlify, self-hosted, etc.).

Before deploying:
- Set `FISHNET_AUTH_SECRET` to a strong random value
- Set `NEXT_PUBLIC_BASE_URL` to your production URL
- Update the Base URL in `public/skill-content.md`
- Replace in-memory storage with a persistent database
- Add rate limiting for production traffic
