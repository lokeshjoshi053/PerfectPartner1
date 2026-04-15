import { NextResponse } from "next/server";
import { normalizeUsername } from "../../../lib/analysis";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
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
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
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
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      cache: "no-store"
    });

    if (!imageResponse.ok) return imageUrl;

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const bytes = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return imageUrl;
  }
}

async function fetchInstagramApiProfile(username) {
  const response = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    {
      headers: {
        Accept: "*/*",
        "User-Agent": USER_AGENT,
        "X-IG-App-ID": INSTAGRAM_APP_ID,
        Referer: `https://www.instagram.com/${username}/`,
        Origin: "https://www.instagram.com"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Instagram API request failed with ${response.status}`);
  }

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

async function fetchInstagramHtmlProfile(username) {
  const response = await fetch(`https://www.instagram.com/${username}/`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "User-Agent": USER_AGENT
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Instagram HTML request failed with ${response.status}`);
  }

  const html = await response.text();
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

  const response = await fetch(OPTIONAL_BACKEND_SCAN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Optional backend request failed with ${response.status}`);
  }

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
  const attempts = [
    async () => fetchInstagramApiProfile(username),
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
    return invalidResponse(
      error instanceof Error && error.message
        ? `Instagram profile fetch failed for the exact username entered. ${error.message}`
        : "Instagram profile fetch failed for the exact username entered.",
      502
    );
  }
}
