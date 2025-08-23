export const runtime = "nodejs"; // force Node.js runtime
import { URLSearchParams } from "url";

const moodParams: Record<string, any> = {
  Positive: { target_valence: 0.9, target_energy: 0.7, seed_genres: "pop,dance,edm" },
  Neutral: { target_valence: 0.5, target_energy: 0.5, seed_genres: "indie,acoustic,lofi" },
  Negative: { target_valence: 0.2, target_energy: 0.3, seed_genres: "acoustic,indie,ambient" },
  Irrelevant: { target_valence: 0.6, target_energy: 0.6, seed_genres: "pop,hip-hop,rock" },
};

async function getAccessToken(code: string) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Failed to get access token: ${await res.text()}`);
  }

  return res.json(); // returns { access_token, refresh_token, expires_in }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { mood, code } = await req.json();

    if (!mood || !code) {
      return Response.json({ error: "Mood and Spotify code are required" }, { status: 400 });
    }

    // Exchange code for access token
    const tokenData = await getAccessToken(code);
    const accessToken = tokenData.access_token;

    const params = moodParams[mood] || { target_valence: 0.5, seed_genres: "pop" };
    const query = new URLSearchParams({ limit: "10", ...params }).toString();

    // Call Spotify recommendations
    const spotifyRes = await fetch(`https://api.spotify.com/v1/recommendations?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!spotifyRes.ok) {
      const errText = await spotifyRes.text();
      return Response.json({ error: "Spotify API error", details: errText }, { status: spotifyRes.status });
    }

    const data = await spotifyRes.json();
    const recommendations = data.tracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name).join(", "),
      album: track.album.name,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
      image: track.album.images?.[0]?.url || null,
    }));

    return Response.json({ tracks: recommendations });
  } catch (err: any) {
    console.error("Recommendation API Error:", err.message);
    return Response.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
