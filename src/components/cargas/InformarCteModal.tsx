import React, { useState, useEffect, useRef } from 'react';
import { CargoTrip } from '../../types/logistics';
import { X, FileText, Truck, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cargo: CargoTrip | null;
  onConfirm: (ctNumber: string) => void;
}

export const InformarCteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cargo,
  onConfirm,
}) => {
  const [ctNumber, setCtNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cargo) {
      setCtNumber(cargo.ctNumber || '');
      setError(null);
      // Auto-focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [cargo, isOpen]);

  if (!isOpen || !cargo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ctNumber.trim();
    if (!trimmed) {
      setError('O preenchimento do número do CT-e é obrigatório para iniciar a viagem.');
      inputRef.current?.focus();
      return;
    }

    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-sky-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <Truck className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Iniciar Viagem · Informar CT-e
              </h3>
              <p className="text-xs text-sky-100/90 mt-0.5">
                O.C. Nº <strong className="font-mono text-white">{cargo.ocNumber}</strong>
                {cargo.pedidoCliente ? ` · Pedido: ${cargo.pedidoCliente}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Load Summary Card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Cliente Tomador:</span>
              <strong className="text-slate-800">{cargo.clientName}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Motorista / Cavalo:</span>
              <span className="font-semibold text-slate-800">
                {cargo.driverName || 'Não escalado'} · <span className="font-mono">{cargo.cavaloPlate}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Origem → Destino:</span>
              <span className="font-medium text-slate-700">
                {cargo.originCityState} → {cargo.destinationCityState}
              </span>
            </div>
          </div>

          {/* Validation Notice */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Para validar e avançar a carga para <strong>Em Trânsito</strong>, informe o número do Conhecimento de Transporte Eletrônico emitido. Este dado será gravado na <strong>Coluna AS (Nº CT-e)</strong> da planilha <strong>Cargas_OC</strong>.
            </p>
          </div>

          {/* CT-e Input Field */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Número do CT-e *
              </span>
              <span className="text-[11px] font-normal text-rose-600">Obrigatório</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                required
                value={ctNumber}
                onChange={(e) => {
                  setCtNumber(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: 104523 ou 000.104.523"
                className={`w-full text-sm font-mono font-bold bg-white border rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                  error
                    ? 'border-rose-400 ring-2 ring-rose-200 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
            </div>

            {error && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
          </div>

          {/* Footer Actions Fixo */}
          <div className="shrink-0 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
            >
              Confirmar e Iniciar Viagem
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
