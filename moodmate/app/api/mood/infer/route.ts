// app/api/mood/infer/route.ts
import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify client credentials");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to fetch Spotify access token: ${msg}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function getSpotifyTracks(query: string) {
  const token = await getSpotifyAccessToken();

  const res = await fetch(
    `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=track&limit=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to fetch tracks from Spotify: ${msg}`);
  }

  const data = await res.json();

  return data.tracks.items.map((track: any) => ({
    name: track.name,
    artists: track.artists.map((a: any) => a.name),
    album: track.album.name,
    image: track.album.images[0]?.url,
    url: track.external_urls.spotify,
  }));
}

export const runtime = "nodejs";

// ✅ Quick browser test: GET
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Mood inference API is running 🚀",
  });
}

// ✅ Full pipeline: POST
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // 1️⃣ Call Flask backend to predict mood
    const flaskUrl =
      process.env.FLASK_API_URL || "http://127.0.0.1:5000/predict";

    const flaskRes = await fetch(flaskUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!flaskRes.ok) {
      const errText = await flaskRes.text();
      return NextResponse.json(
        { error: "Flask API error", details: errText },
        { status: flaskRes.status }
      );
    }

    const moodData = await flaskRes.json();
    const predictedMood = moodData.mood || text; // fallback

    // 2️⃣ Fetch Spotify tracks based on predicted mood
    const tracks = await getSpotifyTracks(predictedMood);

    // 3️⃣ Return combined response
    return NextResponse.json({ mood: predictedMood, tracks });
  } catch (err: any) {
    console.error("❌ Error in Next.js API:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
