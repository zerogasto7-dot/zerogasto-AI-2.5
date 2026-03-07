import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ text: "Error: Falta la API KEY en Vercel." });
    }

    // Usamos el motor 2.0 que es el que acepta Google actualmente
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    // AQUÍ ESTÁ EL TRUCO: Necesitas enviar el mensaje del usuario (message)
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
      body: JSON.stringify({
        contents: [{ parts: parts }]
      })
    });

    const data = await response.json();
    
    // Si Google responde con éxito, extraemos el texto
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return NextResponse.json({ text: data.candidates[0].content.parts[0].text });
    } else {
      throw new Error("Respuesta de IA vacía");
    }

  } catch (error) {
    console.error("Error en la IA:", error);
    return NextResponse.json({ text: "El Chef está ocupado. Intenta de nuevo." });
  }
}