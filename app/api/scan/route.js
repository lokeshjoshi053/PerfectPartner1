import { NextResponse } from "next/server";
import { normalizeUsername } from "../../../lib/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
const INSTAGRAM_APP_ID = "936619743392459";
const OPTIONAL_BACKEND_SCAN_URL = process.env.BACKEND_SCAN_URL || "";

function invalidResponse(message, status = 502) {
  return NextResponse.json({ error: message }, { status });
}

function pickFirstNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      !Number.isNaN(Number(value.replace(/,/g, "")))
    ) {
      return Number(value.replace(/,/g, ""));
    }
  }

  return 0;
}

function htmlDecode(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

function normalizeProfile(rawProfile) {
  if (!rawProfile || typeof rawProfile !== "object") return null;

  const username = normalizeUsername(
    rawProfile.username ||
      rawProfile.handle ||
      rawProfile.user_name ||
      rawProfile.ig_username
  );

  if (!username) return null;

  return {
    username,
    full_name:
      rawProfile.full_name ||
      rawProfile.fullName ||
      rawProfile.name ||
      username,
    bio:
      rawProfile.bio ||
      rawProfile.biography ||
      rawProfile.description ||
      "",
    followers: pickFirstNumber(
      rawProfile.followers,
      rawProfile.followers_count,
      rawProfile.follower_count,
      rawProfile.edge_followed_by?.count
    ),
    following: pickFirstNumber(
      rawProfile.following,
      rawProfile.following_count,
      rawProfile.followees_count,
      rawProfile.edge_follow?.count
    ),
    posts_count: pickFirstNumber(
      rawProfile.posts_count,
      rawProfile.post_count,
      rawProfile.media_count,
      rawProfile.edge_owner_to_timeline_media?.count
    ),
    is_verified: Boolean(
      rawProfile.is_verified ??
        rawProfile.isVerified ??
        rawProfile.verified
    ),
    profile_pic_url:
      rawProfile.profile_pic_url_hd ||
      rawProfile.profile_pic_url ||
      rawProfile.profilePicture ||
      "",
    profile_pic_b64: rawProfile.profile_pic_b64 || ""
  };
}

async function toDataUrl(imageUrl) {
  if (!imageUrl) return "";

  try {
    console.log("🖼️ Converting profile pic:", imageUrl);
    const imageResponse = await fetchWithRetry(imageUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      }
    });

    if (!imageResponse.ok) {
      console.warn(`Profile pic fetch failed (${imageResponse.status}):`, imageUrl);
      return imageUrl;
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const bytes = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    console.log("✅ Profile pic converted to base64");
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.error("❌ Profile pic conversion failed:", err.message);
    return imageUrl;
  }
}

async function fetchInstagramApiProfile(username) {
  const response = await fetchWithRetry(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    {
      headers: {
        Accept: "*/*",
        "X-IG-App-ID": INSTAGRAM_APP_ID,
        Referer: `https://www.instagram.com/${username}/`,
        Origin: "https://www.instagram.com"
      }
    }
  );

  const payload = await response.json();
  return normalizeProfile(payload?.data?.user || payload?.user || payload?.profile);
}

function extractHtmlMeta(html, property, attribute = "property") {
  const pattern = new RegExp(
    `<meta[^>]+${attribute}=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(pattern);
  return htmlDecode(match?.[1] || "");
}

function parseInstagramCount(raw) {
  const normalized = raw.replace(/,/g, "").trim().toLowerCase();
  if (!normalized) return 0;
  if (normalized.endsWith("k")) return Math.round(Number(normalized.slice(0, -1)) * 1000);
  if (normalized.endsWith("m")) return Math.round(Number(normalized.slice(0, -1)) * 1000000);
  return pickFirstNumber(normalized);
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "User-Agent": getRandomUA(),
        },
        cache: "no-store"
      });

      if (response.status === 429 || response.status === 403) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s backoff
        console.log(`Rate limited (${response.status}), retrying in ${delay}ms... (attempt ${i+1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

async function fetchInstagramHtmlProfile(username) {
const apiKey = process.env.SCRAPERAPI_KEY;
  if (!apiKey) {
    console.error('❌ SCRAPERAPI_KEY missing! Add to .env.local or Vercel dashboard.');
    throw new Error('SCRAPERAPI_KEY environment variable is required. Get free key from scraperapi.com');
  }
  const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=https://www.instagram.com/${username}/&render=true&country_code=us&timeout=10000&retry=3&retry_delay=5000`;
  const response = await fetchWithRetry(scraperUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    }
  });

  if (!response.ok) {
    throw new Error(`ScraperAPI request failed with ${response.status}`);
  }

  let html = await response.text();
  if (!html || html.includes("error") || !html.includes(username)) {
    throw new Error("ScraperAPI failed to fetch valid Instagram profile");
  }

  // Try extract JSON from window._sharedData (more reliable)
  const jsonMatch = html.match(/window\._sharedData\s*=\s*({.*});/s);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      console.log("✅ Using _sharedData JSON");
      const user = data.entry_data.ProfilePage?.[0]?.graphql?.user || {};
      if (user.username === username) {
        return normalizeProfile(user);
      }
    } catch (e) {
      console.warn("JSON parse failed:", e.message);
    }
  }
  console.log("🔄 Falling back to meta parsing");
  const description =
    extractHtmlMeta(html, "og:description") ||
    extractHtmlMeta(html, "description", "name");
  const title = extractHtmlMeta(html, "og:title");
  const imageUrl = extractHtmlMeta(html, "og:image");

  const statsMatch = description.match(
    /([\d.,]+[kKmM]?)\s+Followers,\s+([\d.,]+[kKmM]?)\s+Following,\s+([\d.,]+[kKmM]?)\s+Posts/i
  );

  const nameMatch = title.match(/Instagram photos and videos from (.+?) \(@/i);
  const bio = description
    .replace(/^[\d.,kKmM]+\s+Followers,\s+[\d.,kKmM]+\s+Following,\s+[\d.,kKmM]+\s+Posts\s+-\s+See Instagram photos and videos from\s+/i, "")
    .replace(/\s*\(@[^)]+\)\s*/i, " ")
    .trim();

  return normalizeProfile({
    username,
    full_name: nameMatch?.[1]?.trim() || username,
    bio,
    followers: parseInstagramCount(statsMatch?.[1] || ""),
    following: parseInstagramCount(statsMatch?.[2] || ""),
    posts_count: parseInstagramCount(statsMatch?.[3] || ""),
    profile_pic_url: imageUrl,
    is_verified: html.includes('"is_verified":true') || html.includes('"isVerified":true')
  });
}

async function fetchOptionalBackendProfile(username) {
  if (!OPTIONAL_BACKEND_SCAN_URL) return null;

  const response = await fetchWithRetry(OPTIONAL_BACKEND_SCAN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username })
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Optional backend did not return JSON");
  }

  const payload = await response.json();
  return normalizeProfile(
    payload?.profile ||
      payload?.data?.profile ||
      payload?.user ||
      payload?.data?.user ||
      payload
  );
}

async function getInstagramProfile(username) {
function getCacheKey(username) {
  return `ig:${normalizeUsername(username)}`;
}

// Vercel serverless: no persistent cache needed (stateless)
const profileCache = new Map(); // per-instance only (cold starts ok)
const CACHE_TTL = 5 * 60 * 1000; // 5min for serverless

const attempts = [
  async () => {
    const key = getCacheKey(username);
    const cached = profileCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 Cache hit for @${username}`);
      return cached.profile;
    }
    console.log(`🌐 Fetching @${username} (cache miss)`);
    const profile = await fetchInstagramApiProfile(username);
    profileCache.set(key, { profile, timestamp: Date.now() });
    return profile;
  },
  async () => fetchInstagramHtmlProfile(username),
  async () => fetchOptionalBackendProfile(username)
];

  const errors = [];
  for (const attempt of attempts) {
    try {
      const profile = await attempt();
      if (profile?.username === username) {
        return profile;
      }

      if (profile?.username && profile.username !== username) {
        throw new Error(
          `Requested @${username} but provider returned @${profile.username}`
        );
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(errors.filter(Boolean).join(" | "));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const requestedUsername = normalizeUsername(body?.username);

    if (!requestedUsername) {
      return invalidResponse("Username daalo pehle!", 400);
    }

    const profile = await getInstagramProfile(requestedUsername);
    const profilePic = await toDataUrl(profile.profile_pic_b64 || profile.profile_pic_url);

    return NextResponse.json(
      {
        profile: {
          ...profile,
          username: requestedUsername,
          profile_pic_b64: profilePic
        },
        meta: {
          requestedUsername,
          exactMatch: true,
          source: "instagram-direct"
        }
      },
      { status: 200 }
    );
  } catch (error) {
    let safeUsername = 'unknown';
    try {
      const body = await request.json();
      safeUsername = normalizeUsername(body?.username) || 'unknown';
    } catch {}
    console.error(`❌ Full scan error for @${safeUsername}:`, error);
    console.error(`❌ Full scan error for @${safeUsername}:`, error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return invalidResponse(
      `Profile scan failed: ${errorMsg}`,
      502
    );
  }
}
