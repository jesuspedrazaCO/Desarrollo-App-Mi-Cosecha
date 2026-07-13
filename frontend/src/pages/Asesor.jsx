import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AIChat from "../components/dashboard/AIChat";

export default function Asesor() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/"
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Volver al inicio"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-fraunces text-xl sm:text-2xl text-white">Asesor IA</h1>
      </div>
      <AIChat />
    </div>
  );
}