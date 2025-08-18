"use client";

import { useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Infer mood
      const moodRes = await fetch("/api/mood/infer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const { mood } = await moodRes.json();
      setMood(mood);

      // 2. Get Spotify recommendations
      const recRes = await fetch("/api/music/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });
      const recs = await recRes.json();
      setTracks(recs);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Title */}
      <h1 className="text-4xl font-bold tracking-tight mb-6">MoodMate 🎶</h1>

      {/* Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tell me about your day..."
        className="w-full max-w-xl p-3 border rounded-lg shadow-sm mb-4 dark:bg-gray-800 dark:text-white"
        rows={4}
      />

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !text}
        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md transition disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Get Songs"}
      </button>

      {/* Mood */}
      {mood && (
        <div className="mt-6 text-lg">
          <span className="font-semibold">Detected Mood:</span> {mood}
        </div>
      )}

      {/* Recommendations */}
      {tracks.length > 0 && (
        <div className="mt-6 w-full max-w-2xl space-y-4">
          {tracks.map((t) => (
            <div
              key={t.id}
              className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t.artists?.map((a: any) => a.name).join(", ")}
                </p>
              </div>
              {t.preview_url && (
                <audio controls src={t.preview_url} className="ml-4" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm text-gray-500 dark:text-gray-400">
        Built with ❤️ using Next.js & Spotify API
      </footer>
    </main>
  );
}
