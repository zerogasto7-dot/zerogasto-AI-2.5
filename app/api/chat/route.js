import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ text: "Error: Falta la API KEY en Vercel. ||| Configura las variables de entorno." });
    }

    // Cambiamos el 2.5 por el 2.0 para que Google acepte la llamada
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // SIN ": any[]", solo la variable limpia
    let parts = []; 

    if (image) {
      const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: base64Data }
      });
    }

    parts.push({
      text: `Actúa como un Chef ZeroGasto 2.5 👨‍🍳 experto en cocina de aprovechamiento. 
      El usuario tiene estos ingredientes: ({si no te da sujiere}). 
      Su tiempo disponible es, ({si no te da suguiere uno}). 
      TU OBJETIVO: Generar UNA (1) sola receta coherente y creativa. 
      El tono debe ser cercano y motivador. 
      ESTRUCTURA OBLIGATORIA (Usa saltos de línea claros):
      
      1. Encabezado e Información General
      Nombre del platillo: Debe ser claro y coherente con el menú.
      Rendimiento (Yield): Cantidad de porciones o raciones que produce la receta (ej. "4 personas" o "1 litro").
      Tiempo de preparación y cocción: Estimado total para organizar la producción.
      Nivel de dificultad: (Opcional) Indicador para el cocinero. 

      2. Los Ingredientes (Mise en Place)
      Lista de ingredientes: Ordenados según su aparición en el proceso.
      Cantidades y unidades exactas: Uso de medidas de peso (gramos, kilos), volumen (litros, tazas) o unidades (piezas, hojas).
      Estado del ingrediente: Especificaciones técnicas como "picado en brunoise", "tamizado" o "a temperatura ambiente". 

      3. Equipamiento y Utensilios
      Herramientas necesarias: Listado de ollas, sartenes, termómetros o moldes específicos para evitar interrupciones. 

      4. Procedimiento (Elaboración Paso a Paso)
      Instrucciones numeradas: Pasos en orden cronológico utilizando verbos en imperativo (ej. "Corte", "Mezcle").
      Tiempos y temperaturas: Indicaciones críticas como "cocer a 180°C" o "dejar reposar por 10 minutos".
      Técnicas específicas: Mención de procesos culinarios (ej. "blanquear", "reducir"). 

      5. Toques Finales y Servicio
      Rectificación: Ajuste final de sazón (sal y pimienta) antes de retirar del fuego.
      Emplatado y presentación: Descripción de cómo debe lucir el plato, qué vajilla usar y qué elementos decorativos (garnish) añadir.
      Temperatura de servicio: Indicación de si el plato se sirve muy caliente, tibio o frío. 
            
      |||
      Analiza imágenes solo cuando adjuntan una.

      Contexto: ${message || "Analiza la imagen y sorpréndeme"}`
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts }] })
    });

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "El Chef está ocupado. ||| Intenta de nuevo.";

    return NextResponse.json({ text: aiText });
  } catch (error) {
    return NextResponse.json({ text: "Error en la cocina digital. ||| Revisa tu conexión." });
  }
}