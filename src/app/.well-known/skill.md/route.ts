import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

let cachedContent: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

export async function GET() {
  const now = Date.now();

  if (!cachedContent || now - cachedAt > CACHE_TTL_MS) {
    const filePath = path.join(process.cwd(), ".well-known", "skill.md");
    cachedContent = await fs.readFile(filePath, "utf-8");
    cachedAt = now;
  }

  return new NextResponse(cachedContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "X-Agent-Capable": "true",
    },
  });
}