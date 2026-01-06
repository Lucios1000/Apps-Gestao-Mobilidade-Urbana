
import React from 'react';
import { ScenarioType, MonthlyResult } from './types';
import { FRANCA_STATS } from './constants';
import Layout from './components/Layout';
import { useViability } from './hooks/useViability';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, Legend, Cell, PieChart, Pie,
  ScatterChart, Scatter, ZAxis, ComposedChart, ReferenceLine, LabelList
} from 'recharts';
import { 
  TrendingUp, Users, Target, UserCheck, Wallet, Zap, Clock, Sliders, 
  FileText, Landmark, Info, Megaphone, AlertTriangle, Star, Coins, 
  Map as MapIcon, ToggleRight, ToggleLeft, ArrowUpRight, ArrowDownRight, Briefcase, Activity, ShieldCheck, Award, Calculator, Hourglass, BarChart2, Repeat, CheckCircle, XCircle, Search, ThumbsUp, ThumbsDown
} from 'lucide-react';

const PLAYER_COLORS: Record<string, string> = {
  'TKX Franca': '#EAB308',
  'Uber': '#64748b',
  '99': '#f97316',
  'Maxim': '#ef4444',
  'Garupa': '#8b5cf6',
  'Urban 66': '#22c55e'
};

const SCENARIO_COLORS: Record<string, string> = {
  [ScenarioType.REALISTA]: '#EAB308', // Amarelo
  [ScenarioType.PESSIMISTA]: '#ef4444', // Vermelho
  [ScenarioType.OTIMISTA]: '#22c55e'  // Verde
};

const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    scenario,
    setScenario,
    dreYear,
    setDreYear,
    paramsMap,
    currentParams,
    projections: results, // Alias para manter compatibilidade com código de UI anterior
    audits,
    filteredDreResults,
    supplyBottleneck,
    oversupplyWarning,
    updateParam,
    updateCurrentParam,
    lastResult,
    totalMarketingInvest,
    calculateProjections
  } = useViability();

  const getCoverage = (drivers: number, users: number) => users > 0 ? (drivers * 200) / users : 0;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;

  const getStatusMetadata = (val: number) => {
    if (val < 0.8) return { label: "Gargalo Crítico", color: "text-red-500", bg: "bg-red-500/10" };
    if (val <= 1.2) return { label: "Operação Ideal", color: "text-green-400", bg: "bg-green-400/10" };
    if (val <= 3.0) return { label: "Estável", color: "text-yellow-400", bg: "bg-yellow-400/10" };
    return { label: "Excesso / Ociosidade", color: "text-orange-400", bg: "bg-orange-400/10" };
  };

  const handleExportPDF = () => {
    const element = document.getElementById('report-container');
    if (!element) return alert("Elemento de relatório não encontrado.");

    // @ts-ignore
    const html2pdf = window.html2pdf;
    if (!html2pdf) return alert("Biblioteca html2pdf.js não disponível.");

    const opt = {
      margin: 10,
      filename: 'TKX_Franca_Projecao.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#020617' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleExportExcel = () => {
    const BOM = "\uFEFF";
    const headers = ["Mes", "Ano", "Drivers", "Users", "Rides", "GMV", "Rec_TKX", "Lucro", "Acumulado"];
    const rows = results.map(r => [
      r.month, r.year, r.drivers, r.users, r.rides, 
      r.grossRevenue.toFixed(2).replace('.', ','), 
      r.takeRateRevenue.toFixed(2).replace('.', ','), 
      r.netProfit.toFixed(2).replace('.', ','), 
      r.accumulatedProfit.toFixed(2).replace('.', ',')
    ]);
    const csvContent = BOM + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TKX_FRANCA_PROJECAO.csv`;
    link.click();
  };

  const renderMetricCard = (title: string, value: string | number, sub: string, icon: React.ReactNode, variant: 'pos' | 'neg' | 'neu' = 'neu') => (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-slate-700 transition-all group">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{title}</span>
        <div className="text-yellow-500 group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      <div className={`text-2xl font-black ${variant === 'pos' ? 'text-green-400' : variant === 'neg' ? 'text-red-400' : 'text-white'}`}>{value}</div>
      <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">{sub}</div>
    </div>
  );

  const renderComparisonBlock = (title: string, months: number[]) => (
    <div className="space-y-4">
      <h5 className="text-[11px] font-black text-yellow-500 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
        <Clock size={16}/> {title}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {months.map((mIndex, i) => {
          const current = results[mIndex - 1]; // Array is 0-indexed, month is 1-indexed
          if (!current) return null;

          const prevIndex = months[i - 1];
          const prev = prevIndex ? results[prevIndex - 1] : null;

          const calcGrowth = (curr: number, past: number) => past > 0 ? ((curr - past) / past) * 100 : 0;
          
          const totalCosts = current.fixedCosts + current.variableCosts + current.marketing + current.tech;

          return (
            <div key={mIndex} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-yellow-500/50 transition-colors relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 bg-slate-950 rounded-bl-xl border-l border-b border-slate-800 text-[10px] font-black text-slate-400">
                 MÊS {current.month} ({current.year})
               </div>

               <div className="mt-4 space-y-4">
                  {/* Frota e Usuários */}
                  <div className="grid grid-cols-2 gap-2 border-b border-slate-800/50 pb-3">
                     <div>
                        <div className="text-[9px] text-slate-500 uppercase font-bold">Frota Real</div>
                        <div className="text-sm font-black text-white flex items-center gap-1">
                           {current.drivers}
                           {prev && (
                              <span className={`text-[8px] ${calcGrowth(current.drivers, prev.drivers) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                 {formatPercent(calcGrowth(current.drivers, prev.drivers))}
                              </span>
                           )}
                        </div>
                     </div>
                     <div>
                        <div className="text-[9px] text-slate-500 uppercase font-bold">Usuários</div>
                        <div className="text-sm font-black text-white flex items-center gap-1">
                           {(current.users / 1000).toFixed(1)}k
                           {prev && (
                              <span className={`text-[8px] ${calcGrowth(current.users, prev.users) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                 {formatPercent(calcGrowth(current.users, prev.users))}
                              </span>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Financeiro Macro */}
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 uppercase">GMV (Bruto)</span>
                        <span className="text-xs font-bold text-white">{formatCurrency(current.grossRevenue)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] text-yellow-500 uppercase font-bold">Receita TKX</span>
                        <div className="text-right">
                           <div className="text-xs font-black text-yellow-500">{formatCurrency(current.takeRateRevenue)}</div>
                           {prev && <div className="text-[8px] text-green-400">{formatPercent(calcGrowth(current.takeRateRevenue, prev.takeRateRevenue))} vs anterior</div>}
                        </div>
                     </div>
                  </div>

                  {/* Custos e Impostos */}
                  <div className="bg-slate-950/50 p-2 rounded-lg space-y-1">
                     <div className="flex justify-between text-[9px]">
                        <span className="text-red-400/80">(-) Impostos</span>
                        <span className="text-red-400/80">{formatCurrency(current.taxes)}</span>
                     </div>
                     <div className="flex justify-between text-[9px]">
                        <span className="text-red-400/80">(-) Custos Operacionais</span>
                        <span className="text-red-400/80">{formatCurrency(totalCosts)}</span>
                     </div>
                  </div>

                  {/* Resultado Final */}
                  <div className="pt-2 border-t border-slate-800">
                     <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                           <span className="text-[9px] text-slate-500 uppercase font-black">Lucro Líquido</span>
                           <span className={`text-lg font-black ${current.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(current.netProfit)}
                           </span>
                        </div>
                        {prev && (
                           <div className={`flex items-center text-[9px] font-black px-2 py-1 rounded bg-slate-800 ${calcGrowth(current.netProfit, prev.netProfit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {calcGrowth(current.netProfit, prev.netProfit) >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                              {formatPercent(calcGrowth(current.netProfit, prev.netProfit))}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel}>
      <div id="report-container" className="space-y-6 pb-20">
        
        {/* HEADER DE STATUS DINÂMICO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {Object.values(ScenarioType).map(t => (
              <button key={t} onClick={() => setScenario(t)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${scenario === t ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
             {/* INVESTIMENTO TOTAL CARD */}
             <div className="bg-slate-900/80 border border-slate-800 px-4 py-1.5 rounded-xl flex items-center gap-3 backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">Investimento MKT</span>
                  <span className="text-[11px] font-black text-white">{formatCurrency(totalMarketingInvest)}</span>
                </div>
                <div className="w-px h-6 bg-slate-800"></div>
                <Megaphone size={14} className="text-yellow-500" />
             </div>

             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase">Manutenção Ativa</span>
               <button onClick={() => updateCurrentParam('isMaintenanceActive', !currentParams.isMaintenanceActive)} className={`p-1 rounded-full transition-all ${currentParams.isMaintenanceActive ? 'text-green-400' : 'text-slate-600'}`}>
                  {currentParams.isMaintenanceActive ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
               </button>
             </div>
          </div>
        </div>

        {/* --- ABA 0: CALOR / DEMANDA --- */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
             <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2"><MapIcon size={18}/> Zonas de Calor e Demanda Franca-SP</h5>
                <div className="space-y-5">
                   {[
                     { area: 'Centro / Estação', demand: 'Crítico', peak: '12h-14h / 18h-19h', color: 'bg-red-500', val: 95 },
                     { area: 'Leporace / Brasilândia', demand: 'Alto', peak: '06h-08h / 17h-19h', color: 'bg-orange-500', val: 82 },
                     { area: 'City Petrópolis / Aeroporto', demand: 'Médio', peak: '07h-09h / Finais de Semana', color: 'bg-yellow-500', val: 68 },
                     { area: 'Distrito Industrial', demand: 'Focal', peak: '05h-06h / 14h-15h / 22h-23h', color: 'bg-blue-500', val: 55 },
                   ].map(zona => (
                     <div key={zona.area} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                           <div className="text-[10px] font-black text-white uppercase">{zona.area}</div>
                           <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">Status: {zona.demand} | Pico: {zona.peak}</div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${zona.color}`} style={{ width: `${zona.val}%` }}></div>
                           </div>
                           <span className="text-[10px] font-black text-slate-400">{zona.val}%</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6">Benchmarks Tickets Locais</h5>
                <div className="space-y-3">
                   {FRANCA_STATS.marketPlayers.map(p => (
                     <div key={p.name} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: PLAYER_COLORS[p.name]}}></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{p.name}</span>
                        </div>
                        <span className="text-xs font-black text-white">R$ {p.ticket.toFixed(2)}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* --- ABA 1: BENCH / MARKET SHARE --- */}
        {activeTab === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
             
             {/* NOVO GRÁFICO: ANÁLISE COMPETITIVA */}
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[400px]">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2">
                   <Briefcase size={18}/> Análise Competitiva: Share vs Satisfação
                </h5>
                <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={FRANCA_STATS.marketPlayers} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" />
                      <YAxis yAxisId="left" stroke="#475569" fontSize={9} label={{ value: 'Market Share (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={9} domain={[0, 5]} label={{ value: 'Satisfação (1-5)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 9 }} />
                      <Tooltip 
                         contentStyle={{backgroundColor: '#020617', border: 'none', fontSize: '11px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                         formatter={(value, name, props) => {
                            if (name === 'Market Share') return [`${value}%`, name];
                            if (name === 'Satisfação') return [`${value} ★`, name];
                            return [value, name];
                         }}
                      />
                      <Legend wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '10px'}} />
                      
                      <Bar yAxisId="left" dataKey="share" name="Market Share" radius={[4, 4, 0, 0]} barSize={40}>
                        <LabelList 
                          dataKey="share" 
                          position="top" 
                          fill="#cbd5e1" 
                          fontSize={10} 
                          fontWeight="black" 
                          formatter={(v: number) => `${v}%`} 
                        />
                        {FRANCA_STATS.marketPlayers.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PLAYER_COLORS[entry.name] || '#cbd5e1'} />
                        ))}
                      </Bar>
                      
                      <Line yAxisId="right" type="monotone" dataKey="satisfaction" name="Satisfação" stroke="#f8fafc" strokeWidth={2} dot={{r: 4, fill: '#0f172a', strokeWidth: 2}} />
                   </ComposedChart>
                </ResponsiveContainer>
             </div>

             {/* GRID DE CARDS EXISTENTE */}
             <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                 <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2">Detalhes de Benchmark</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FRANCA_STATS.marketPlayers.map(p => (
                      <div key={p.name} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 border-l-4 group hover:border-l-yellow-500 transition-all" style={{borderLeftColor: PLAYER_COLORS[p.name]}}>
                         <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-black text-white uppercase">{p.name}</span>
                            <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold">{p.share}% Share</span>
                         </div>
                         <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-[10px] uppercase"><span className="text-slate-500">Ticket Médio</span><span className="text-yellow-500 font-black">R$ {p.ticket.toFixed(2)}</span></div>
                            <div className="flex justify-between text-[10px] uppercase"><span className="text-slate-500">Foco Estratégico</span><span className="text-slate-300 font-bold text-right">{p.focus}</span></div>
                         </div>
                         <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < p.satisfaction ? PLAYER_COLORS[p.name] : 'none'} className={i < p.satisfaction ? '' : 'opacity-20'} />)}
                         </div>
                      </div>
                    ))}
                 </div>
             </div>
          </div>
        )}

        {/* --- ABA 2: MKT/CF --- */}
        {activeTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
             <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2"><Megaphone size={18}/> Gestão de Investimento de Marketing</h5>
                <div className="space-y-8">
                   {[
                     { label: 'Tráfego Pago (FB/IG/Google Ads)', key: 'trafegoPago', min: 0, max: 20000, step: 500 },
                     { label: 'Campanha Adesão Turbo (Eventos)', key: 'adesaoTurbo', min: 0, max: 10000, step: 250 },
                     { label: 'Parcerias Bares & Restaurantes', key: 'parceriasBares', min: 0, max: 10000, step: 250 },
                     { label: 'Campanha clientes (Indique e Ganhe)', key: 'indiqueGanhe', min: 0, max: 10000, step: 250 },
                     { label: 'Marketing de Marca (Offline)', key: 'marketingMonthly', min: 0, max: 50000, step: 500 },
                   ].map(item => (
                     <div key={item.key} className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>{item.label}</span>
                          <span className="text-yellow-500 text-sm">{formatCurrency((currentParams as any)[item.key])}</span>
                        </div>
                        <input 
                          type="range" 
                          min={item.min} 
                          max={item.max} 
                          step={item.step} 
                          value={(currentParams as any)[item.key]} 
                          onChange={(e) => updateCurrentParam(item.key as any, parseFloat(e.target.value))} 
                          className="w-full h-1.5 bg-slate-800 accent-yellow-500 rounded-lg appearance-none cursor-pointer hover:accent-yellow-400" 
                        />
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col items-center">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-10 self-start">Distribuição de Alocação de Verba</h5>
                <ResponsiveContainer width="100%" height={280}>
                   <PieChart>
                      <Pie data={[
                        { name: 'Performance', value: currentParams.trafegoPago },
                        { name: 'Brand / Offline', value: currentParams.marketingMonthly },
                        { name: 'Viral Growth', value: currentParams.indiqueGanhe + currentParams.parceriasBares },
                        { name: 'Activation', value: currentParams.adesaoTurbo },
                      ]} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                        <Cell fill="#EAB308" />
                        <Cell fill="#64748b" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#f97316" />
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#020617', border: 'none', borderRadius: '8px', fontSize: '10px'}} />
                      <Legend wrapperStyle={{fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold'}} verticalAlign="bottom" height={36}/>
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* --- ABA 3: PARAMETRIZAÇÃO --- */}
        {activeTab === 3 && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl animate-in fade-in duration-500">
            <h5 className="text-[11px] font-black uppercase text-yellow-500 mb-10 border-b border-slate-800 pb-4 flex items-center gap-2"><Sliders size={20}/> Painel de Parâmetros Operacionais</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
              {[
                { label: 'Frota Inicial', key: 'activeDrivers', min: 0, max: 500, step: 1, unit: ' condutores' },
                { label: 'Adição Mensal Frota', key: 'driverAdditionMonthly', min: 0, max: 100, step: 1, unit: ' condutores' },
                { label: 'Corridas p/ Usuário', key: 'ridesPerUserMonth', min: 1, max: 10, step: 0.1, unit: ' rides/mês' },
                { label: 'Tarifa Médio (R$)', key: 'avgFare', min: 10, max: 50, step: 0.5, unit: '' },
                { label: 'Crescimento Usuários (%)', key: 'userGrowth', min: 0, max: 30, step: 1, unit: '%' },
                { label: 'Custos Fixos (R$)', key: 'fixedCosts', min: 0, max: 20000, step: 100, unit: '' },
                { label: 'Tecnologia / APIs (R$/ride)', key: 'apiMaintenanceRate', min: 0, max: 2, step: 0.05, unit: '' },
              ].map(item => (
                <div key={item.key} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{item.label}</span>
                    <span className="text-yellow-500 text-lg">{(currentParams as any)[item.key]}{item.unit}</span>
                  </div>
                  <input type="range" min={item.min} max={item.max} step={item.step} value={(currentParams as any)[item.key]} onChange={(e) => updateCurrentParam(item.key as any, parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 accent-yellow-500 rounded-lg appearance-none cursor-pointer hover:accent-yellow-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ABA 4: DRIVERS/ ESCALA --- */}
        {activeTab === 4 && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* CAMPANHA DE INCENTIVO */}
                 <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6 flex items-center gap-2"><Award size={18}/> Campanha de Incentivo: Tarifas Progressivas</h5>
                    <div className="space-y-2">
                       <p className="text-[9px] text-slate-400 uppercase leading-relaxed mb-4">Bonificamos a meritocracia: Quanto mais corridas o motorista realiza no mês, menor é o Take Rate da plataforma.</p>
                       <div className="divide-y divide-slate-800/50">
                          {[
                            { range: '> 600 Corridas', rate: '10%' },
                            { range: '500 - 599 Corridas', rate: '11%' },
                            { range: '400 - 499 Corridas', rate: '12%' },
                            { range: '300 - 399 Corridas', rate: '13%' },
                            { range: '< 300 Corridas (Base)', rate: '15%' },
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between py-3">
                               <span className="text-[10px] font-bold text-slate-300">{item.range}</span>
                               <span className="text-[10px] font-black text-yellow-500">{item.rate}</span>
                            </div>
                          ))}
                       </div>
                       <div className="mt-6 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                          <ShieldCheck size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                          <span className="text-[8px] text-yellow-500/80 uppercase font-bold leading-tight">Métrica auditada mensalmente. Cashback creditado automaticamente na carteira do condutor.</span>
                       </div>
                    </div>
                 </div>

                 {/* GAP DE FROTA */}
                 <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2"><UserCheck size={18}/> Gestão de Frota Alvo e GAP de Atendimento</h5>
                    <div className="overflow-x-auto">
                       <table className="w-full text-[10px] text-left border-collapse">
                          <thead className="bg-slate-950 text-slate-500 font-black uppercase border-b border-slate-800">
                             <tr><th className="p-5">Mês</th><th className="p-5 text-center">Frota Real</th><th className="p-5 text-center">Alvo (Min 50)</th><th className="p-5 text-center">GAP</th><th className="p-5 text-right">Status Cobertura</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/20">
                             {results.map(r => {
                               const target = Math.max(50, Math.round(r.users / 200));
                               const cov = getCoverage(r.drivers, r.users);
                               const meta = getStatusMetadata(cov);
                               const gap = r.drivers - target;
                               return (
                                 <tr key={r.month} className="hover:bg-slate-800/10">
                                    <td className="p-5 font-black text-white">MÊS {r.month}</td>
                                    <td className="p-5 text-center font-bold">{r.drivers}</td>
                                    <td className="p-5 text-center text-slate-500">{target}</td>
                                    <td className={`p-5 text-center font-black ${gap >= 0 ? 'text-green-400' : 'text-red-400'}`}>{gap > 0 ? `+${gap}` : gap}</td>
                                    <td className={`p-5 text-right font-black ${meta.color}`}>
                                       <span className="mr-3">{cov.toFixed(2)}</span>
                                       <span className={`px-2 py-0.5 rounded text-[8px] uppercase ${meta.bg}`}>{meta.label}</span>
                                    </td>
                                 </tr>
                               );
                             })}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- ABA 5: PROJEÇÕES/ ESCALA --- */}
        {activeTab === 5 && (
          <div className="space-y-10 animate-in fade-in duration-500">
             {/* Comparativo de 1º Semestre (Junho) */}
             {renderComparisonBlock("Análise Evolutiva: 1º Semestre (Junho)", [6, 18, 30])}
             
             {/* Comparativo de 2º Semestre (Dezembro) */}
             {renderComparisonBlock("Análise Evolutiva: 2º Semestre (Dezembro)", [12, 24, 36])}

             <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
               <Calculator className="text-yellow-500 mt-1" size={20} />
               <div>
                  <h6 className="text-xs font-black text-yellow-500 uppercase mb-1">Nota Metodológica de Comparação</h6>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                     As setas e percentuais indicam a evolução da métrica em relação ao mesmo período do ciclo anual anterior (Ex: Mês 18 comparado ao Mês 06). 
                     Os custos operacionais somam marketing, tecnologia, custos variáveis e custos fixos.
                  </p>
               </div>
             </div>
          </div>
        )}

        {/* --- ABA 6: 36 meses --- */}
        {activeTab === 6 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {(() => {
              // Cálculos Específicos para os Cards
              const breakEvenIndex = results.findIndex(r => r.netProfit > 0);
              const paybackIndex = results.findIndex(r => r.accumulatedProfit > 0);
              const breakEvenMonth = breakEvenIndex !== -1 ? `Mês ${results[breakEvenIndex].month}` : 'Não Atingido';
              const paybackMonth = paybackIndex !== -1 ? `Mês ${results[paybackIndex].month}` : 'Projeção > 36 Meses';

              const initialDrivers = results[0].drivers;
              const finalDrivers = results[results.length - 1].drivers;
              const driverGrowth = finalDrivers - initialDrivers;

              const totalRides36 = results.reduce((acc, curr) => acc + curr.rides, 0);
              const totalGMV36 = results.reduce((acc, curr) => acc + curr.grossRevenue, 0);
              const totalProfit36 = results.reduce((acc, curr) => acc + curr.netProfit, 0);
              
              const finalShare = (results[results.length - 1].users / FRANCA_STATS.digitalUsers) * 100;
              
              // Estimativa de Churn acumulado (usuários perdidos teóricos)
              const estimatedChurnImpact = results.reduce((acc, curr) => acc + (curr.users * (currentParams.churnRate / 100)), 0);

              const year1Rides = results.slice(0, 12).reduce((a,b)=>a+b.rides,0);
              const year3Rides = results.slice(24, 36).reduce((a,b)=>a+b.rides,0);
              const ridesGrowth = ((year3Rides - year1Rides) / year1Rides) * 100;

              return (
                <div className="space-y-8">
                  {/* Seção 1: Milestones Financeiros */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-2xl border ${breakEvenIndex !== -1 ? 'bg-slate-900 border-green-500/50' : 'bg-slate-900 border-red-500/30'}`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-slate-950 rounded-lg text-yellow-500"><Target size={24}/></div>
                          <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-950 px-2 py-1 rounded">Ponto de Equilíbrio</span>
                       </div>
                       <div className="text-3xl font-black text-white">{breakEvenMonth}</div>
                       <div className="text-[10px] text-slate-400 mt-2">Momento onde a operação deixa de queimar caixa mensalmente.</div>
                    </div>

                    <div className={`p-6 rounded-2xl border ${paybackIndex !== -1 ? 'bg-slate-900 border-yellow-500/50' : 'bg-slate-900 border-slate-800'}`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-slate-950 rounded-lg text-yellow-500"><Hourglass size={24}/></div>
                          <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-950 px-2 py-1 rounded">Payback</span>
                       </div>
                       <div className="text-3xl font-black text-white">{paybackMonth}</div>
                       <div className="text-[10px] text-slate-400 mt-2">Retorno integral do investimento inicial de {formatCurrency(currentParams.initialInvestment)}.</div>
                    </div>

                    <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800">
                       <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-slate-950 rounded-lg text-yellow-500"><Wallet size={24}/></div>
                          <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-950 px-2 py-1 rounded">Lucro Acumulado (36m)</span>
                       </div>
                       <div className={`text-3xl font-black ${totalProfit36 >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(totalProfit36)}</div>
                       <div className="text-[10px] text-slate-400 mt-2">Resultado líquido total somado ao longo de 3 anos de operação.</div>
                    </div>
                  </div>

                  <h5 className="text-[11px] font-black text-yellow-500 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Activity size={16}/> Indicadores de Evolução Operacional
                  </h5>

                  {/* Seção 2: Evolução Operacional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {/* Card Churn */}
                     <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black text-slate-500 uppercase">Análise de Churn</span>
                           <AlertTriangle size={16} className="text-red-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{currentParams.churnRate}% <span className="text-xs text-slate-500 font-bold">/ mês</span></div>
                        <div className="mt-2 text-[10px] text-slate-400">
                           Impacto estimado: <span className="text-red-400 font-bold">~{Math.round(estimatedChurnImpact)} usuários</span> perdidos no período.
                        </div>
                     </div>

                     {/* Card Frota */}
                     <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black text-slate-500 uppercase">Expansão de Frota</span>
                           <UserCheck size={16} className="text-blue-400" />
                        </div>
                        <div className="text-2xl font-black text-white">+{driverGrowth} <span className="text-xs text-slate-500 font-bold">Drivers</span></div>
                        <div className="mt-2 text-[10px] text-slate-400">
                           Saindo de {initialDrivers} para {finalDrivers} motoristas ativos (+{((driverGrowth/initialDrivers)*100).toFixed(0)}%).
                        </div>
                     </div>

                     {/* Card Market Share */}
                     <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black text-slate-500 uppercase">Market Share (M36)</span>
                           <Target size={16} className="text-yellow-500" />
                        </div>
                        <div className="text-2xl font-black text-white">{finalShare.toFixed(2)}%</div>
                        <div className="mt-2 text-[10px] text-slate-400">
                           Penetração sobre o SAM de {FRANCA_STATS.digitalUsers.toLocaleString()} usuários digitais.
                        </div>
                     </div>

                     {/* Card Corridas */}
                     <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black text-slate-500 uppercase">Escala de Volume</span>
                           <BarChart2 size={16} className="text-green-400" />
                        </div>
                        <div className="text-2xl font-black text-white">+{ridesGrowth.toFixed(0)}%</div>
                        <div className="mt-2 text-[10px] text-slate-400">
                           Crescimento do volume anual de corridas (Ano 1 vs Ano 3).
                        </div>
                     </div>
                  </div>

                  {/* Seção 3: Totais Agregados */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                         <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">GMV Total Transacionado</span>
                            <div className="text-3xl font-black text-white mt-1">{formatCurrency(totalGMV36)}</div>
                         </div>
                         <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-yellow-500">
                            <Coins size={20} />
                         </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                         <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Volume Total de Corridas</span>
                            <div className="text-3xl font-black text-white mt-1">{totalRides36.toLocaleString()}</div>
                         </div>
                         <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-blue-400">
                            <Repeat size={20} />
                         </div>
                      </div>
                   </div>

                </div>
              );
            })()}
          </div>
        )}

        {/* --- ABA 7: DRE --- */}
        {activeTab === 7 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-8">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase flex items-center gap-2"><FileText size={18}/> Demonstrativo de Resultados Detalhado</h5>
                <div className="flex bg-slate-950 p-1 rounded-lg no-print">
                   {[2026, 2027, 2028, 'total'].map(y => (
                     <button key={y} onClick={() => setDreYear(y as any)} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${dreYear === y ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}>{y}</button>
                   ))}
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left border-collapse min-w-[1200px]">
                   <thead className="bg-slate-950 text-slate-500 font-black uppercase border-b border-slate-800">
                      <tr><th className="p-4 sticky left-0 bg-slate-950 z-20">Resultado Financeiro</th>{filteredDreResults.map(r=><th key={r.month} className="p-4 text-center">{r.monthName.substring(0,3)}</th>)}<th className="p-4 text-right bg-slate-800/50 text-white">Acumulado</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/20 text-slate-300">
                      <tr className="bg-slate-900/40"><td className="p-4 sticky left-0 bg-slate-900 font-bold text-white uppercase">1. GMV Bruto</td>{filteredDreResults.map(r=><td key={r.month} className="p-4 text-center">{formatCurrency(r.grossRevenue).replace('R$', '')}</td>)}<td className="p-4 text-right font-black">{formatCurrency(filteredDreResults.reduce((a,b)=>a+b.grossRevenue,0))}</td></tr>
                      <tr className="bg-yellow-500/10"><td className="p-4 sticky left-0 bg-slate-900 font-black text-yellow-500 uppercase">2. Receita Líquida TKX</td>{filteredDreResults.map(r=><td key={r.month} className="p-4 text-center font-bold text-yellow-500">{formatCurrency(r.takeRateRevenue).replace('R$', '')}</td>)}<td className="p-4 text-right font-black text-yellow-500">{formatCurrency(filteredDreResults.reduce((a,b)=>a+b.takeRateRevenue,0))}</td></tr>
                      
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Impostos (11.2%)</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.taxes).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.taxes, 0))}</td>
                      </tr>
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Custos Variáveis / Bancários</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.variableCosts).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.variableCosts, 0))}</td>
                      </tr>
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Custos Fixos</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.fixedCosts).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.fixedCosts, 0))}</td>
                      </tr>
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Marketing</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.marketing).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.marketing, 0))}</td>
                      </tr>
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Tecnologia / APIs</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.tech).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.tech, 0))}</td>
                      </tr>

                      <tr className="bg-slate-950 font-black text-white border-y-2 border-slate-800"><td className="p-6 sticky left-0 bg-slate-950 uppercase text-green-400 tracking-widest text-[11px]">3. EBITDA / Lucro Operacional</td>{filteredDreResults.map(r=><td key={r.month} className={`p-6 text-center ${r.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(r.netProfit).replace('R$', '')}</td>)}<td className={`p-6 text-right ${filteredDreResults.reduce((a,b)=>a+b.netProfit,0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(filteredDreResults.reduce((a,b)=>a+b.netProfit,0))}</td></tr>
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* --- ABA 8: kpis --- */}
        {activeTab === 8 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {renderMetricCard('LTV / CAC', `${(lastResult.ltv / (lastResult.cac || 1)).toFixed(1)}x`, 'Eficiência de Aquisição', <Activity size={18}/>, 'pos')}
               {renderMetricCard('Churn Rate', `${currentParams.churnRate}%`, 'Evasão de Usuários', <AlertTriangle size={18}/>, 'neg')}
               {renderMetricCard('ARPU TKX', formatCurrency(lastResult.takeRateRevenue / lastResult.users), 'Receita por Usuário', <Coins size={18}/>)}
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[350px]">
               <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6">Equilíbrio Frota vs Demanda</h5>
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={results}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="month" stroke="#475569" fontSize={9} />
                     <YAxis yAxisId="left" stroke="#475569" fontSize={9} />
                     <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={9} />
                     <Tooltip contentStyle={{backgroundColor: '#020617', border: 'none', fontSize: '10px'}} />
                     <Bar yAxisId="left" dataKey="rides" name="Corridas Realizadas" fill="#EAB308" radius={[4,4,0,0]} />
                     <Line yAxisId="right" type="monotone" dataKey="drivers" name="Frota Real" stroke="#64748b" strokeWidth={3} dot={false} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- ABA 9: Cenários Detalhados --- */}
        {activeTab === 9 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {(() => {
               // Pré-calcular dados de todos os cenários
               const scenariosData = Object.values(ScenarioType).map(t => {
                  const proj = calculateProjections(paramsMap[t], t);
                  const last = proj[proj.length - 1];
                  const first = proj[0];
                  
                  // Métricas Chave
                  const totalProfit = proj.reduce((a, b) => a + b.netProfit, 0);
                  const breakEvenIdx = proj.findIndex(r => r.netProfit > 0);
                  const paybackIdx = proj.findIndex(r => r.accumulatedProfit > 0);
                  const share = (last.users / FRANCA_STATS.digitalUsers) * 100;
                  
                  // Crescimento (Loss/Gain)
                  const userGrowth = ((last.users - first.users) / first.users) * 100;
                  const driverGrowth = ((last.drivers - first.drivers) / first.drivers) * 100;

                  // Prós e Contras (Lógica baseada no tipo)
                  let pros: string[] = [];
                  let cons: string[] = [];

                  if (t === ScenarioType.REALISTA) {
                     pros = ["Equilíbrio Risco/Retorno", "Crescimento Sustentável", "Foco em Retenção"];
                     cons = ["Velocidade Moderada", "Exige Execução Precisa"];
                  } else if (t === ScenarioType.PESSIMISTA) {
                     pros = ["Baixa Exposição de Capital", "Maior Sobrevivência em Crise", "Controle Rígido de Caixa"];
                     cons = ["ROI Longo Prazo", "Risco de Perda de Share", "Baixa atratividade para Motoristas"];
                  } else {
                     pros = ["Domínio Rápido de Mercado", "Barreira de Entrada para Competidores", "Valuation Agressivo"];
                     cons = ["Alta Queima de Caixa (Burn)", "Sensibilidade a CAC alto", "Risco Operacional Elevado"];
                  }

                  return { 
                     type: t, 
                     proj, 
                     metrics: { totalProfit, breakEvenIdx, paybackIdx, share, userGrowth, driverGrowth },
                     pros,
                     cons
                  };
               });

               // Dados combinados para o gráfico
               const combinedChartData = Array.from({ length: 36 }, (_, i) => {
                  return {
                     month: i + 1,
                     [ScenarioType.REALISTA]: scenariosData.find(s => s.type === ScenarioType.REALISTA)?.proj[i].accumulatedProfit,
                     [ScenarioType.PESSIMISTA]: scenariosData.find(s => s.type === ScenarioType.PESSIMISTA)?.proj[i].accumulatedProfit,
                     [ScenarioType.OTIMISTA]: scenariosData.find(s => s.type === ScenarioType.OTIMISTA)?.proj[i].accumulatedProfit,
                  };
               });

               return (
                  <>
                     {/* 1. Cards Comparativos Topo */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {scenariosData.map((s) => (
                           <div key={s.type} className={`bg-slate-900 border-t-4 p-6 rounded-2xl relative shadow-lg ${scenario === s.type ? 'border-yellow-500 bg-slate-900/80 ring-1 ring-yellow-500/20' : 'border-slate-800 hover:bg-slate-900/60'}`} style={{ borderTopColor: SCENARIO_COLORS[s.type] }}>
                              <div className="flex justify-between items-start mb-4">
                                 <h4 className="text-sm font-black uppercase text-white tracking-wider">{s.type}</h4>
                                 {s.metrics.totalProfit > 0 ? <TrendingUp size={16} className="text-green-500"/> : <TrendingUp size={16} className="text-red-500 rotate-180"/>}
                              </div>
                              
                              <div className="space-y-4">
                                 <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Lucro Acumulado (36m)</span>
                                    <div className={`text-2xl font-black ${s.metrics.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                       {formatCurrency(s.metrics.totalProfit)}
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                                    <div>
                                       <span className="text-[9px] text-slate-500 uppercase">Payback</span>
                                       <div className="text-sm font-bold text-white">{s.metrics.paybackIdx !== -1 ? `Mês ${s.metrics.paybackIdx + 1}` : 'N/A'}</div>
                                    </div>
                                    <div>
                                       <span className="text-[9px] text-slate-500 uppercase">Break-even</span>
                                       <div className="text-sm font-bold text-white">{s.metrics.breakEvenIdx !== -1 ? `Mês ${s.metrics.breakEvenIdx + 1}` : 'N/A'}</div>
                                    </div>
                                    <div>
                                       <span className="text-[9px] text-slate-500 uppercase">Market Share</span>
                                       <div className="text-sm font-bold text-yellow-500">{s.metrics.share.toFixed(1)}%</div>
                                    </div>
                                    <div>
                                       <span className="text-[9px] text-slate-500 uppercase">Cresc. Usuários</span>
                                       <div className="text-sm font-bold text-blue-400">+{s.metrics.userGrowth.toFixed(0)}%</div>
                                    </div>
                                 </div>
                              </div>
                              
                              {scenario !== s.type && (
                                 <button onClick={() => setScenario(s.type as ScenarioType)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-[9px] uppercase font-black">
                                    Selecionar
                                 </button>
                              )}
                           </div>
                        ))}
                     </div>

                     {/* 2. Matriz de Prós e Contras */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {scenariosData.map((s) => (
                           <div key={s.type + 'pros'} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 border-b border-slate-800 pb-2">Vantagens & Riscos: {s.type}</h5>
                              <div className="space-y-3">
                                 {s.pros.map((p, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                       <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0"/>
                                       <span className="text-[10px] text-slate-300 leading-tight">{p}</span>
                                    </div>
                                 ))}
                                 <div className="my-2 border-t border-slate-800/50"></div>
                                 {s.cons.map((c, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                       <XCircle size={12} className="text-red-500 mt-0.5 shrink-0"/>
                                       <span className="text-[10px] text-slate-300 leading-tight">{c}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* 3. Tabela Comparativa Semestral */}
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl overflow-hidden">
                        <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6 flex items-center gap-2">
                           <Clock size={16}/> Timeline Semestral Comparativa
                        </h5>
                        <div className="overflow-x-auto">
                           <table className="w-full text-[10px] text-left border-collapse">
                              <thead className="bg-slate-950 text-slate-500 uppercase font-black">
                                 <tr>
                                    <th className="p-3 w-32 sticky left-0 bg-slate-950 z-10">Cenário</th>
                                    <th className="p-3 text-center">Métrica</th>
                                    {[6, 12, 18, 24, 30, 36].map(m => <th key={m} className="p-3 text-center bg-slate-950/50">Mês {m}</th>)}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/30">
                                 {scenariosData.map((s) => (
                                    <React.Fragment key={s.type}>
                                       {/* Linha de Lucro */}
                                       <tr className="hover:bg-slate-800/20 transition-colors group">
                                          <td rowSpan={2} className="p-3 font-black sticky left-0 bg-slate-900 group-hover:bg-slate-800/20 z-10 border-r border-slate-800" style={{color: SCENARIO_COLORS[s.type]}}>
                                             {s.type}
                                          </td>
                                          <td className="p-3 text-center text-slate-400 font-bold uppercase text-[9px]">Lucro Liq.</td>
                                          {[5, 11, 17, 23, 29, 35].map(idx => {
                                             const val = s.proj[idx]?.netProfit || 0;
                                             return (
                                                <td key={idx} className={`p-3 text-center font-bold ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                   {formatCurrency(val)}
                                                </td>
                                             );
                                          })}
                                       </tr>
                                       {/* Linha de Usuários */}
                                       <tr className="hover:bg-slate-800/20 transition-colors bg-slate-950/20">
                                          <td className="p-3 text-center text-slate-500 font-bold uppercase text-[9px] border-b border-slate-800/50">Usuários</td>
                                          {[5, 11, 17, 23, 29, 35].map(idx => (
                                             <td key={idx} className="p-3 text-center text-slate-300 border-b border-slate-800/50">
                                                {(s.proj[idx]?.users / 1000).toFixed(1)}k
                                             </td>
                                          ))}
                                       </tr>
                                    </React.Fragment>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>

                     {/* 4. Gráfico de Equity Comparativo */}
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[400px]">
                        <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6 flex items-center gap-2">
                           <TrendingUp size={16}/> Comparativo de Equity (Saldo Acumulado)
                        </h5>
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={combinedChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="month" stroke="#475569" fontSize={9} />
                              <YAxis stroke="#475569" fontSize={9} tickFormatter={v => `${v/1000}k`} />
                              <Tooltip contentStyle={{backgroundColor: '#020617', border: 'none', fontSize: '10px'}} formatter={(val: number) => formatCurrency(val)}/>
                              <Legend wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold'}} verticalAlign="top"/>
                              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                              
                              <Line type="monotone" dataKey={ScenarioType.REALISTA} stroke={SCENARIO_COLORS[ScenarioType.REALISTA]} strokeWidth={3} dot={false} />
                              <Line type="monotone" dataKey={ScenarioType.PESSIMISTA} stroke={SCENARIO_COLORS[ScenarioType.PESSIMISTA]} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                              <Line type="monotone" dataKey={ScenarioType.OTIMISTA} stroke={SCENARIO_COLORS[ScenarioType.OTIMISTA]} strokeWidth={2} dot={false} />
                           </LineChart>
                        </ResponsiveContainer>
                     </div>
                  </>
               );
            })()}
          </div>
        )}

        {/* --- ABA 10: GERAL - DASHBOARD EXECUTIVO CONSOLIDADO (Visão 360) --- */}
        {activeTab === 10 && (
          <div className="space-y-8 animate-in fade-in duration-500">
             {(() => {
                // Cálculo de todos os cenários para o quadro comparativo consolidado
                const scenarioData = Object.values(ScenarioType).map(t => {
                   const proj = calculateProjections(paramsMap[t], t);
                   const y1 = proj.filter(r => r.year === 2026);
                   const y2 = proj.filter(r => r.year === 2027);
                   const y3 = proj.filter(r => r.year === 2028);

                   const sumNet = (arr: MonthlyResult[]) => arr.reduce((a, b) => a + b.netProfit, 0);
                   const sumRev = (arr: MonthlyResult[]) => arr.reduce((a, b) => a + b.takeRateRevenue, 0);

                   return {
                      type: t,
                      year1: { net: sumNet(y1), rev: sumRev(y1) },
                      year2: { net: sumNet(y2), rev: sumRev(y2) },
                      year3: { net: sumNet(y3), rev: sumRev(y3) },
                      totalAccumulated: proj[proj.length-1].accumulatedProfit,
                      minBalance: Math.min(...proj.map(r => r.accumulatedProfit))
                   };
                });

                // Veredito do Sistema
                const bestScenario = scenarioData.reduce((prev, current) => (prev.year3.net > current.year3.net) ? prev : current);
                const isViable = results[results.length-1].netProfit > 0;
                
                return (
                   <>
                      {/* 1. Scorecard Executivo (Big Numbers) */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Valuation (8x EBITDA)</span>
                            <div className="text-2xl font-black text-white mt-1">{formatCurrency(lastResult.ebitda * 12 * 8)}</div>
                            <Briefcase className="absolute right-4 bottom-4 text-slate-800 opacity-50" size={40} />
                         </div>
                         <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Exposição Máxima Caixa</span>
                            <div className="text-2xl font-black text-red-400 mt-1">{formatCurrency(Math.min(...results.map(r=>r.accumulatedProfit)))}</div>
                            <Zap className="absolute right-4 bottom-4 text-slate-800 opacity-50" size={40} />
                         </div>
                         <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">ROI (36 Meses)</span>
                            <div className="text-2xl font-black text-green-400 mt-1">{((lastResult.accumulatedProfit / currentParams.initialInvestment) * 100).toFixed(0)}%</div>
                            <TrendingUp className="absolute right-4 bottom-4 text-slate-800 opacity-50" size={40} />
                         </div>
                         <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                             <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Payback Estimado</span>
                             <div className="text-2xl font-black text-yellow-500 mt-1">
                                {results.findIndex(r => r.accumulatedProfit > 0) !== -1 ? `${results.findIndex(r => r.accumulatedProfit > 0) + 1} Meses` : '> 36m'}
                             </div>
                             <Hourglass className="absolute right-4 bottom-4 text-slate-800 opacity-50" size={40} />
                         </div>
                      </div>

                      {/* 2. Matriz de Viabilidade Ano a Ano (Coração do Dashboard) */}
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                         <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6 flex items-center gap-2"><Search size={16}/> Matriz de Viabilidade Comparativa (Ano a Ano)</h5>
                         <div className="overflow-x-auto">
                            <table className="w-full text-[10px] text-left border-collapse">
                               <thead className="bg-slate-950 text-slate-500 font-black uppercase border-b border-slate-800">
                                  <tr>
                                     <th className="p-4 w-32">Cenário</th>
                                     <th className="p-4 text-center bg-slate-900/50 border-x border-slate-800">Ano 1 (Resultado)</th>
                                     <th className="p-4 text-center bg-slate-900/50 border-r border-slate-800">Ano 2 (Resultado)</th>
                                     <th className="p-4 text-center bg-slate-900/50 border-r border-slate-800">Ano 3 (Resultado)</th>
                                     <th className="p-4 text-right">Saldo Final (M36)</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-800/30 text-slate-300">
                                  {scenarioData.map(s => (
                                     <tr key={s.type} className={`hover:bg-slate-800/20 transition-colors ${scenario === s.type ? 'bg-slate-800/20' : ''}`}>
                                        <td className="p-4 font-black" style={{color: SCENARIO_COLORS[s.type]}}>{s.type}</td>
                                        
                                        {/* Ano 1 */}
                                        <td className="p-4 text-center border-x border-slate-800">
                                           <div className="flex flex-col gap-1">
                                              <span className="text-slate-400 font-bold">Rec: {formatCurrency(s.year1.rev)}</span>
                                              <span className={`${s.year1.net >= 0 ? 'text-green-400' : 'text-red-400'} font-black bg-slate-950/50 px-2 py-0.5 rounded`}>
                                                 {formatCurrency(s.year1.net)}
                                              </span>
                                           </div>
                                        </td>
                                        
                                        {/* Ano 2 */}
                                        <td className="p-4 text-center border-r border-slate-800">
                                           <div className="flex flex-col gap-1">
                                              <span className="text-slate-400 font-bold">Rec: {formatCurrency(s.year2.rev)}</span>
                                              <span className={`${s.year2.net >= 0 ? 'text-green-400' : 'text-red-400'} font-black bg-slate-950/50 px-2 py-0.5 rounded`}>
                                                 {formatCurrency(s.year2.net)}
                                              </span>
                                           </div>
                                        </td>
                                        
                                        {/* Ano 3 */}
                                        <td className="p-4 text-center border-r border-slate-800">
                                           <div className="flex flex-col gap-1">
                                              <span className="text-slate-400 font-bold">Rec: {formatCurrency(s.year3.rev)}</span>
                                              <span className={`${s.year3.net >= 0 ? 'text-green-400' : 'text-red-400'} font-black bg-slate-950/50 px-2 py-0.5 rounded`}>
                                                 {formatCurrency(s.year3.net)}
                                              </span>
                                           </div>
                                        </td>
                                        
                                        <td className={`p-4 text-right font-black text-lg ${s.totalAccumulated >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                           {formatCurrency(s.totalAccumulated)}
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>

                      {/* 3. Consolidado Operacional e Veredito */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         {/* Saúde do Negócio (Consolidado) */}
                         <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                            <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6 flex items-center gap-2"><Activity size={16}/> Saúde Operacional & Métricas (360º)</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                               <div className="space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-bold">Eficiência Marketing</span>
                                  <div className="text-sm font-black text-white">CAC: {formatCurrency(lastResult.cac)}</div>
                                  <div className="text-sm font-black text-green-400">LTV: {formatCurrency(lastResult.ltv)}</div>
                                  <div className="text-[9px] text-slate-400 mt-1">Ratio: {(lastResult.ltv / (lastResult.cac||1)).toFixed(1)}x</div>
                               </div>
                               <div className="space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-bold">Performance Frota</span>
                                  <div className="text-sm font-black text-white">{lastResult.drivers} Motoristas</div>
                                  <div className="text-sm font-black text-yellow-500">{(lastResult.rides / lastResult.drivers).toFixed(0)} Rides/mês</div>
                                  <div className="text-[9px] text-slate-400 mt-1">Média por Driver</div>
                               </div>
                               <div className="space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-bold">Penetração Mercado</span>
                                  <div className="text-sm font-black text-white">{((lastResult.users / FRANCA_STATS.digitalUsers) * 100).toFixed(1)}% Share</div>
                                  <div className="text-sm font-black text-blue-400">{lastResult.users.toLocaleString()} Users</div>
                                  <div className="text-[9px] text-slate-400 mt-1">TAM: {FRANCA_STATS.digitalUsers.toLocaleString()}</div>
                               </div>
                               <div className="space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-bold">Ticket & Margem</span>
                                  <div className="text-sm font-black text-white">Ticket: {formatCurrency(currentParams.avgFare)}</div>
                                  <div className="text-sm font-black text-green-400">Net: {formatCurrency(lastResult.takeRateRevenue / lastResult.rides)}/ride</div>
                               </div>
                               <div className="space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-bold">Custos Operacionais</span>
                                  <div className="text-sm font-black text-red-400">Fixos: {formatCurrency(lastResult.fixedCosts)}</div>
                                  <div className="text-sm font-black text-red-400">Mkt: {formatCurrency(lastResult.marketing)}</div>
                               </div>
                               <div className="space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-bold">Investimento Total</span>
                                  <div className="text-sm font-black text-white">{formatCurrency(currentParams.initialInvestment)}</div>
                                  <div className="text-[9px] text-slate-400 mt-1">Capital Inicial</div>
                               </div>
                            </div>
                         </div>

                         {/* Card de Veredito Inteligente */}
                         <div className={`bg-slate-900 border-2 p-6 rounded-2xl flex flex-col justify-between ${isViable ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                            <div>
                               <h5 className="text-[11px] font-black uppercase mb-4 flex items-center gap-2 text-white">
                                  {isViable ? <ThumbsUp size={16} className="text-green-500"/> : <ThumbsDown size={16} className="text-red-500"/>}
                                  Parecer do Sistema
                               </h5>
                               <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                                  {isViable 
                                    ? "O cenário atual apresenta viabilidade econômica positiva. A operação atinge o break-even dentro da janela de 36 meses e gera caixa livre sustentável no terceiro ano. Recomenda-se foco total na retenção de motoristas para manter a qualidade do serviço durante a escala." 
                                    : "ATENÇÃO: O cenário atual apresenta alto risco de insolvência. O volume projetado não é suficiente para cobrir os custos fixos e variáveis acumulados. Recomenda-se revisar a estratégia de aquisição (CAC) ou aumentar o ticket médio para garantir margem de contribuição positiva."}
                               </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800/50">
                               <span className="text-[9px] text-slate-500 uppercase font-bold">Melhor Cenário Identificado:</span>
                               <div className="text-lg font-black text-yellow-500">{bestScenario.type}</div>
                            </div>
                         </div>
                      </div>
                   </>
                );
             })()}
          </div>
        )}

        {/* --- ABA 11: VISÃO 360º (Mantida e enriquecida, mas foco foi na 10 conforme pedido) --- */}
        {activeTab === 11 && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                   <Briefcase className="absolute -right-4 -bottom-4 text-slate-800 group-hover:text-slate-700 transition-colors" size={120} />
                   <span className="text-[9px] text-slate-500 uppercase font-black">Valuation Projetado M36</span>
                   <div className="text-3xl font-black text-white mt-2">{formatCurrency(lastResult.ebitda * 12 * 8 / 12)}</div>
                   <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Múltiplo 8x EBITDA</div>
                </div>
                {renderMetricCard('ROI Total', `${((lastResult.accumulatedProfit / currentParams.initialInvestment) * 100).toFixed(0)}%`, 'Retorno s/ Capital', <TrendingUp size={18}/>, 'pos')}
                {renderMetricCard('Burn Máximo', formatCurrency(Math.min(...results.map(r=>r.netProfit))), 'Custo Operacional', <Zap size={18}/>, 'neg')}
             </div>
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6">Performance Anual Auditada</h5>
                <table className="w-full text-[10px] text-left">
                   <thead className="bg-slate-950 text-slate-500 uppercase font-black">
                      <tr><th className="p-4">Ano</th><th className="p-4">GMV Total</th><th className="p-4">Rec. TKX</th><th className="p-4">Profit Líquido</th><th className="p-4 text-right">Drivers/Users</th></tr>
                   </thead>
                   <tbody>
                      {audits.map(a => (
                        <tr key={a.year} className="border-t border-slate-800">
                           <td className="p-4 font-black text-white">{a.year}</td>
                           <td className="p-4">{formatCurrency(a.totalGMV)}</td>
                           <td className="p-4 text-yellow-500">{formatCurrency(a.totalRevenue)}</td>
                           <td className="p-4 text-green-400 font-bold">{formatCurrency(a.totalNetProfit)}</td>
                           <td className="p-4 text-right">{a.endDrivers} / {a.endUsers.toLocaleString()}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

      </div>

      {/* OVERLAY DE ALERTAS */}
      {supplyBottleneck && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2 text-xs font-black uppercase text-center z-[100] animate-pulse">
          <AlertTriangle size={14} className="inline mr-2" /> Gargalo de Atendimento Detectado
        </div>
      )}
      
      {oversupplyWarning && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-600 text-white p-2 text-xs font-black uppercase text-center z-[100]">
          <Info size={14} className="inline mr-2" /> Excesso de Oferta de Motoristas
        </div>
      )}
    </Layout>
  );
};

export default App;
