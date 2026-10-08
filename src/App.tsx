import { useMemo, useState } from "react";

type Side = "BUY" | "SELL";
type View = "home" | "journal" | "calendar" | "analytics" | "settings";
type Unit = "$" | "R" | "%";
type Trade = {
  id:string; symbol:string; side:Side; openedAt:string; closedAt:string;
  size:number; pnl:number; fees:number; stop?:number; tp?:number; note?:string;
  strategy?:string; tags?:string[]; timeframe?:string; screenshots?:string[];
  risk?:number; entry?:number; exit?:number;
};

const initialTrades:Trade[] = [
 {id:"t1",symbol:"XAUUSD",side:"BUY",openedAt:"2026-09-29T08:20:00Z",closedAt:"2026-09-29T10:05:00Z",size:.1,pnl:82,fees:2,strategy:"Breakout",tags:["London"],timeframe:"M15",risk:44,note:"Cassure propre avec confirmation."},
 {id:"t2",symbol:"BTCUSD",side:"SELL",openedAt:"2026-10-01T11:00:00Z",closedAt:"2026-10-01T13:10:00Z",size:.02,pnl:-36,fees:1,strategy:"Reversal",tags:["NY"],timeframe:"H1",risk:30,note:"Entrée trop tôt."},
 {id:"t3",symbol:"XAUUSD",side:"SELL",openedAt:"2026-10-02T07:40:00Z",closedAt:"2026-10-02T09:00:00Z",size:.1,pnl:125,fees:2,strategy:"Breakout",tags:["London"],timeframe:"M15",risk:50,note:"Retest propre."},
 {id:"t4",symbol:"EURUSD",side:"BUY",openedAt:"2026-10-03T08:10:00Z",closedAt:"2026-10-03T09:00:00Z",size:.2,pnl:-22,fees:1,strategy:"Pullback",tags:["Asia"],timeframe:"M15",risk:25,note:"Structure invalidée."},
 {id:"t5",symbol:"XAUUSD",side:"BUY",openedAt:"2026-10-05T09:05:00Z",closedAt:"2026-10-05T11:20:00Z",size:.1,pnl:96,fees:2,strategy:"Breakout",tags:["London"],timeframe:"M15",risk:42,note:"TP partiel puis sortie."},
 {id:"t6",symbol:"NAS100",side:"SELL",openedAt:"2026-10-06T14:10:00Z",closedAt:"2026-10-06T15:00:00Z",size:.1,pnl:-48,fees:1,strategy:"Reversal",tags:["NY"],timeframe:"M5",risk:35,note:"Momentum contraire."},
 {id:"t7",symbol:"BTCUSD",side:"BUY",openedAt:"2026-10-07T10:30:00Z",closedAt:"2026-10-07T12:40:00Z",size:.02,pnl:150,fees:3,strategy:"Trend",tags:["NY"],timeframe:"H1",risk:70,note:"Plan respecté. Trailing stop puis BE."},
 {id:"t8",symbol:"XAUUSD",side:"SELL",openedAt:"2026-10-08T07:55:00Z",closedAt:"2026-10-08T08:35:00Z",size:.1,pnl:54,fees:2,strategy:"Breakout",tags:["London"],timeframe:"M15",risk:35,note:"Impulsion puis sécurisation."}
];

function fmtMoney(v:number, currency="USD"){ const s=Math.abs(v).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2}); return `${v>=0?"+":"−"}${s} $`; }
function fmtCompact(v:number){ const a=Math.abs(v); const sign=v>=0?"+":"−"; if(a>=1e6)return sign+(a/1e6).toFixed(1)+" M"; if(a>=1e3)return sign+(a/1e3).toFixed(1)+" k"; return sign+Math.round(a); }
function dayKey(d:string){ return new Date(d).toLocaleDateString("sv-SE"); }
function sessionOf(d:string){ const h=new Date(d).getUTCHours(); if(h<7)return "Asie"; if(h<13)return "Londres"; if(h<21)return "New York"; return "Hors session"; }
function pct(a:number,b:number){ return b===0?0:(a/b)*100; }

function SvgIcon({name}:{name:string}) {
  const p:any = {
    home:<><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9 21v-7h6v7"/></>,
    journal:<><path d="M6 3h11a2 2 0 0 1 2 2v16H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M7 21h12"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    analytics:<><path d="M4 19V5M4 19h17"/><path d="m7 15 4-5 3 2 5-6"/></>,
    settings:<><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.2 1.2 1.2-2 2-1.2-1.2-.2-.1a7.7 7.7 0 0 1-2.1.9v.2V20h-3v-1.8-.2a7.7 7.7 0 0 1-2.1-.9l-.2.1-1.2 1.2-2-2 1.2-1.2.1-.2a7.7 7.7 0 0 1-.9-2.1h-.2H4v-3h1.8.2a7.7 7.7 0 0 1 .9-2.1l-.1-.2-1.2-1.2 2-2 1.2 1.2.2.1a7.7 7.7 0 0 1 2.1-.9V5h3v1.8.2a7.7 7.7 0 0 1 2.1.9l.2-.1 1.2-1.2 2 2-1.2 1.2-.1.2a7.7 7.7 0 0 1 .9 2.1h.2H20v3h-1.8-.2a7.7 7.7 0 0 1-.9 2.1Z"/></>,
    search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    plus:<><path d="M12 5v14M5 12h14"/></>,
    clock:<><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></>,
    trend:<><path d="M4 17 10 11l4 4 6-8"/><path d="M15 7h5v5"/></>,
    image:<><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 4 4"/></>,
  }[name];
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

function StatCard({label,value,sub,accent}:{label:string;value:string;sub?:string;accent?:string}) {
  return <div className="stat-card"><div className="eyebrow">{label}</div><div className={`stat-value ${accent||""}`}>{value}</div>{sub&&<div className="stat-sub">{sub}</div>}</div>
}

function LineChart({trades,unit,crosshair,setCrosshair}:{trades:Trade[];unit:Unit;crosshair:number|null;setCrosshair:(n:number|null)=>void}) {
  const series = useMemo(()=>{
    let e=0; return trades.map((t,i)=>{ e+=t.pnl-t.fees; return {i,e,p:t.pnl-t.fees,t}; })
  },[trades]);
  const W=860,H=300,pad=30;
  const values=series.length?series.map(x=>x.e):[0,1];
  const min=Math.min(0,...values), max=Math.max(0,...values), span=max-min||1;
  const pts=series.map((x,i)=>[pad+(i/(Math.max(1,series.length-1)))*(W-pad*2), H-pad-((x.e-min)/span)*(H-pad*2)]);
  const baseY=H-pad-((0-min)/span)*(H-pad*2);
  const active=crosshair==null?null:pts[Math.min(crosshair,Math.max(0,pts.length-1))];
  const unitValue=(e:number)=>{
    if(unit==="$")return e;
    if(unit==="%")return e/1000*100;
    return e/50;
  };
  return <div className="chart-wrap" onMouseLeave={()=>setCrosshair(null)}>
    {series.length===0 ? <div className="empty-chart">Pas assez de trades pour tracer une courbe</div> :
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width*W; let idx=Math.round((x-pad)/(W-pad*2)*Math.max(1,series.length-1)); idx=Math.max(0,Math.min(series.length-1,idx)); setCrosshair(idx)}}
      onTouchStart={e=>{const r=e.currentTarget.getBoundingClientRect(); const t=e.touches[0]; const x=(t.clientX-r.left)/r.width*W; let idx=Math.round((x-pad)/(W-pad*2)*Math.max(1,series.length-1)); idx=Math.max(0,Math.min(series.length-1,idx)); setCrosshair(idx)}}
      onTouchMove={e=>{const r=e.currentTarget.getBoundingClientRect(); const t=e.touches[0]; const x=(t.clientX-r.left)/r.width*W; let idx=Math.round((x-pad)/(W-pad*2)*Math.max(1,series.length-1)); idx=Math.max(0,Math.min(series.length-1,idx)); setCrosshair(idx)}} >
      <line x1={pad} y1={baseY} x2={W-pad} y2={baseY} className="base-line"/>
      {[0,.25,.5,.75,1].map((q,i)=><line key={i} x1={pad} x2={W-pad} y1={pad+q*(H-pad*2)} y2={pad+q*(H-pad*2)} className="grid-line"/>)}
      <polygon points={`${pts.map(p=>p.join(",")).join(" ")} ${W-pad},${baseY} ${pad},${baseY}`} className="area-fill"/>
      <polyline fill="none" points={pts.map(p=>p.join(",")).join(" ")} className="line-stroke"/>
      {series.length<=60 && pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={crosshair===i?5:2.5} className={crosshair===i?"point active":"point"}/>)}
      {active&&<><line x1={active[0]} x2={active[0]} y1={pad} y2={H-pad} className="crosshair"/><circle cx={active[0]} cy={active[1]} r="9" className="cross-point"/></>}
      <text x={pad} y="18" className="axis-label">{fmtMoney(unitValue(max-min))}</text>
      <text x={W-pad} y="18" textAnchor="end" className="axis-label">{series.length} trades</text>
    </svg>}
    {active && series[crosshair!] && <div className="tooltip" style={{left:`${Math.min(78,Math.max(22,active[0]/W*100))}%`}}>
      <div className="tooltip-date">{new Date(series[crosshair!].t.closedAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}</div>
      <strong>{fmtMoney(series[crosshair!].e)}</strong>
      <span className={series[crosshair!].p>=0?"gain":"loss"}>{fmtMoney(series[crosshair!].p)}</span>
      <span>{series[crosshair!].t.symbol} · {series[crosshair!].t.size.toFixed(2)} lot</span>
    </div>}
  </div>
}

function SimpleBarChart({items,unit,click}:{items:{label:string,value:number,count?:number}[];unit:Unit;click?:(i:number)=>void}) {
  const max=Math.max(1,...items.map(x=>Math.abs(x.value)));
  return <div className="bars">{items.map((x,i)=><div className="bar-row" key={x.label} onClick={()=>click?.(i)}><div className="bar-label">{x.label}</div><div className="bar-track"><div className={`bar ${x.value>=0?"gainbar":"lossbar"}`} style={{width:`${Math.max(4,Math.abs(x.value)/max*100)}%`}}/></div><div className={x.value>=0?"bar-value gain":"bar-value loss"}>{unit==="$"?fmtMoney(x.value):unit==="%"?pct(x.value,1000).toFixed(1)+" %":(x.value/50).toFixed(2)+" R"}</div></div>)}</div>
}

function CalendarView({trades,onSelect}:{trades:Trade[];onSelect:(k:string)=>void}) {
  const [cursor,setCursor]=useState(new Date("2026-10-01T00:00:00"));
  const y=cursor.getFullYear(),m=cursor.getMonth();
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  const start=(first.getDay()+6)%7;
  const total=last.getDate();
  const map=Object.fromEntries(trades.map(()=>[]));
  const byDay:Record<string,{pnl:number;count:number}>={};
  trades.forEach(t=>{const k=dayKey(t.closedAt); byDay[k]??={pnl:0,count:0}; byDay[k].pnl+=t.pnl-t.fees; byDay[k].count+=1});
  const monthTrades=trades.filter(t=>new Date(t.closedAt).getMonth()===m&&new Date(t.closedAt).getFullYear()===y);
  const monthPnl=monthTrades.reduce((a,t)=>a+t.pnl-t.fees,0);
  const negatives=Object.values(byDay).filter(x=>x.pnl<0).map(x=>x.pnl);
  const best=Math.max(0,...Object.values(byDay).map(x=>x.pnl));
  const worst=negatives.length?Math.min(...negatives):null;
  const cells:Array<JSX.Element>=[];
  for(let i=0;i<start;i++)cells.push(<div key={"e"+i} className="cal-cell muted"/>);
  for(let d=1;d<=total;d++){const k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const v=byDay[k]; cells.push(<button className={`cal-cell ${v?(v.pnl>=0?"positive":"negative"):""}`} key={k} onClick={()=>onSelect(k)}><span>{d}</span>{v&&<><strong>{fmtCompact(v.pnl)}</strong><small>{v.count} trade{v.count>1?"s":""}</small></>}</button>)}
  return <div className="calendar-layout">
    <div className="calendar-main card">
      <div className="section-head"><div><div className="eyebrow">Calendrier</div><h2>{cursor.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</h2></div><div className="head-actions"><button className="icon-btn" onClick={()=>setCursor(new Date(y,m-1,1))}>‹</button><button className="ghost-btn" onClick={()=>setCursor(new Date())}>Aujourd'hui</button><button className="icon-btn" onClick={()=>setCursor(new Date(y,m+1,1))}>›</button></div></div>
      <div className="week-row">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(x=><span key={x}>{x}</span>)}</div><div className="calendar-grid">{cells}</div>
    </div>
    <aside className="side-stack">
      <StatCard label="P&L du mois" value={fmtMoney(monthPnl)} accent={monthPnl>=0?"gain":"loss"}/>
      <StatCard label="Trades" value={String(monthTrades.length)} />
      <StatCard label="Meilleur jour" value={fmtMoney(best)} accent="gain"/>
      <StatCard label="Pire jour" value={worst===null?"Aucune journée perdante":fmtMoney(worst)} accent={worst===null?"": "loss"}/>
    </aside>
  </div>
}

export default function App(){
  const [view,setView]=useState<View>("home");
  const [unit,setUnit]=useState<Unit>("$");
  const [trades,setTrades]=useState<Trade[]>(()=>{try{const x=localStorage.getItem("eliass_trades");return x?JSON.parse(x):initialTrades}catch{return initialTrades}});
  const [crosshair,setCrosshair]=useState<number|null>(null);
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [selectedDay,setSelectedDay]=useState<string|null>(null);
  const [dark,setDark]=useState(true);
  const [demo,setDemo]=useState(true);
  const [form,setForm]=useState<Partial<Trade>>({symbol:"XAUUSD",side:"BUY",size:.1,fees:0,openedAt:new Date().toISOString().slice(0,16),closedAt:new Date().toISOString().slice(0,16),pnl:0,note:""});

  const save=(next:Trade[])=>{setTrades(next);localStorage.setItem("eliass_trades",JSON.stringify(next));setDemo(false)};
  const periodTrades=trades;
  const pnl=periodTrades.reduce((a,t)=>a+t.pnl-t.fees,0);
  const wins=periodTrades.filter(t=>t.pnl-t.fees>0), losses=periodTrades.filter(t=>t.pnl-t.fees<0);
  const winrate=periodTrades.length?wins.length/(wins.length+losses.length)*100:0;
  const avgWin=wins.length?wins.reduce((a,t)=>a+t.pnl-t.fees,0)/wins.length:0;
  const avgLoss=losses.length?losses.reduce((a,t)=>a+t.pnl-t.fees,0)/losses.length:0;
  const profitFactor=losses.length?wins.reduce((a,t)=>a+t.pnl-t.fees,0)/Math.abs(losses.reduce((a,t)=>a+t.pnl-t.fees,0)):wins.length?Infinity:0;
  const expectancy=periodTrades.length?pnl/periodTrades.length:0;
  const grossCurve=(()=>{let e=0,peak=0,dd=0; for(const t of trades){e+=t.pnl-t.fees;peak=Math.max(peak,e);dd=Math.min(dd,e-peak)} return dd})();
  const filtered=trades.filter(t=>t.symbol.toLowerCase().includes(search.toLowerCase())||t.strategy?.toLowerCase().includes(search.toLowerCase())||t.note?.toLowerCase().includes(search.toLowerCase()));
  const recent=[...trades].sort((a,b)=>+new Date(b.closedAt)-+new Date(a.closedAt)).slice(0,5);

  const addTrade=()=>{
    const t:Trade={id:crypto.randomUUID(),symbol:(form.symbol||"XAUUSD").toUpperCase(),side:(form.side||"BUY") as Side,openedAt:new Date(form.openedAt||Date.now()).toISOString(),closedAt:new Date(form.closedAt||Date.now()).toISOString(),size:Number(form.size||0.1),pnl:Number(form.pnl||0),fees:Number(form.fees||0),note:form.note||"",strategy:form.strategy||"Breakout",tags:form.tags||["Trading"],timeframe:form.timeframe||"M15",risk:Number(form.risk||0),screenshots:[]};
    save([t,...trades]);setShowAdd(false);setForm({symbol:t.symbol,side:t.side,size:t.size,fees:0,openedAt:new Date().toISOString().slice(0,16),closedAt:new Date().toISOString().slice(0,16),pnl:0,note:""});setView("home");
  };

  const shellTheme=dark?"app dark":"app";
  return <div className={shellTheme}>
    {demo && <div className="demo-banner">Mode aperçu : des trades de démonstration sont présents. Les données seront ensuite reliées à ton compte personnel.</div>}
    <header className="topbar"><div className="brand" onClick={()=>setView("home")}><img src="/logo.svg"/><div><strong>Eliass</strong><span>Journal de performance</span></div></div><div className="top-actions"><div className="unit-switch">{(["$","R","%"] as Unit[]).map(u=><button key={u} className={unit===u?"active":""} onClick={()=>setUnit(u)}>{u}</button>)}</div><button className="icon-btn" onClick={()=>setView("settings")} aria-label="Réglages"><SvgIcon name="settings"/></button></div></header>

    <main className="content">
      {view==="home" && <div className="page">
        <div className="period-row"><div><div className="eyebrow">Vue actuelle</div><h1>Où en es-tu ?</h1></div><div className="period-pills">{["Jour","Semaine","Mois","Année","Tout","Perso"].map((x,i)=><button key={x} className={i===4?"active":""}>{x}</button>)}</div></div>
        <div className="dashboard-grid">
          <section className="hero-card card"><div className="eyebrow">P&L net · Tout</div><div className={`hero-value ${pnl>=0?"gain":"loss"}`}>{fmtMoney(pnl)}</div><div className="hero-meta">{trades.length} trades · {wins.length} gagnants · {losses.length} perdants</div><div className="mini-split"><span>Total profits <b className="gain">{fmtMoney(wins.reduce((a,t)=>a+t.pnl-t.fees,0))}</b></span><span>Total pertes <b className="loss">{fmtMoney(losses.reduce((a,t)=>a+t.pnl-t.fees,0))}</b></span></div></section>
          <section className="stats-grid"><StatCard label="Taux de réussite" value={winrate.toFixed(2)+" %"} sub="W / (W + L)"/><StatCard label="Profit factor" value={profitFactor===Infinity?"∞":profitFactor.toFixed(2)}/><StatCard label="Expectancy" value={fmtMoney(expectancy)} sub="P&L net / N"/><StatCard label="Drawdown max" value={fmtMoney(grossCurve)} accent="loss"/></section>
        </div>
        <section className="card chart-card"><div className="section-head"><div><div className="eyebrow">Profit et pertes dans le temps</div><h2>Courbe de capital</h2></div><div className="head-actions"><div className="segmented"><button className="active">Capital</button><button>Drawdown</button></div><div className="segmented"><button className="active">Par trade</button><button>Par jour</button></div></div></div><LineChart trades={trades} unit={unit} crosshair={crosshair} setCrosshair={setCrosshair}/></section>
        <div className="two-col"><section className="card"><div className="section-head"><div><div className="eyebrow">Aujourd'hui</div><h2>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</h2></div><button className="primary" onClick={()=>setShowAdd(true)}><SvgIcon name="plus"/> Ajouter un trade</button></div><div className="today-box"><strong>{fmtMoney(trades.filter(t=>dayKey(t.closedAt)===dayKey(new Date().toISOString())).reduce((a,t)=>a+t.pnl-t.fees,0))}</strong><span>{trades.filter(t=>dayKey(t.closedAt)===dayKey(new Date().toISOString())).length} trade(s)</span></div></section>
          <section className="card"><div className="section-head"><div><div className="eyebrow">Historique</div><h2>Derniers trades</h2></div><button className="text-btn" onClick={()=>setView("journal")}>Voir tout</button></div><div className="trade-list">{recent.map(t=><div className="trade-row" key={t.id}><div className="symbol"><span>{t.symbol}</span><small>{t.side==="BUY"?"Achat":"Vente"} · {new Date(t.closedAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</small></div><span className={t.pnl-t.fees>=0?"gain":"loss"}>{fmtMoney(t.pnl-t.fees)}</span></div>)}</div></section>
        </div>
      </div>}

      {view==="journal" && <div className="page"><div className="period-row"><div><div className="eyebrow">Journal</div><h1>Mes trades</h1></div><button className="primary" onClick={()=>setShowAdd(true)}><SvgIcon name="plus"/> Nouveau trade</button></div><div className="toolbar card"><div className="searchbox"><SvgIcon name="search"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher symbole, stratégie, note…"/></div><div className="filter-pills"><button className="active">Tous</button><button>Gagnants</button><button>Perdants</button><button>Achat</button><button>Vente</button></div><span className="filter-summary">{filtered.length} trades · {fmtMoney(filtered.reduce((a,t)=>a+t.pnl-t.fees,0))}</span></div><section className="card table-card"><div className="table-head"><span>Date</span><span>Instrument</span><span>Sens</span><span>Résultat</span><span>R</span><span></span></div>{filtered.map(t=><div className="table-row" key={t.id}><span>{new Date(t.closedAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"2-digit"})}<small>{new Date(t.closedAt).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</small></span><strong>{t.symbol}</strong><span><span className={`side-badge ${t.side.toLowerCase()}`}>{t.side==="BUY"?"Achat":"Vente"}</span></span><span className={t.pnl-t.fees>=0?"gain":"loss"}>{fmtMoney(t.pnl-t.fees)}</span><span>{t.risk?((t.pnl-t.fees)/t.risk).toFixed(2)+" R":"—"}</span><button className="icon-btn">•••</button></div>)}</section></div>}

      {view==="calendar" && <div className="page"><CalendarView trades={trades} onSelect={setSelectedDay}/>{selectedDay&&<div className="modal-backdrop" onClick={()=>setSelectedDay(null)}><div className="day-sheet" onClick={e=>e.stopPropagation()}><div className="section-head"><div><div className="eyebrow">Journée</div><h2>{new Date(selectedDay+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</h2></div><button className="icon-btn" onClick={()=>setSelectedDay(null)}>×</button></div><div className="day-total">{fmtMoney(trades.filter(t=>dayKey(t.closedAt)===selectedDay).reduce((a,t)=>a+t.pnl-t.fees,0))}</div><div className="trade-list">{trades.filter(t=>dayKey(t.closedAt)===selectedDay).map(t=><div className="trade-row" key={t.id}><div className="symbol"><span>{t.symbol}</span><small>{t.side==="BUY"?"Achat":"Vente"} · {new Date(t.closedAt).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</small></div><span className={t.pnl-t.fees>=0?"gain":"loss"}>{fmtMoney(t.pnl-t.fees)}</span></div>)}</div><textarea placeholder="Note du jour…" /></div></div>}</div>}

      {view==="analytics" && <div className="page"><div className="period-row"><div><div className="eyebrow">Analyses</div><h1>Comprendre la performance</h1></div><div className="filter-pills"><button className="active">Tout</button><button>30 jours</button><button>Cette année</button></div></div><div className="analytics-grid"><section className="card"><div className="section-head"><div><div className="eyebrow">Par sens</div><h2>Achat / Vente</h2></div></div><SimpleBarChart unit={unit} items={[{label:"Achat",value:trades.filter(t=>t.side==="BUY").reduce((a,t)=>a+t.pnl-t.fees,0)},{label:"Vente",value:trades.filter(t=>t.side==="SELL").reduce((a,t)=>a+t.pnl-t.fees,0)}]}/><div className="analytics-foot"><span>Achat {trades.filter(t=>t.side==="BUY").length}</span><span>Vente {trades.filter(t=>t.side==="SELL").length}</span></div></section>
        <section className="card"><div className="section-head"><div><div className="eyebrow">Par session</div><h2>Quand je performe</h2></div></div><SimpleBarChart unit={unit} items={["Asie","Londres","New York","Hors session"].map(s=>({label:s,value:trades.filter(t=>sessionOf(t.openedAt)===s).reduce((a,t)=>a+t.pnl-t.fees,0),count:trades.filter(t=>sessionOf(t.openedAt)===s).length}))}/></section>
        <section className="card wide"><div className="section-head"><div><div className="eyebrow">Profit & pertes</div><h2>Courbe interactive</h2></div></div><LineChart trades={trades} unit={unit} crosshair={crosshair} setCrosshair={setCrosshair}/></section>
        <section className="card"><div className="section-head"><div><div className="eyebrow">Gagnants / perdants</div><h2>Qualité des résultats</h2></div></div><div className="metric-stack"><div><span>Gain moyen</span><b className="gain">{fmtMoney(avgWin)}</b></div><div><span>Perte moyenne</span><b className="loss">{fmtMoney(avgLoss)}</b></div><div><span>R/R moyen</span><b>{avgLoss?((avgWin/Math.abs(avgLoss))).toFixed(2):"—"}</b></div><div><span>Meilleur trade</span><b className="gain">{fmtMoney(Math.max(0,...trades.map(t=>t.pnl-t.fees)))}</b></div></div></section>
      </div></div>}

      {view==="settings" && <div className="page narrow"><div className="period-row"><div><div className="eyebrow">Réglages</div><h1>Ton espace Eliass</h1></div></div><section className="settings-list"><div className="setting-group"><h3>Préférences</h3><div className="setting-row"><span>Thème</span><div className="segmented"><button className={!dark?"active":""} onClick={()=>setDark(false)}>Clair</button><button className={dark?"active":""} onClick={()=>setDark(true)}>Sombre</button></div></div><div className="setting-row"><span>Devise</span><strong>USD · $</strong></div><div className="setting-row"><span>Début de semaine</span><strong>Lundi</strong></div></div><div className="setting-group"><h3>Données</h3><div className="setting-row"><span>Charger les données de démonstration</span><button className="ghost-btn" onClick={()=>{setTrades(initialTrades);localStorage.setItem("eliass_trades",JSON.stringify(initialTrades));setDemo(true)}}>Réinitialiser</button></div><div className="setting-row"><span>Effacer tous mes trades</span><button className="danger-btn" onClick={()=>{setTrades([]);localStorage.setItem("eliass_trades","[]");setDemo(false)}}>Effacer</button></div></div><div className="setting-group support"><h3>Soutenir Eliass</h3><p>Eliass est gratuit. Si l'application t'est utile, tu peux contribuer à son existence par Orange Money ou Wave.</p><div className="support-line"><span>Orange Money</span><strong>+221 78 731 31 67</strong><button className="ghost-btn" onClick={()=>navigator.clipboard?.writeText("+221 78 731 31 67")}>Copier</button></div><div className="support-line"><span>Wave</span><strong>+221 78 731 31 67</strong><button className="ghost-btn" onClick={()=>navigator.clipboard?.writeText("+221 78 731 31 67")}>Copier</button></div><small>Don libre et facultatif. Aucune fonction n'est bloquée sans don.</small></div><div className="setting-group"><h3>À propos</h3><p><strong>Eliass</strong> · Journal personnel de performance de trading.</p><p className="muted-text">Créé et pensé par Oumar Ba.</p></div></section></div>}
    </main>

    <nav className="bottom-nav">{([["home","Accueil"],["journal","Journal"],["plus",""],["calendar","Calendrier"],["analytics","Analyses"]] as [string,string][]).map(([n,label])=>n==="plus"?<button key={n} className="fab" onClick={()=>setShowAdd(true)} aria-label="Nouveau trade"><SvgIcon name="plus"/></button>:<button key={n} className={view===n?"active":""} onClick={()=>setView(n as View)}><SvgIcon name={n}/><span>{label}</span></button>)}</nav>

    {showAdd&&<div className="modal-backdrop" onClick={()=>setShowAdd(false)}><div className="trade-modal" onClick={e=>e.stopPropagation()}><div className="section-head"><div><div className="eyebrow">Nouveau trade</div><h2>Ajouter un trade</h2></div><button className="icon-btn" onClick={()=>setShowAdd(false)}>×</button></div><div className="form-grid"><label>Instrument<input value={form.symbol||""} onChange={e=>setForm({...form,symbol:e.target.value})}/></label><label>Taille<input type="number" step=".01" value={form.size||""} onChange={e=>setForm({...form,size:Number(e.target.value)})}/></label><label>Sens<div className="segmented full"><button className={form.side==="BUY"?"active":""} onClick={()=>setForm({...form,side:"BUY"})}>Achat</button><button className={form.side==="SELL"?"active":""} onClick={()=>setForm({...form,side:"SELL"})}>Vente</button></div></label><label>Résultat net<input type="number" step=".01" value={form.pnl||""} onChange={e=>setForm({...form,pnl:Number(e.target.value)})}/></label><label>Ouverture<input type="datetime-local" value={String(form.openedAt||"").slice(0,16)} onChange={e=>setForm({...form,openedAt:e.target.value})}/></label><label>Clôture<input type="datetime-local" value={String(form.closedAt||"").slice(0,16)} onChange={e=>setForm({...form,closedAt:e.target.value})}/></label><label>Stratégie<input value={form.strategy||""} onChange={e=>setForm({...form,strategy:e.target.value})}/></label><label>Risque<input type="number" step=".01" value={form.risk||""} onChange={e=>setForm({...form,risk:Number(e.target.value)})}/></label><label className="wide-field">Note<textarea value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})}/></label></div><div className="form-footer"><div className="live-summary"><strong className={Number(form.pnl||0)>=0?"gain":"loss"}>{fmtMoney(Number(form.pnl||0)-Number(form.fees||0))}</strong><span>· {sessionOf(new Date(form.openedAt||Date.now()).toISOString())}</span></div><button className="primary" onClick={addTrade}>Enregistrer</button></div></div></div>}
  </div>
}