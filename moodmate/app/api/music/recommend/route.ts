export const runtime = "nodejs";
import { URLSearchParams } from "url";

const moodParams: Record<string, any> = {
  Positive: { target_valence: 0.9, target_energy: 0.7, seed_genres: "pop,dance,edm" },
  Neutral: { target_valence: 0.5, target_energy: 0.5, seed_genres: "indie,acoustic,lofi" },
  Negative: { target_valence: 0.2, target_energy: 0.3, seed_genres: "acoustic,indie,ambient" },
  Irrelevant: { target_valence: 0.6, target_energy: 0.6, seed_genres: "pop,hip-hop,rock" },
};

async function getAppAccessToken() {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Failed to get app token: ${await res.text()}`);
  }

  return res.json(); // { access_token, token_type, expires_in }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { mood } = await req.json();

    if (!mood) {
      return Response.json({ error: "Mood is required" }, { status: 400 });
    }

    // Get app access token
    const tokenData = await getAppAccessToken();
    const accessToken = tokenData.access_token;

    const params = moodParams[mood] || { target_valence: 0.5, seed_genres: "pop" };
    const query = new URLSearchParams({ limit: "10", ...params }).toString();

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

    return Response.json(recommendations); // directly return array
  } catch (err: any) {
    console.error("Recommendation API Error:", err.message);
    return Response.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
