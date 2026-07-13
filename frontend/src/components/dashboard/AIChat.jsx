import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, RotateCcw } from "lucide-react";
import { useAIChat } from "../../hooks/useAIChat";

export default function AIChat() {
  const { conversation, loading, sending, send, newChat } = useAIChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    send(input.trim());
    setInput("");
  };

  return (
    <div
      className="rounded-2xl p-3 sm:p-5 border flex flex-col w-full"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px)",
        borderColor: "rgba(255,255,255,0.15)",
        height: "min(600px, 75vh)",
      }}
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#258a4e] flex-shrink-0" />
          <h3 className="font-fraunces text-base sm:text-lg text-white">Asesor IA</h3>
        </div>
        <button
          onClick={newChat}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white flex-shrink-0"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Nueva conversación</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {loading && <p className="text-white/50 text-sm">Cargando conversación...</p>}

        {!loading && conversation?.messages?.length === 0 && (
          <p className="text-white/50 text-sm">
            Pregúntame lo que quieras sobre tus finanzas: gastos, cultivos, rentabilidad, o pide consejos.
          </p>
        )}

        {conversation?.messages?.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] sm:max-w-[80%] rounded-xl px-3 py-2 text-sm break-words"
              style={{
                background: m.role === "user" ? "#258a4e" : "rgba(255,255,255,0.1)",
                color: "white",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div
              className="rounded-xl px-3 py-2 text-sm text-white/60"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              Escribiendo...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 mt-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Escribe tu pregunta..."
          disabled={sending || loading}
          style={{
            background: "rgba(255,255,255,0.85)",
            color: "#1c1917",
          }}
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || loading || !input.trim()}
          className="p-2 rounded-lg bg-[#258a4e] text-white disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}