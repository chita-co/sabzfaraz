import { fetch as undiciFetch, ProxyAgent } from "undici";
import { NextResponse } from "next/server";

interface TestProxyResult {
  ip?: string;
  ipError?: string;
  sepStatus?: number;
  sepError?: string;
}

export async function GET() {
  const dispatcher = process.env.NOBLE_PROXY_URL
    ? new ProxyAgent(process.env.NOBLE_PROXY_URL)
    : undefined;

  const results: TestProxyResult = {};

  try {
    const res = await undiciFetch("https://api.ipify.org?format=json", {
      dispatcher,
      signal: AbortSignal.timeout(20000),
    });
    results.ip = await res.text();
  } catch (e: unknown) {
    results.ipError = e instanceof Error ? e.message : String(e);
  }

  try {
    const res = await undiciFetch("https://sep.shaparak.ir", {
      dispatcher,
      signal: AbortSignal.timeout(20000),
    });
    results.sepStatus = res.status;
  } catch (e: unknown) {
    results.sepError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(results);
}