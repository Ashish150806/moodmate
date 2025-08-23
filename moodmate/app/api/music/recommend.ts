export const runtime = "nodejs"; // force Node.js runtime

const moodParams: Record<string, any> = {
  Positive: { target_valence: 0.9, target_energy: 0.7, seed_genres: "pop,dance,edm" },
  Neutral: { target_valence: 0.5, target_energy: 0.5, seed_genres: "indie,acoustic,lofi" },
  Negative: { target_valence: 0.2, target_energy: 0.3, seed_genres: "acoustic,indie,ambient" },
  Irrelevant: { target_valence: 0.6, target_energy: 0.6, seed_genres: "pop,hip-hop,rock" },
};

export async function POST(req: Request): Promise<Response> {
  try {
    const { mood, accessToken } = await req.json();

    if (!mood || !accessToken) {
      return Response.json(
        { error: "Mood and accessToken are required" },
        { status: 400 }
      );
    }

    const params = moodParams[mood] || { target_valence: 0.5, seed_genres: "pop" };

    // Build query string
    const query = new URLSearchParams({ limit: "10", ...params }).toString();

    // Call Spotify API
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/recommendations?${query}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!spotifyRes.ok) {
      const errText = await spotifyRes.text();
      console.error("Spotify API error:", errText);
      return Response.json(
        { error: "Failed to fetch recommendations", details: errText },
        { status: spotifyRes.status }
      );
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
  } catch (error: any) {
    console.error("Recommendation API Error:", error.message);
    return Response.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
