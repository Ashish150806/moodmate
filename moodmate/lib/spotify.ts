let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getSpotifyToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Spotify token: ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000 - 60000; // refresh 1 min early

  return cachedToken ?? "";
}

export interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  image: string;
  url: string;
}

export async function searchTracksByMood(mood: string, limit = 10): Promise<Track[]> {
  const token = await getSpotifyToken();

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(mood)}&type=track&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Spotify search failed: ${await res.text()}`);
  }

  const data = await res.json();

  return data.tracks.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((a: any) => a.name).join(", "),
    album: track.album.name,
    image: track.album.images?.[0]?.url ?? "", // safe fallback
    url: track.external_urls.spotify,
  }));
}
