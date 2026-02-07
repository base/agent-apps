import { NextRequest } from "next/server";
import { storage } from "./storage";

export function validateApiKey(request: NextRequest): { valid: boolean; agent?: any; error?: string } {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }
  
  const apiKey = authHeader.substring(7); // Remove "Bearer "
  
  const agent = storage.findAgentByApiKey(apiKey);
  
  if (!agent) {
    return { valid: false, error: "Invalid API key" };
  }
  
  return { valid: true, agent };
}

export function requireAuth(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    throw new Error(auth.error || "Authentication failed");
  }
  return auth.agent;
}