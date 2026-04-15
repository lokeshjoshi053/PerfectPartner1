import { NextResponse } from "next/server";

const BACKEND_SCAN_URL =
  process.env.BACKEND_SCAN_URL || "http://127.0.0.1:5000/api/scan";
const USE_MOCK_FALLBACK =
  process.env.USE_MOCK_SCAN_FALLBACK !== "false";

function createMockProfile(username) {
  const cleanUsername = (username || "rishta_user").trim().replace("@", "");
  const capitalized =
    cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  return {
    username: cleanUsername,
    full_name: `${capitalized} Sharma`,
    bio: "Chai lover. Family function survivor. Weekend philosopher. Here for vibes and verified sanskaar.",
    followers: 12800,
    following: 742,
    posts_count: 86,
    is_verified: cleanUsername.length % 2 === 0,
    profile_pic_b64: ""
  };
}

function createMockResponse(username, reason) {
  return NextResponse.json(
    {
      profile: createMockProfile(username),
      meta: {
        mock: true,
        message: "Backend unavailable tha, isliye mock profile dikha rahe hain.",
        reason
      }
    },
    { status: 200 }
  );
}

export async function POST(request) {
  const requestClone = request.clone();

  try {
    const body = await request.json();
    const username = body?.username;

    if (!username) {
      return NextResponse.json(
        { error: "Username daalo pehle!" },
        { status: 400 }
      );
    }

    const response = await fetch(BACKEND_SCAN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!isJson) {
      if (USE_MOCK_FALLBACK) {
        return createMockResponse(
          username,
          `Non-JSON backend response (${response.status})`
        );
      }

      return NextResponse.json(
        {
          error: text || "Unexpected response from backend."
        },
        { status: response.status || 500 }
      );
    }

    const payload = JSON.parse(text);

    if (!response.ok || !payload?.profile) {
      if (USE_MOCK_FALLBACK) {
        return createMockResponse(
          username,
          payload?.error || `Invalid backend payload (${response.status})`
        );
      }

      return NextResponse.json(payload, { status: response.status || 500 });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    if (USE_MOCK_FALLBACK) {
      const fallbackBody = await requestClone
        .json()
        .catch(() => ({}));
      return createMockResponse(
        fallbackBody?.username,
        error instanceof Error ? error.message : "Unknown backend error"
      );
    }

    return NextResponse.json(
      {
        error:
          "Server se connect nahi ho paya. Flask server run kar pehle!"
      },
      { status: 500 }
    );
  }
}
