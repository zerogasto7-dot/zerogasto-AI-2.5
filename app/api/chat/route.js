export async function POST(req) {
  try {
    const { message, image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ text: "Error: Falta la API KEY en Vercel." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    let parts = [
      { text: "Actúa como un Chef ZeroGasto 2.5 experto en cocina de aprovechamiento." },
      { text: message }
    ];

    if (image) {
      const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: base64Data }
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();
    return NextResponse.json({ text: data.candidates[0].content.parts[0].text });

  } catch (error) {
    return NextResponse.json({ text: "El Cner está ocupado." });
  }
}