"use client";

import { useState, useRef } from "react";

interface Analise {
  disjuntor_geral_estimado_A: number | null;
  tensao_estimada: string;
  capacidade_disponivel_kW: number | null;
  adequado_para_AC_7kW: boolean | "incerto";
  adequado_para_DC_30kW: boolean | "incerto";
  observacoes: string;
  alertas: string[];
  confianca: "alta" | "media" | "baixa";
}

function Badge({ ok }: { ok: boolean | "incerto" }) {
  if (ok === true) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">✓ Sim</span>;
  if (ok === false) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">✗ Não</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">? Incerto</span>;
}

function ConfidencaBadge({ nivel }: { nivel: string }) {
  const map: Record<string, string> = {
    alta: "bg-green-100 text-green-800",
    media: "bg-yellow-100 text-yellow-800",
    baixa: "bg-red-100 text-red-800",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[nivel] ?? "bg-gray-100 text-gray-600"}`}>Confiança: {nivel}</span>;
}

export function PadraoAnalyzer() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [disclaimer, setDisclaimer] = useState("");
  const [erro, setErro] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  function handleFile(file: File) {
    fileRef.current = file;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setAnalise(null);
    setErro("");
  }

  async function analisar() {
    if (!fileRef.current) return;
    setLoading(true);
    setErro("");
    setAnalise(null);

    const fd = new FormData();
    fd.append("foto", fileRef.current);

    try {
      const res = await fetch("/api/vision/padrao", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro na análise.");
      } else {
        setAnalise(json.analise as Analise);
        setDisclaimer(json.disclaimer ?? "");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="bg-[#032135] px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-[#7db940] font-bold text-xl">PlugFácil</span>
          <span className="text-gray-500 text-sm">/</span>
          <span className="text-white text-sm">Análise do Padrão Elétrico</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#032135] mb-2">Seu local suporta um eletroposto?</h1>
          <p className="text-gray-500 text-sm">
            Envie uma foto do quadro elétrico (padrão de entrada) e nossa IA analisa se o local suporta
            um carregador AC 7,4kW ou DC 30kW.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Upload */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#4CAF50] transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            {preview ? (
              <img src={preview} alt="Padrão elétrico" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <>
                <p className="text-4xl mb-2">📸</p>
                <p className="text-sm font-medium text-gray-700">Clique ou arraste a foto aqui</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG · máximo 5MB</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {preview && (
            <button
              onClick={analisar}
              disabled={loading}
              className="w-full bg-[#032135] hover:bg-[#0a3352] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              {loading ? "Analisando com IA..." : "Analisar padrão elétrico"}
            </button>
          )}

          {erro && <p className="text-sm text-red-500 text-center">{erro}</p>}
        </div>

        {/* Resultado */}
        {analise && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Resultado da análise</h2>
              <ConfidencaBadge nivel={analise.confianca} />
            </div>

            {/* Compatibilidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">AC 7,4kW (carga lenta)</p>
                <Badge ok={analise.adequado_para_AC_7kW} />
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">DC 30kW (carga rápida)</p>
                <Badge ok={analise.adequado_para_DC_30kW} />
              </div>
            </div>

            {/* Dados técnicos */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Disjuntor geral</p>
                <p className="font-bold text-[#032135]">
                  {analise.disjuntor_geral_estimado_A ? `${analise.disjuntor_geral_estimado_A}A` : "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Tensão</p>
                <p className="font-bold text-[#032135] capitalize">{analise.tensao_estimada}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Capacidade</p>
                <p className="font-bold text-[#032135]">
                  {analise.capacidade_disponivel_kW ? `${analise.capacidade_disponivel_kW}kW` : "—"}
                </p>
              </div>
            </div>

            {/* Observações */}
            {analise.observacoes && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-1">Observações</p>
                <p className="text-sm text-blue-800">{analise.observacoes}</p>
              </div>
            )}

            {/* Alertas */}
            {analise.alertas?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-700 mb-2">Alertas</p>
                <ul className="space-y-1">
                  {analise.alertas.map((a, i) => (
                    <li key={i} className="text-sm text-red-700 flex gap-2">
                      <span>⚠️</span><span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="pt-2">
              <a
                href="/plano-de-negocio"
                className="block w-full text-center bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                Quero o Business Plan completo do meu endereço
              </a>
            </div>

            {disclaimer && (
              <p className="text-xs text-gray-400 text-center">{disclaimer}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
