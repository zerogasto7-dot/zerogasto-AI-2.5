'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ZeroGastoApp() {
  const [input, setInput] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [extraTip, setExtraTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const startListening = () => {
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window)) {
      alert("Tu navegador no soporta voz. Intenta usar Chrome.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'es-PE'; 
    recognition.continuous = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + " " + transcript);
    };
    recognition.start();
  };

  const toggleSpeech = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const cleanText = displayedText.replace(/\*/g, '').replace(/[\u{1F600}-\u{1F64F}]/gu, ''); 
      const utterance = new SpeechSynthesisUtterance(`${cleanText}. Consejo de ahorro: ${extraTip}`);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0; 
      
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => voice.lang.includes('es'));
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleDoc = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === "text/plain") {
      const text = await file.text();
      setInput(prev => prev + "\n[Lista]: " + text);
    } else {
      setInput(prev => prev + `\n[Archivo: ${file.name}]`);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const shopIngredientes = (supermarket) => {
    const query = input.trim() ? encodeURIComponent(input) : "ofertas comida";
    let url = "";

    switch(supermarket) {
        case 'plazavea': url = `https://www.plazavea.com.pe/search/?_query=${query}`; break;
        case 'wong': url = `https://www.wong.pe/busca/?ft=${query}`; break;
        case 'metro': url = `https://www.metro.pe/busca/?ft=${query}`; break;
        case 'tottus': url = `https://www.tottus.com.pe/buscar?q=${query}`; break;
        default: return;
    }
    window.open(url, '_blank');
  };

  const startTypewriter = (text) => {
    let i = 0;
    setDisplayedText(''); 
    setShowFinal(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timerRef.current);
        setShowFinal(true);
      }
    }, 20); 
  };

  const generateRecipe = async () => {
    if (loading) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    setLoading(true);
    setDisplayedText(''); 
    setShowFinal(false);
    setExtraTip('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, image: imagePreview }),
      });
      const data = await res.json();
      
      const parts = data.text.split("|||");
      const recipeBody = parts[0] || "Hubo un error en la receta.";
      const recipeTip = parts[1] ? parts[1].trim() : "Planifica tus comidas semanalmente.";
      
      setExtraTip(recipeTip);
      startTypewriter(recipeBody.trim());
    } catch (e) {
      setDisplayedText("⚠️ Error de conexión con el Chef. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN PDF CORREGIDA PARA EVITAR DESCARGA EN BLANCO ---
  const downloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('receta-content');
    
    // Guardamos el estilo original para que el usuario no vea cambios en la web
    const originalStyle = element.getAttribute('style');
    
    // Forzamos temporalmente colores legibles para PDF (Fondo blanco, texto negro)
    element.style.backgroundColor = 'white';
    element.style.color = 'black';
    element.querySelectorAll('*').forEach(el => el.style.color = 'black');

    const opt = {
      margin:       0.5,
      filename:     'Receta-ZeroGasto.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        backgroundColor: '#ffffff', 
        useCORS: true 
      },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Ejecutamos la descarga
    await html2pdf().set(opt).from(element).save();

    // Restauramos el diseño oscuro original de la app
    element.setAttribute('style', originalStyle);
    element.querySelectorAll('*').forEach(el => el.style.color = '');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans uppercase">
      <header className="max-w-6xl mx-auto py-6 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl tracking-tighter font-black italic">ZEROGASTO <span className="text-emerald-500">2.5</span></h1>
        <button onClick={() => setShowPayModal(true)} className="bg-emerald-500 text-black text-[10px] font-bold px-4 py-2 rounded-full hover:bg-white transition-all">
          {isPremium ? "PLAN ELITE ACTIVO 💎" : "SUBIR A ELITE $9.90"}
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-10 space-y-6">
        <div className="bg-[#0a0a0a] border border-white/20 rounded-lg p-6 relative group">
          <label className="text-[10px] text-emerald-500 font-bold block mb-4 tracking-widest">CAJÓN DE INGREDIENTES</label>
          <textarea 
            className="w-full bg-transparent text-white text-lg h-24 outline-none resize-none placeholder:opacity-20 mb-4 normal-case font-serif"
            placeholder="Ej: Tengo huevos, arroz y tomate... (o sube una foto)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex gap-4 border-t border-white/5 pt-4">
            <button onClick={() => fileInputRef.current.click()} className="text-[10px] font-bold hover:text-emerald-400 flex items-center gap-1">📸 FOTO</button>
            <button onClick={startListening} className={`text-[10px] font-bold flex items-center gap-1 ${isListening ? 'text-red-500 animate-pulse' : 'hover:text-emerald-400'}`}>
              🎤 {isListening ? 'ESCUCHANDO...' : 'VOZ'}
            </button>
            <button onClick={() => docInputRef.current.click()} className="text-[10px] font-bold hover:text-emerald-400 flex items-center gap-1">📄 DOC (.TXT)</button>
          </div>
        </div>

        <button onClick={generateRecipe} disabled={loading} className="w-full py-4 bg-white text-black font-black text-xs tracking-widest hover:bg-emerald-400 transition-all rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          {loading ? "👨‍🍳 EL CHEF ESTÁ COCINANDO..." : "GENERAR RECETA MÁGICA ✨"}
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {imagePreview && (
            <div className="w-full lg:w-1/3 border border-white/10 rounded-lg overflow-hidden bg-zinc-900 shadow-2xl">
              <img src={imagePreview} className="w-full h-auto object-cover" alt="Tu nevera" />
              <button onClick={() => setImagePreview(null)} className="w-full bg-red-900/50 text-white text-[9px] py-2 hover:bg-red-600 transition-colors uppercase font-bold">🗑️ Eliminar Foto</button>
            </div>
          )}
          
          {(displayedText || loading) && (
            <div className="flex-1 space-y-4">
                
                <div className="flex flex-col gap-4">
                  <div id="receta-content" className="bg-zinc-900/50 p-8 rounded border-l-4 border-emerald-500 relative min-h-[300px]">
                    {showFinal && (
                        <button onClick={toggleSpeech} className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black'}`} title={isSpeaking ? "Detener" : "Leer receta"}>
                        {isSpeaking ? '🔇 DETENER' : '🔊 LEER'}
                        </button>
                    )}

                    <div className="prose prose-invert max-w-none mt-6 text-white text-lg leading-relaxed normal-case font-medium font-serif">
                        {loading && !displayedText ? (
                            <p>🔥 Calentando fogones... Analizando ingredientes...</p>
                        ) : (
                            <ReactMarkdown>{displayedText}</ReactMarkdown>
                        )}
                    </div>
                    
                    {showFinal && (
                        <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="text-2xl">💡</span>
                        <div>
                            <p className="text-emerald-400 text-sm font-bold italic uppercase tracking-wider mb-1">Tip de Ahorro:</p>
                            <p className="text-gray-300 text-sm normal-case">{extraTip}</p>
                        </div>
                        </div>
                    )}
                  </div>

                  {/* BOTÓN DE DESCARGA PDF */}
                  {showFinal && (
                    <button 
                      onClick={downloadPDF}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-all shadow-lg"
                    >
                      <span>📥 DESCARGAR RECETA EN PDF</span>
                    </button>
                  )}
                </div>

                {showFinal && (
                    <div className="bg-[#111] border border-white/10 p-4 rounded-lg animate-in fade-in duration-1000 mt-4">
                        <p className="text-[10px] text-gray-500 font-bold tracking-widest mb-3">🛒 ¿TE FALTAN COSAS? BUSCA PRECIOS:</p>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => shopIngredientes('plazavea')} className="flex-1 min-w-[80px] py-2 bg-[#FFD700] text-black font-bold text-xs rounded hover:opacity-80">PlazaVea</button>
                            <button onClick={() => shopIngredientes('wong')} className="flex-1 min-w-[80px] py-2 bg-[#bf0909] text-white font-bold text-xs rounded hover:opacity-80">Wong</button>
                            <button onClick={() => shopIngredientes('metro')} className="flex-1 min-w-[80px] py-2 bg-[#ffff00] text-black font-bold text-xs rounded hover:opacity-80 border border-black/10">Metro</button>
                            <button onClick={() => shopIngredientes('tottus')} className="flex-1 min-w-[80px] py-2 bg-[#009e49] text-white font-bold text-xs rounded hover:opacity-80">Tottus</button>
                            
                            <a 
                                href="https://amzn.to/4aWgNi1" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex-1 min-w-[80px] py-2 bg-[#232f3e] text-white font-bold text-xs rounded hover:bg-[#FF9900] hover:text-black transition-colors flex items-center justify-center border border-white/20"
                            >
                                📦 Amazon
                            </a>
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>
      </main>

      {showPayModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-[#111] border border-emerald-500/30 p-10 rounded-2xl max-w-sm w-full text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <h2 className="text-3xl font-black italic text-white">PLAN <span className="text-emerald-400">ÉLITE</span></h2>
            <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full"></div>
            <p className="text-gray-400 text-xs tracking-widest leading-relaxed uppercase">Recetas ilimitadas y soporte prioritario.</p>
            <div className="text-5xl font-black text-white tracking-tighter">$9.90</div>
            <button onClick={() => { setIsPremium(true); setShowPayModal(false); }} className="w-full py-4 bg-emerald-500 text-black font-black rounded hover:scale-105 transition-transform">ACTIVAR AHORA</button>
            <button onClick={() => setShowPayModal(false)} className="text-[10px] text-gray-500 hover:text-white transition-colors underline uppercase tracking-widest">Cerrar</button>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImage} />
      <input type="file" ref={docInputRef} hidden accept=".txt" onChange={handleDoc} />
    </div>
  );
}