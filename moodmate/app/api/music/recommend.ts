// app/api/music/recommend/route.ts
import axios from "axios";

const moodParams: Record<string, any> = {
  happy: { target_valence: 0.9, target_energy: 0.7 },
  sad: { target_valence: 0.2, target_energy: 0.3 },
  calm: { target_energy: 0.3, target_acousticness: 0.6 },
  stressed: { target_valence: 0.4, target_energy: 0.4 },
  angry: { target_energy: 0.9, target_valence: 0.3 },
  tired: { target_energy: 0.2, target_valence: 0.4 },
};

export async function POST(req: Request) {
  try {
    const { mood, accessToken } = await req.json();

    const params = moodParams[mood] || { target_valence: 0.5 };

    const res = await axios.get("https://api.spotify.com/v1/recommendations", {
      headers: { Authorization: `Bearer ${accessToken}` }, // ✅ fixed
      params: {
        limit: 10,
        seed_genres: "pop", // you can change this dynamically
        ...params,
      },
    });

    return Response.json(res.data.tracks);
  } catch (error: any) {
    console.error("Spotify Recommendation API Error:", error.response?.data || error.message);
    return Response.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
