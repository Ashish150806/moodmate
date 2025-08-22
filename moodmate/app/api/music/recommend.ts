// app/api/music/recommend/route.ts
import axios from "axios";

// Map your ML moods → Spotify recommendation parameters
const moodParams: Record<string, any> = {
  Positive: { 
    target_valence: 0.9, 
    target_energy: 0.7, 
    seed_genres: "pop,dance,edm" 
  },
  Neutral: { 
    target_valence: 0.5, 
    target_energy: 0.5, 
    seed_genres: "indie,acoustic,lofi" 
  },
  Negative: { 
    target_valence: 0.2, 
    target_energy: 0.3, 
    seed_genres: "acoustic,indie,ambient" 
  },
  Irrelevant: { 
    target_valence: 0.6, 
    target_energy: 0.6, 
    seed_genres: "pop,hip-hop,rock" 
  },
};

export async function POST(req: Request) {
  try {
    const { mood, accessToken } = await req.json();

    if (!mood || !accessToken) {
      return Response.json(
        { error: "Mood and accessToken are required" },
        { status: 400 }
      );
    }

    const params = moodParams[mood] || {
      target_valence: 0.5,
      seed_genres: "pop",
    };

    const res = await axios.get("https://api.spotify.com/v1/recommendations", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        limit: 10,
        ...params,
      },
    });

    // 🎵 Extract only useful info
    const recommendations = res.data.tracks.map((track: any) => ({
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
    console.error(
      "Spotify Recommendation API Error:",
      error.response?.data || error.message
    );
    return Response.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
