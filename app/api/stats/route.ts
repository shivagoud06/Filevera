import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { tools } from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dedicated preset routes in Filevera
const PRESET_ROUTES_COUNT = 8; // 4 PDF presets (500KB, 1MB, 2MB, 5MB) + 4 Image presets (50KB, 100KB, 200KB, 500KB)
const TOTAL_TOOLS_AND_PRESETS = tools.length + PRESET_ROUTES_COUNT;

interface StatsCache {
  data: {
    filesProcessed: number;
    happyUsers: number;
    toolsCount: number;
    uptime: number | null;
  };
  cachedAt: number;
}

let cachedStats: StatsCache | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export async function GET() {
  const now = Date.now();

  if (cachedStats && now - cachedStats.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(cachedStats.data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  }

  let filesProcessed = 0;
  let happyUsers = 0;

  try {
    const [usageRes, usersRes] = await Promise.all([
      dbQuery<{ count: string | number }>(
        `SELECT COUNT(*)::int AS count FROM credit_usage`
      ).catch(() => ({ rows: [{ count: 0 }] })),
      dbQuery<{ count: string | number }>(
        `SELECT COUNT(*)::int AS count FROM "user"`
      ).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    filesProcessed = Number(usageRes.rows[0]?.count || 0);
    happyUsers = Number(usersRes.rows[0]?.count || 0);
  } catch (err) {
    console.error("Error querying stats from database:", err);
  }

  // Real Uptime monitoring configuration: Only return a number if a real monitoring provider/env is set
  const uptimeEnv = process.env.SYSTEM_UPTIME_PERCENT;
  const uptime = uptimeEnv && !isNaN(parseFloat(uptimeEnv)) ? parseFloat(uptimeEnv) : null;

  const data = {
    filesProcessed,
    happyUsers,
    toolsCount: TOTAL_TOOLS_AND_PRESETS,
    uptime,
  };

  cachedStats = {
    data,
    cachedAt: now,
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
