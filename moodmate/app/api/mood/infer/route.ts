import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();

  try {
    const res = await fetch("http://localhost:8000/infer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to connect to ML API" }, { status: 500 });
  }
}
