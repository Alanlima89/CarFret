import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Truck,
  CheckCircle2,
  Clock,
  Calendar,
  Percent,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { CargoTrip } from '../../types/logistics';

interface Props {
  cargos: CargoTrip[];
}

type WeekRangeOption = 4 | 6 | 8 | 12;

interface WeekDataPoint {
  weekKey: string;
  weekLabel: string;
  fullLabel: string;
  startDate: Date;
  endDate: Date;
  active: number;
  completed: number;
  total: number;
  activeTons: number;
  completedTons: number;
  totalTons: number;
  completionRate: number;
}

/**
 * Parses diverse Brazilian and ISO date formats safely.
 */
function parseCargoDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Try Brazilian DD/MM/YYYY or DD/MM/YYYY HH:mm
  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{1,2}))?/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    const year = parseInt(brMatch[3], 10);
    const hour = brMatch[4] ? parseInt(brMatch[4], 10) : 0;
    const minute = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
    const d = new Date(year, month, day, hour, minute);
    if (!isNaN(d.getTime())) return d;
  }

  // Standard ISO / Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

/**
 * Returns the Monday (00:00:00) of the week for a given date.
 */
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Formats a Date object to Brazilian DD/MM string.
 */
function formatShortDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

export const TransportPerformanceWidget: React.FC<Props> = ({ cargos }) => {
  const [selectedWeeks, setSelectedWeeks] = useState<WeekRangeOption>(6);
  const [metricMode, setMetricMode] = useState<'count' | 'tons'>('count');

  // Compute weekly aggregation
  const weeklyData = useMemo<WeekDataPoint[]>(() => {
    // 1. Gather all reference dates from non-cancelled cargos
    const nonCancelled = cargos.filter((c) => c.cargoStatus !== 'cancelado');
    const validDates = nonCancelled
      .map((c) =>
        parseCargoDate(
          c.actualDeliveryDate ||
            c.actualLoadingDate ||
            c.scheduledLoadingDate ||
            c.createdAt
        )
      )
      .filter((d): d is Date => d !== null);

    // Anchor around latest date or today
    const now = new Date();
    const anchorDate =
      validDates.length > 0
        ? new Date(Math.max(...validDates.map((d) => d.getTime()), now.getTime()))
        : now;

    const anchorMonday = getMonday(anchorDate);

    // 2. Generate the consecutive week buckets backwards from anchor Monday
    const buckets: WeekDataPoint[] = [];
    for (let i = selectedWeeks - 1; i >= 0; i--) {
      const mon = new Date(anchorMonday);
      mon.setDate(anchorMonday.getDate() - i * 7);
      mon.setHours(0, 0, 0, 0);

      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(23, 59, 59, 999);

      const startFormatted = formatShortDate(mon);
      const endFormatted = formatShortDate(sun);
      const weekKey = mon.toISOString().slice(0, 10);

      buckets.push({
        weekKey,
        weekLabel: `${startFormatted} - ${endFormatted}`,
        fullLabel: `Semana de ${startFormatted} a ${endFormatted}/${sun.getFullYear()}`,
        startDate: mon,
        endDate: sun,
        active: 0,
        completed: 0,
        total: 0,
        activeTons: 0,
        completedTons: 0,
        totalTons: 0,
        completionRate: 0,
      });
    }

    // 3. Populate buckets with cargo data
    nonCancelled.forEach((cargo) => {
      // Pick best representative date
      const refDate = parseCargoDate(
        cargo.actualDeliveryDate ||
          cargo.actualLoadingDate ||
          cargo.scheduledLoadingDate ||
          cargo.createdAt
      );

      if (!refDate) return;

      const cargoTime = refDate.getTime();
      const bucket = buckets.find(
        (b) => cargoTime >= b.startDate.getTime() && cargoTime <= b.endDate.getTime()
      );

      if (bucket) {
        const tons = cargo.weightTons || 0;
        if (cargo.cargoStatus === 'finalizado') {
          bucket.completed += 1;
          bucket.completedTons += tons;
        } else {
          // Active load (aguardando_veiculo, aguardando_carregar, em_transito, aguardando_descarga)
          bucket.active += 1;
          bucket.activeTons += tons;
        }
      }
    });

    // 4. Compute totals and completion rates per week
    buckets.forEach((b) => {
      b.total = b.active + b.completed;
      b.totalTons = b.activeTons + b.completedTons;
      b.completionRate = b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
    });

    return buckets;
  }, [cargos, selectedWeeks]);

  // Overall period KPIs
  const periodSummary = useMemo(() => {
    const totalActive = weeklyData.reduce((acc, b) => acc + b.active, 0);
    const totalCompleted = weeklyData.reduce((acc, b) => acc + b.completed, 0);
    const totalCargos = totalActive + totalCompleted;
    const totalActiveTons = weeklyData.reduce((acc, b) => acc + b.activeTons, 0);
    const totalCompletedTons = weeklyData.reduce((acc, b) => acc + b.completedTons, 0);
    const totalTons = totalActiveTons + totalCompletedTons;
    const avgCompletionRate =
      totalCargos > 0 ? Math.round((totalCompleted / totalCargos) * 100) : 0;

    return {
      totalActive,
      totalCompleted,
      totalCargos,
      totalActiveTons,
      totalCompletedTons,
      totalTons,
      avgCompletionRate,
    };
  }, [weeklyData]);

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: WeekDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[210px] space-y-2.5 z-50">
          <div className="border-b border-slate-800 pb-1.5">
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {data.fullLabel}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Total movimentado: <span className="text-slate-200 font-semibold">{data.total} cargas</span> ({data.totalTons.toFixed(1)} t)
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block shadow-xs"></span>
                Cargas Ativas:
              </span>
              <span className="font-mono font-bold text-white">
                {data.active} {data.active === 1 ? 'carga' : 'cargas'}
                <span className="text-[10px] text-indigo-300 font-normal ml-1">
                  ({data.activeTons.toFixed(1)} t)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-xs"></span>
                Cargas Concluídas:
              </span>
              <span className="font-mono font-bold text-white">
                {data.completed} {data.completed === 1 ? 'carga' : 'cargas'}
                <span className="text-[10px] text-emerald-300 font-normal ml-1">
                  ({data.completedTons.toFixed(1)} t)
                </span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Eficiência de Conclusão:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {data.completionRate}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-slate-900 tracking-tight">
                Desempenho de Transporte
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Transport Performance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhamento semanal de cargas ativas (em escala, coleta e trânsito) vs. concluídas (entregues)
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {/* Mode Switch (Count vs Tons) */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => setMetricMode('count')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                metricMode === 'count'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Qtd Cargas
            </button>
            <button
              onClick={() => setMetricMode('tons')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                metricMode === 'tons'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toneladas (t)
            </button>
          </div>

          {/* Week Window Selector */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            {([4, 6, 8, 12] as WeekRangeOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setSelectedWeeks(option)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  selectedWeeks === option
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option} sem
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Ativas */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
              Cargas Ativas
            </span>
            <div className="text-xl font-black text-indigo-950">
              {metricMode === 'count'
                ? periodSummary.totalActive
                : `${periodSummary.totalActiveTons.toFixed(1)} t`}
            </div>
            <span className="text-[10px] text-indigo-600">
              Em escala, trânsito ou descarga
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        {/* Concluídas */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Cargas Concluídas
            </span>
            <div className="text-xl font-black text-emerald-950">
              {metricMode === 'count'
                ? periodSummary.totalCompleted
                : `${periodSummary.totalCompletedTons.toFixed(1)} t`}
            </div>
            <span className="text-[10px] text-emerald-600">
              Entregas finalizadas com sucesso
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Taxa de Eficiência */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Taxa de Conclusão
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {periodSummary.avgCompletionRate}%
            </div>
            <span className="text-[10px] text-slate-500">
              Percentual entregue no período
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-200/70 flex items-center justify-center text-slate-700">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        {/* Total Movimentado */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Volume no Período
            </span>
            <div className="text-xl font-black text-slate-900">
              {periodSummary.totalCargos} <span className="text-xs font-normal text-slate-500">cargas</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {periodSummary.totalTons.toFixed(1)} t total movimentado
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-200/70 flex items-center justify-center text-slate-700">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="w-full pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                allowDecimals={metricMode === 'tons'}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={renderCustomTooltip} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                formatter={(value: string) => (
                  <span className="text-slate-700 font-medium text-xs mr-2">{value}</span>
                )}
              />
              <Bar
                dataKey={metricMode === 'count' ? 'active' : 'activeTons'}
                name="Cargas Ativas"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
              <Bar
                dataKey={metricMode === 'count' ? 'completed' : 'completedTons'}
                name="Cargas Concluídas"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sub-footer Information Note */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            <strong>Critério:</strong> Cargas ativas incluem <em>A Fretar</em>, <em>Aguardando Coleta</em>, <em>Em Trânsito</em> e <em>Aguardando Descarga</em>. Cargas concluídas são aquelas com entrega finalizada no período.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap self-end sm:self-auto">
          Janela: {selectedWeeks} semanas consecutivas
        </div>
      </div>
    </div>
  );
};
