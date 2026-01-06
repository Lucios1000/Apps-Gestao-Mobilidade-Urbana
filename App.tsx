import React, { useMemo } from 'react';
import Layout from './components/Layout';
import { useViability } from './hooks/useViability';
import { ScenarioType, MonthlyResult } from './types';
import { FRANCA_STATS } from './constants';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

const formatCurrency = (value?: number) =>
  typeof value === 'number'
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '—';

const formatNumber = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString('pt-BR') : '—';

const formatPercent = (value?: number, digits = 1) =>
  typeof value === 'number' ? `${value.toFixed(digits)}%` : '—';

const SCENARIO_LABEL: Record<ScenarioType, string> = {
  [ScenarioType.REALISTA]: 'Realista',
  [ScenarioType.PESSIMISTA]: 'Pessimista',
  [ScenarioType.OTIMISTA]: 'Otimista',
};

const PARAM_SLIDERS: Array<{
  key: keyof MonthlyResult | string;
  label: string;
  paramKey: keyof ReturnType<typeof useViability>['currentParams'];
  min: number;
  max: number;
  step: number;
  unit?: string;
}> = [
  { key: 'activeDrivers', label: 'Frota Inicial', paramKey: 'activeDrivers', min: 0, max: 500, step: 1, unit: ' condutores' },
  { key: 'driverAdditionMonthly', label: 'Adição Mensal de Frota', paramKey: 'driverAdditionMonthly', min: 0, max: 100, step: 1, unit: ' condutores' },
  { key: 'avgFare', label: 'Tarifa Média (R$)', paramKey: 'avgFare', min: 10, max: 50, step: 0.5 },
  { key: 'ridesPerUserMonth', label: 'Corridas por Usuário/mês', paramKey: 'ridesPerUserMonth', min: 1, max: 10, step: 0.1 },
  { key: 'userGrowth', label: 'Crescimento de Usuários (%)', paramKey: 'userGrowth', min: 0, max: 30, step: 1, unit: '%' },
  { key: 'fixedCosts', label: 'Custos Fixos (R$)', paramKey: 'fixedCosts', min: 0, max: 20000, step: 100 },
];

const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    scenario,
    setScenario,
    currentParams,
    projections,
    audits,
    filteredDreResults,
    updateCurrentParam,
    resetParams,
    supplyBottleneck,
    oversupplyWarning,
    paramsMap,
    calculateProjections,
  } = useViability();

  const currentMonth = projections[0];
  const lastMonth = projections[projections.length - 1];

  const summary = useMemo(() => {
    const gross = currentMonth?.grossRevenue ?? 0;
    const net = currentMonth?.netProfit ?? 0;
    const margin = currentMonth?.margin ?? 0;
    const drivers = currentMonth?.drivers ?? currentParams.activeDrivers;
    const users = currentMonth?.users ?? 0;
    return { gross, net, margin, drivers, users };
  }, [currentMonth, currentParams.activeDrivers]);

  const renderScenarioSelector = () => (
    <div className="flex flex-wrap gap-2">
      {Object.values(ScenarioType).map((sc) => (
        <button
          key={sc}
          type="button"
          onClick={() => setScenario(sc)}
          className={`px-3 py-1 rounded-md text-xs font-black uppercase border transition-colors ${
            scenario === sc ? 'bg-yellow-500 text-slate-950 border-yellow-400' : 'border-slate-700 text-slate-200'
          }`}
        >
          {SCENARIO_LABEL[sc]}
        </button>
      ))}
      <button
        type="button"
        onClick={resetParams}
        className="px-3 py-1 rounded-md text-xs font-black uppercase border border-slate-700 text-slate-200 hover:text-white"
      >
        Resetar parâmetros
      </button>
    </div>
  );

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[{
        label: 'Receita Bruta (Mês 1)',
        value: formatCurrency(summary.gross),
        accent: 'text-yellow-400',
      }, {
        label: 'Lucro Líquido (Mês 1)',
        value: formatCurrency(summary.net),
        accent: summary.net >= 0 ? 'text-green-400' : 'text-red-400',
      }, {
        label: 'Margem (Mês 1)',
        value: formatPercent(summary.margin),
        accent: summary.margin >= 0 ? 'text-green-400' : 'text-red-400',
      }, {
        label: 'Frota / Usuários',
        value: `${formatNumber(summary.drivers)} / ${formatNumber(summary.users)}`,
        accent: 'text-white',
      }].map((card) => (
        <div key={card.label} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="text-[10px] uppercase text-slate-400 font-black tracking-widest">{card.label}</div>
          <div className={`text-2xl font-black mt-2 ${card.accent}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );

  const renderParams = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-black uppercase text-yellow-500">Parâmetros principais</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PARAM_SLIDERS.map((p) => (
          <div key={p.key} className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-black text-slate-400">
              <span>{p.label}</span>
              <span className="text-yellow-400 text-sm">{(currentParams as any)[p.paramKey]}{p.unit ?? ''}</span>
            </div>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={(currentParams as any)[p.paramKey]}
              onChange={(e) => updateCurrentParam(p.paramKey as any, Number(e.target.value))}
              className="w-full accent-yellow-500"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderBench = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-black uppercase text-yellow-500">Benchmark / Market Share</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 font-black mb-2">Participação de Mercado</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={FRANCA_STATS.marketPlayers}>
              <CartesianGrid vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', fontSize: 10 }} />
              <Bar dataKey="share" fill="#EAB308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 font-black mb-2">Ticket Médio (R$)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={FRANCA_STATS.marketPlayers}>
              <CartesianGrid vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', fontSize: 10 }} />
              <Line type="monotone" dataKey="ticket" stroke="#38bdf8" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderMarketing = () => {
    const data = [
      { name: 'Marketing', value: currentParams.marketingMonthly },
      { name: 'Tech', value: currentParams.techMonthly },
      { name: 'Adesão Turbo', value: currentParams.adesaoTurbo },
      { name: 'Tráfego Pago', value: currentParams.trafegoPago },
      { name: 'Parcerias', value: currentParams.parceriasBares },
      { name: 'Indique/Ganhe', value: currentParams.indiqueGanhe },
    ];
    const colors = ['#EAB308', '#64748b', '#22c55e', '#f97316', '#a78bfa', '#14b8a6'];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 font-black mb-4">Distribuição de Verba</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3}>
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 font-black mb-2">Custos Mensais</div>
          <div className="grid grid-cols-2 gap-4 text-slate-200">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Fixos</div>
              <div className="text-xl font-black">{formatCurrency(currentParams.fixedCosts)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Tecnologia</div>
              <div className="text-xl font-black">{formatCurrency(currentParams.techMonthly)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Marketing</div>
              <div className="text-xl font-black">{formatCurrency(currentParams.marketingMonthly)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Campanhas</div>
              <div className="text-xl font-black">{formatCurrency(currentParams.adesaoTurbo + currentParams.trafegoPago + currentParams.parceriasBares + currentParams.indiqueGanhe)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDrivers = () => {
    const rows = projections.slice(0, 12).map((r) => {
      const target = Math.max(50, Math.round(r.users / 200));
      const cov = r.users > 0 ? (r.drivers * 200) / r.users : 0;
      const gap = r.drivers - target;
      return { ...r, target, cov, gap };
    });
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-yellow-500">Gestão de Frota e Cobertura</h3>
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
          <table className="w-full text-[12px] text-slate-200">
            <thead className="bg-slate-800 text-[11px] uppercase text-slate-400">
              <tr>
                <th className="p-3 text-left">Mês</th>
                <th className="p-3 text-center">Frota</th>
                <th className="p-3 text-center">Alvo</th>
                <th className="p-3 text-center">GAP</th>
                <th className="p-3 text-right">Cobertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r) => (
                <tr key={r.month}>
                  <td className="p-3 font-bold">Mês {r.month}</td>
                  <td className="p-3 text-center">{r.drivers}</td>
                  <td className="p-3 text-center text-slate-400">{r.target}</td>
                  <td className={`p-3 text-center font-black ${r.gap >= 0 ? 'text-green-400' : 'text-red-400'}`}>{r.gap > 0 ? `+${r.gap}` : r.gap}</td>
                  <td className="p-3 text-right">{r.cov.toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProjecoes = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-black uppercase text-yellow-500">Projeções de Volume</h3>
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={projections}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" stroke="#475569" fontSize={10} />
            <YAxis yAxisId="left" stroke="#475569" fontSize={10} />
            <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="rides" name="Corridas" fill="#EAB308" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="drivers" name="Frota" stroke="#64748b" strokeWidth={3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderKpis = () => {
    const last = projections[projections.length - 1];
    const ratio = (last?.ltv || 0) / ((last?.cac || 1));
    return (
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase text-yellow-500">KPIs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">LTV</div>
            <div className="text-2xl font-black text-green-400">{formatCurrency(last?.ltv)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">CAC</div>
            <div className="text-2xl font-black text-yellow-400">{formatCurrency(last?.cac)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">LTV/CAC</div>
            <div className="text-2xl font-black {ratio>=3?'text-green-400':'text-white'}">{ratio.toFixed(1)}x</div>
          </div>
        </div>
      </div>
    );
  };

  const renderCenarios = () => {
    const scenariosData = Object.values(ScenarioType).map((t) => {
      const proj = calculateProjections(paramsMap[t], t as ScenarioType);
      const last = proj[proj.length - 1];
      const totalProfit = proj.reduce((a, b) => a + b.netProfit, 0);
      const breakEvenIdx = proj.findIndex((r) => r.netProfit > 0);
      const paybackIdx = proj.findIndex((r) => r.accumulatedProfit > 0);
      return { type: t as ScenarioType, totalProfit, breakEvenIdx, paybackIdx, share: (last.users / FRANCA_STATS.digitalUsers) * 100 };
    });
    return (
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase text-yellow-500">Comparação de Cenários</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenariosData.map((s) => (
            <div key={s.type} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[10px] uppercase text-slate-400 font-black">{SCENARIO_LABEL[s.type]}</div>
              <div className={`text-xl font-black ${s.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>Lucro 36m: {formatCurrency(s.totalProfit)}</div>
              <div className="text-sm text-slate-300">Break-even: {s.breakEvenIdx !== -1 ? `Mês ${s.breakEvenIdx + 1}` : '—'}</div>
              <div className="text-sm text-slate-300">Payback: {s.paybackIdx !== -1 ? `Mês ${s.paybackIdx + 1}` : '—'}</div>
              <div className="text-sm text-slate-300">Share M36: {s.share.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={Array.from({ length: 36 }, (_, i) => ({
                month: i + 1,
                Realista: calculateProjections(paramsMap[ScenarioType.REALISTA], ScenarioType.REALISTA)[i].accumulatedProfit,
                Pessimista: calculateProjections(paramsMap[ScenarioType.PESSIMISTA], ScenarioType.PESSIMISTA)[i].accumulatedProfit,
                Otimista: calculateProjections(paramsMap[ScenarioType.OTIMISTA], ScenarioType.OTIMISTA)[i].accumulatedProfit,
              }))}
            >
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="Realista" stroke="#22c55e" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Pessimista" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="Otimista" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderVisao36m = () => {
    const results = projections;
    const breakEvenIndex = results.findIndex((r) => r.netProfit > 0);
    const paybackIndex = results.findIndex((r) => r.accumulatedProfit > 0);
    const totalRides36 = results.reduce((acc, curr) => acc + curr.rides, 0);
    const totalGMV36 = results.reduce((acc, curr) => acc + curr.grossRevenue, 0);
    const totalProfit36 = results.reduce((acc, curr) => acc + curr.netProfit, 0);
    return (
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase text-yellow-500">Visão 36 meses</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">Break-even</div>
            <div className="text-2xl font-black text-white">{breakEvenIndex !== -1 ? `Mês ${results[breakEvenIndex].month}` : 'Não atingido'}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">Payback</div>
            <div className="text-2xl font-black text-white">{paybackIndex !== -1 ? `Mês ${results[paybackIndex].month}` : '> 36m'}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">Lucro Acumulado</div>
            <div className={`text-2xl font-black ${totalProfit36 >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(totalProfit36)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">GMV Total</div>
            <div className="text-xl font-black text-white">{formatCurrency(totalGMV36)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">Corridas Totais</div>
            <div className="text-xl font-black text-white">{formatNumber(totalRides36)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderDre = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase text-yellow-500">DRE resumido (mensal)</h3>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-slate-200">
          <thead className="bg-slate-800 text-[11px] uppercase text-slate-400">
            <tr>
              <th className="p-3 text-left">Mês</th>
              <th className="p-3 text-right">Receita</th>
              <th className="p-3 text-right">Lucro Líquido</th>
              <th className="p-3 text-right">Margem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {(filteredDreResults || []).slice(0, 12).map((row) => (
              <tr key={row.month}>
                <td className="p-3 font-bold">Mês {row.month}</td>
                <td className="p-3 text-right">{formatCurrency(row.grossRevenue)}</td>
                <td className={`p-3 text-right ${row.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(row.netProfit)}</td>
                <td className={`p-3 text-right ${row.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatPercent(row.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAudits = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase text-yellow-500">Resumo anual</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {audits.map((audit) => (
          <div key={audit.year} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-black">Ano {audit.year}</div>
            <div className="text-lg font-black text-white mt-1">GMV: {formatCurrency(audit.totalGMV)}</div>
            <div className="text-sm text-slate-300">Receita: {formatCurrency(audit.totalRevenue)}</div>
            <div className="text-sm text-slate-300">Lucro Líquido: {formatCurrency(audit.totalNetProfit)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMarket = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase text-yellow-500">Mercado (Franca)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 font-black">População</div>
          <div className="text-2xl font-black text-white">{formatNumber(FRANCA_STATS.population)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 font-black">Usuários Digitais (SAM)</div>
          <div className="text-2xl font-black text-white">{formatNumber(FRANCA_STATS.digitalUsers)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 font-black">Meta de Market Share</div>
          <div className="text-2xl font-black text-yellow-400">{formatPercent(FRANCA_STATS.marketShareTarget)}</div>
        </div>
      </div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="space-y-6">
            {renderSummaryCards()}
            {renderMarket()}
          </div>
        );
      case 1:
        return renderBench();
      case 2:
        return renderMarketing();
      case 3:
        return renderParams();
      case 4:
        return renderDrivers();
      case 5:
        return renderProjecoes();
      case 6:
        return renderVisao36m();
      case 7:
        return renderDre();
      case 8:
        return renderKpis();
      case 9:
        return renderCenarios();
      case 10:
        return (
          <div className="space-y-6">
            {renderSummaryCards()}
            {renderAudits()}
          </div>
        );
      case 11:
        return (
          <div className="space-y-6">
            {renderAudits()}
            {renderKpis()}
          </div>
        );
      default:
        return (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-slate-200">
            <p className="text-sm font-medium">Conteúdo desta aba ainda não foi reescrito. Use as abas de visão geral para acompanhar os números principais.</p>
          </div>
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black">TKX Franca — Dashboard</h1>
            <p className="text-slate-400 text-sm">Cenário atual: {SCENARIO_LABEL[scenario]}</p>
          </div>
          {renderScenarioSelector()}
        </div>

        {(supplyBottleneck || oversupplyWarning) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {supplyBottleneck && (
              <div className="bg-red-600/20 border border-red-500/40 text-red-100 px-4 py-3 rounded-lg text-sm font-bold">
                Gargalo de atendimento detectado — aumente frota ou reduza CAC para melhorar cobertura.
              </div>
            )}
            {oversupplyWarning && (
              <div className="bg-orange-600/20 border border-orange-500/40 text-orange-100 px-4 py-3 rounded-lg text-sm font-bold">
                Excesso de oferta de motoristas — ajuste crescimento ou acelere aquisição de usuários.
              </div>
            )}
          </div>
        )}

        {renderTab()}

        {lastMonth && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-slate-200 text-sm">
            <div className="font-black uppercase text-[10px] text-slate-400">Visão 36 meses (resumo)</div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <div className="text-[11px] text-slate-400">Frota final</div>
                <div className="text-lg font-black">{formatNumber(lastMonth.drivers)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Usuários finais</div>
                <div className="text-lg font-black">{formatNumber(lastMonth.users)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Receita total</div>
                <div className="text-lg font-black">{formatCurrency(projections.reduce((acc, r) => acc + r.grossRevenue, 0))}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Lucro acumulado</div>
                <div className={`text-lg font-black ${lastMonth.accumulatedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(lastMonth.accumulatedProfit)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;

