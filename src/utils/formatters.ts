export const formatBRL = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

/**
 * Formata strings ou números de CPF (11 dígitos) e CNPJ (14 dígitos),
 * tratando valores numéricos ou strings sem pontuação vindos de planilhas.
 */
export const formatCpfCnpj = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value).trim();
  if (!str) return '';

  // Se já possui formatação padrão (pontos, traços, barras), retorna limpo
  if (/[./\-]/.test(str)) {
    return str;
  }

  const digits = str.replace(/\D/g, '');
  if (!digits) return str;

  // CPF (11 dígitos, ou até 11 com zeros à esquerda)
  if (digits.length <= 11) {
    const padded = digits.padStart(11, '0');
    return padded.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  // CNPJ (14 dígitos, ou até 14 com zeros à esquerda)
  if (digits.length <= 14) {
    const padded = digits.padStart(14, '0');
    return padded.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  return str;
};

export const getCargoStatusLabel = (status: string): { label: string; color: string; bg: string } => {
  switch (status) {
    case 'aguardando_veiculo':
    case 'a_fretar':
      return {
        label: 'Aguardando Veículo (A Fretar)',
        color: 'text-violet-700 dark:text-violet-300',
        bg: 'bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-800',
      };
    case 'aguardando_carregar':
      return {
        label: 'Aguardando Carregar',
        color: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
      };
    case 'em_transito':
      return {
        label: 'Em Trânsito',
        color: 'text-sky-700 dark:text-sky-300',
        bg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800',
      };
    case 'aguardando_descarga':
      return {
        label: 'Aguardando Descarga',
        color: 'text-indigo-700 dark:text-indigo-300',
        bg: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800',
      };
    case 'finalizado':
      return {
        label: 'Finalizado / Entregue',
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
      };
    case 'cancelado':
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        color: 'text-red-700 dark:text-red-300',
        bg: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900',
      };
    default:
      return {
        label: status,
        color: 'text-slate-700 dark:text-slate-300',
        bg: 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800',
      };
  }
};

export const getOCStatusLabel = (status: string): { label: string; color: string } => {
  switch (status) {
    case 'gerada':
      return { label: 'O.C. Gerada', color: 'text-slate-600' };
    case 'enviada_motorista':
      return { label: 'Enviada ao Motorista', color: 'text-indigo-600' };
    case 'em_carregamento':
      return { label: 'Em Carregamento', color: 'text-amber-600' };
    case 'carregado':
      return { label: 'Carregado', color: 'text-emerald-600' };
    default:
      return { label: status, color: 'text-slate-600' };
  }
};

export const cleanPhoneForWhatsApp = (phone: string | number | undefined | null): string => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
};

/**
 * Converte qualquer valor de peso (seja armazenado em toneladas ou quilos) para KG numérico.
 * Se o valor for <= 150 (ex: 37, 45.5), considera como toneladas e converte para KG (* 1000).
 * Se for > 150 (ex: 37000), já está em KG.
 */
export const getWeightInKg = (weight: number | undefined | null): number => {
  if (weight === undefined || weight === null || isNaN(weight)) return 0;
  const num = Number(weight);
  if (num <= 0) return 0;
  if (num <= 150) return Math.round(num * 1000);
  return Math.round(num);
};

/**
 * Converte qualquer valor de peso para toneladas numéricas (ex: 37000 kg -> 37 t).
 */
export const getWeightInTons = (weight: number | undefined | null): number => {
  if (weight === undefined || weight === null || isNaN(weight)) return 0;
  const num = Number(weight);
  if (num <= 0) return 0;
  if (num <= 150) return num;
  return Number((num / 1000).toFixed(3));
};

/**
 * Formata o peso no padrão oficial brasileiro em KG com separador de milhar.
 * Ex: 37000 ou 37 -> "37.000 KG"
 */
export const formatWeightKg = (weight: number | undefined | null): string => {
  const kg = getWeightInKg(weight);
  return `${kg.toLocaleString('pt-BR')} KG`;
};

/**
 * Formata o peso em Toneladas para referência secundária.
 * Ex: 37 ou 37000 -> "37,00 TON"
 */
export const formatWeightTons = (weight: number | undefined | null): string => {
  const tons = getWeightInTons(weight);
  return `${tons.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} TON`;
};

/**
 * Extrai o sequencial numérico de uma Ordem de Carregamento (O.C.).
 * Procura os dígitos após o hífen na série OC-YYYY-XXXX (ex: OC-2026-0015 -> 15).
 * Se targetYear for informado, filtra para garantir que pertença àquele ano.
 */
export const extractOcNumberSequence = (
  ocStr: string | undefined | null,
  targetYear?: number
): number => {
  if (!ocStr || typeof ocStr !== 'string') return 0;
  const clean = ocStr.trim();
  if (!clean) return 0;

  // 1. Formato padrão: OC-YYYY-XXXX (ex: OC-2026-0045)
  const standardMatch = clean.match(/OC-(\d{4})-(\d+)/i);
  if (standardMatch) {
    const year = parseInt(standardMatch[1], 10);
    const seq = parseInt(standardMatch[2], 10);
    if (!isNaN(seq) && seq > 0) {
      if (targetYear !== undefined) {
        if (year === targetYear) return seq;
      } else {
        return seq;
      }
    }
  }

  // 2. Se targetYear foi informado, verifica padrão alternativo YYYY-XXXX
  if (targetYear !== undefined) {
    const yearRegex = new RegExp(`(?:OC-)?${targetYear}-(\\d+)`, 'i');
    const yearMatch = clean.match(yearRegex);
    if (yearMatch) {
      const seq = parseInt(yearMatch[1], 10);
      if (!isNaN(seq) && seq > 0) return seq;
    }
  }

  // 3. Fallback: extrai números após o último hífen (ex: OC-0045 ou CARGA-0045)
  if (clean.includes('-')) {
    const parts = clean.split('-');
    const lastPart = parts[parts.length - 1].trim();
    const num = parseInt(lastPart, 10);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }

  return 0;
};

/**
 * Vasculha todos os registros existentes de cargas e encontra sempre o maior número atual (MAX)
 * da série OC-YYYY-XXXX para o ano desejado (padrão: ano corrente).
 */
export const getMaxOcSequence = (
  cargos: Array<{ ocNumber?: string }>,
  targetYear = new Date().getFullYear()
): number => {
  if (!Array.isArray(cargos) || cargos.length === 0) return 0;

  let maxSeq = 0;
  for (const cargo of cargos) {
    if (!cargo || !cargo.ocNumber) continue;
    const seq = extractOcNumberSequence(cargo.ocNumber, targetYear);
    if (seq > maxSeq) {
      maxSeq = seq;
    }
  }
  return maxSeq;
};

/**
 * Calcula o próximo número da O.C. vasculhando todos os registros existentes
 * e encontrando o maior número atual (MAX) da série OC-2026-XXXX e somando +1.
 * Formato garantido: OC-2026-XXXX (com preenchimento de 4 ou mais dígitos).
 * Garante unicidade absoluta sem risco de duplicatas por deleção ou ordenação.
 */
export const generateNextOcNumber = (
  cargos: Array<{ ocNumber?: string }>,
  targetYear = new Date().getFullYear(),
  offset = 0
): string => {
  const maxSeq = getMaxOcSequence(cargos, targetYear);
  const nextSeq = maxSeq + 1 + offset;
  const padded = String(nextSeq).padStart(4, '0');
  return `OC-${targetYear}-${padded}`;
};

/**
 * Extrai apenas a parte da data no formato canônico YYYY-MM-DD (ano, mês e dia),
 * ignorando completamente horários, minutos, segundos e fusos horários.
 * Suporta formatos:
 * - DD/MM/AAAA ou DD/MM/AAAA HH:mm(:ss) (Google Sheets / BR)
 * - YYYY-MM-DD ou YYYY-MM-DDTHH:mm(:ss) (ISO / formulários)
 * - Strings com separadores '/', '-' ou Date objects.
 */
export const extractCleanDateISO = (value: string | Date | null | undefined): string => {
  if (!value) return '';

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  // 1. Formato Brasileiro: DD/MM/YYYY ou DD-MM-YYYY (com ou sem horário posterior)
  // Ex: "10/11/2026", "10/11/2026 14:30", "10/11/2026 14:30:00"
  const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 2. Formato ISO / Americano: YYYY-MM-DD ou YYYY/MM/DD (com ou sem 'T' ou espaço e horário posterior)
  // Ex: "2026-11-10", "2026-11-10T05:47:31", "2026-11-10 14:30"
  const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. Fallback: tentar new Date(trimmed)
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch {
    // ignore
  }

  return '';
};



