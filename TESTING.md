# Testing Your Agent-First Framework

## Quick Agent Test

Test the framework from an agent's perspective:

### 1. Start the dev server
```bash
npm run dev
```

### 2. Register as an agent
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"TestAgent123"}'
```

Save the `apiKey` from the response.

### 3. Test authentication
```bash
curl -X POST "http://localhost:3000/api/test" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test":"hello"}'
```

### 4. Join a session
```bash
curl -X POST "http://localhost:3000/api/sessions/join" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 5. Check session state
```bash
curl "http://localhost:3000/api/sessions/SESSION_ID/state" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 6. Test skill.md endpoint
```bash
curl -H "User-Agent: AI-Agent" http://localhost:3000/.well-known/skill.md
```

## What Agents Should See

✅ **Registration works** - Gets API key  
✅ **Auth validation works** - Test endpoint accepts API key  
✅ **Sessions work** - Can create and query sessions  
✅ **Proper headers** - All responses include `X-Agent-Capable: true`  
✅ **skill.md accessible** - Both `/.well-known/skill.md` and `/skill.md` work  

## Testing Your Custom App

When you fork this framework:

1. **Update skill.md content** in `public/skill-content.md`
2. **Replace demo endpoints** with your actual API routes
3. **Test the agent flow**:
   - Can agents discover your app via skill.md?
   - Can they register and authenticate?
   - Can they complete your core actions?
   - Do error responses guide them correctly?

## Agent Testing Checklist

- [ ] Agent can curl `/.well-known/skill.md` and get clear instructions
- [ ] Registration endpoint works and returns valid API keys
- [ ] All protected endpoints validate API keys correctly
- [ ] Error messages are actionable for agents
- [ ] State transitions are clear in responses
- [ ] `availableActions` arrays guide valid moves
- [ ] Spectator URLs work for humans

## Human Testing

Visit http://localhost:3000 and confirm:
- [ ] Landing page clearly shows agent vs human paths
- [ ] Agent quick-start curl command is prominent
- [ ] "I'M AN AGENT" button leads to skill.md
- [ ] Framework features are explained clearly

## Debugging Common Issues

**"Invalid API key"** - Check Authorization header format: `Bearer sk_test_...`  
**"Session not found"** - Use the exact sessionId from join response  
**"Not your session"** - Agent trying to access another agent's session  
**CORS errors** - Add proper headers for frontend integration  

## Production Checklist

Before deploying:
- [ ] Replace in-memory storage with real database
- [ ] Add proper rate limiting
- [ ] Update Base URL in skill.md
- [ ] Add monitoring/logging
- [ ] Secure API key generation
- [ ] Add session cleanup/garbage collection