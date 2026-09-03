import { useEffect, useMemo, useState } from 'react';
import { Activity, Bell, Bot, ChevronRight, CircleAlert, CreditCard, Globe2, LayoutDashboard, LifeBuoy, ListChecks, RefreshCw, Search, ShieldCheck, Users, X } from 'lucide-react';

type User = { id:number; telegram_id:number; username?:string; full_name?:string; role:string; status?:string; domain_name?:string|null; domain_verified?:boolean; created_at:string };
type Ticket = { id:number; ticket_number:string; user_id:number; category:string; title?:string; description?:string; message?:string; status:string; priority?:string; assigned_to?:number|null; created_at:string; updated_at:string; user_name?:string };
type Payment = { id:number; payment_number:string; user_id:number; amount:number|string; currency?:string; proof_path?:string|null; status:string; verification_notes?:string|null; created_at:string; verified_at?:string|null };
type Stats = { totalUsers:number; verifiedMembers:number; pendingTickets:number; totalTopics:number; pendingPayments:number; totalWebsites:number; superAdminCount:number };
type Tab = 'overview'|'members'|'domains'|'tickets'|'payments'|'notifications'|'audit'|'bot';

const tabs: {id:Tab; label:string; icon:any}[] = [
  {id:'overview',label:'Overview',icon:LayoutDashboard}, {id:'members',label:'Members',icon:Users},
  {id:'domains',label:'Domains',icon:Globe2}, {id:'tickets',label:'Tickets',icon:LifeBuoy},
  {id:'payments',label:'Payments / Gaji',icon:CreditCard}, {id:'notifications',label:'Notifications',icon:Bell},
  {id:'audit',label:'Audit',icon:ShieldCheck}, {id:'bot',label:'Bot Status',icon:Bot},
];

const API_BASE=(import.meta.env.VITE_BACKOFFICE_API_URL||'').replace(/\/$/,'');
async function getJson<T>(url:string):Promise<T>{ const r=await fetch(`${API_BASE}${url}`,{credentials:'include'}); if(!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); }

export default function App(){
  const [tab,setTab]=useState<Tab>('overview');
  const [stats,setStats]=useState<Stats|null>(null); const [users,setUsers]=useState<User[]>([]); const [tickets,setTickets]=useState<Ticket[]>([]); const [payments,setPayments]=useState<Payment[]>([]);
  const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [query,setQuery]=useState(''); const [selected,setSelected]=useState<any|null>(null);

  const load=async()=>{ setLoading(true); setError(''); try { const [s,u,t,p]=await Promise.all([getJson<Stats>('/api/stats'),getJson<User[]>('/api/users'),getJson<Ticket[]>('/api/tickets'),getJson<Payment[]>('/api/payments')]); setStats(s); setUsers(u); setTickets(t); setPayments(p); } catch(e:any){ setError(e?.message||'Backend belum tersedia'); } finally { setLoading(false); } };
  useEffect(()=>{load()},[]);

  const filteredUsers=useMemo(()=>users.filter(u=>`${u.full_name||''} ${u.username||''} ${u.domain_name||''} ${u.role}`.toLowerCase().includes(query.toLowerCase())),[users,query]);
  const filteredTickets=useMemo(()=>tickets.filter(t=>`${t.ticket_number} ${t.user_name||''} ${t.category} ${t.title||''} ${t.description||t.message||''}`.toLowerCase().includes(query.toLowerCase())),[tickets,query]);
  const domains=useMemo(()=>users.filter(u=>u.domain_name).map(u=>({user:u,domain:u.domain_name!})),[users]);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Bot size={20}/></div><div><b>Abiedien</b><span>Backoffice</span></div></div>
      <nav>{tabs.map(({id,label,icon:Icon})=><button key={id} className={tab===id?'nav-item active':'nav-item'} onClick={()=>{setTab(id);setSelected(null)}}><Icon size={17}/><span>{label}</span>{id==='tickets'&&stats?.pendingTickets?<em>{stats.pendingTickets}</em>:null}</button>)}</nav>
      <div className="sidebar-foot"><div className="status-dot"/> Backend connection is read-only in this build</div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">ADMIN OPERATIONS</div><h1>{tabs.find(x=>x.id===tab)?.label}</h1></div><div className="top-actions"><div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search members, tickets, domains…"/></div><button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={17} className={loading?'spin':''}/></button></div></header>
      {error&&<div className="alert"><CircleAlert size={17}/><span>{error}</span><button onClick={()=>setError('')}><X size={15}/></button></div>}
      {loading&&!stats?<div className="loading">Loading operational data…</div>:<>
        {tab==='overview'&&<Overview stats={stats} users={users} tickets={tickets} payments={payments} onOpen={setTab}/>} 
        {tab==='members'&&<Table title="Members" count={filteredUsers.length} headers={['Member','Role','Status','Domain','Created']} rows={filteredUsers.map(u=>[<><b>{u.full_name||'—'}</b><small>@{u.username||'—'}</small></>,u.role,u.status||'—',u.domain_name||'—',fmt(u.created_at)])} onRow={(i)=>setSelected(filteredUsers[i])}/>} 
        {tab==='domains'&&<Table title="Domains" count={domains.length} headers={['Domain','Owner','Verification','Member status']} rows={domains.map(x=>[<b>{x.domain}</b>,x.user.full_name||'—',badge(x.user.domain_verified?'verified':'unverified',x.user.domain_verified),badge(x.user.status||'unknown')])} onRow={(i)=>setSelected(domains[i].user)}/>} 
        {tab==='tickets'&&<Table title="Operational queue" count={filteredTickets.length} headers={['Ticket','Member','Category','Priority','Status','Updated']} rows={filteredTickets.map(t=>[<b>{t.ticket_number}</b>,t.user_name||`User #${t.user_id}`,t.category,badge(t.priority||'medium'),badge(t.status),fmt(t.updated_at)])} onRow={(i)=>setSelected(filteredTickets[i])}/>} 
        {tab==='payments'&&<Table title="Payments / Gaji" count={payments.length} headers={['Payment','Member ID','Amount','Status','Created']} rows={payments.map(p=>[<b>{p.payment_number||`#${p.id}`}</b>,String(p.user_id),`${p.currency||''} ${p.amount}`,badge(p.status),fmt(p.created_at)])} onRow={(i)=>setSelected(payments[i])}/>} 
        {tab==='notifications'&&<Empty title="Notifications" text="UI siap. Sumber notification aktual belum ditarik pada build ini."/>}
        {tab==='audit'&&<Empty title="Audit" text="Audit viewer siap sebagai modul. Endpoint aktual belum dihubungkan agar tidak mengarang kontrak."/>}
        {tab==='bot'&&<Empty title="Bot Status" text="Monitoring bot dipisahkan dari dashboard UI. Tidak ada status palsu ditampilkan."/>}
      </>}
      {selected&&<Detail data={selected} close={()=>setSelected(null)}/>} 
    </main>
  </div>
}

function Overview({stats,users,tickets,payments,onOpen}:{stats:Stats|null;users:User[];tickets:Ticket[];payments:Payment[];onOpen:(t:Tab)=>void}){
 const cards=[['Members',stats?.totalUsers??0,Users,'members'],['Verified',stats?.verifiedMembers??0,ShieldCheck,'members'],['Pending tickets',stats?.pendingTickets??0,LifeBuoy,'tickets'],['Pending payments',stats?.pendingPayments??0,CreditCard,'payments']];
 return <><section className="hero"><div><div className="eyebrow">OPERATIONAL CENTER</div><h2>Kerja admin, satu tempat.</h2><p>Data ditampilkan dari endpoint yang tersedia. Tidak ada traffic atau status yang direkayasa.</p></div><div className="hero-health"><Activity size={18}/><span>Live fetch</span></div></section><div className="stats">{cards.map(([label,val,Icon,target])=><button className="stat-card" key={String(label)} onClick={()=>onOpen(target as Tab)}><Icon size={18}/><span>{label}</span><strong>{String(val)}</strong><small>Open module <ChevronRight size={13}/></small></button>)}</div><div className="grid-2"><Panel title="Needs attention"><div className="attention"><Item label="Tickets pending" value={stats?.pendingTickets??0} action={()=>onOpen('tickets')}/><Item label="Payments pending" value={stats?.pendingPayments??0} action={()=>onOpen('payments')}/><Item label="Members" value={users.length} action={()=>onOpen('members')}/></div></Panel><Panel title="Operational coverage"><div className="coverage"><div><span>Users loaded</span><b>{users.length}</b></div><div><span>Tickets loaded</span><b>{tickets.length}</b></div><div><span>Payments loaded</span><b>{payments.length}</b></div><div><span>Websites reported</span><b>{stats?.totalWebsites??0}</b></div></div></Panel></div></>
}
function Item({label,value,action}:{label:string;value:number;action:()=>void}){return <button className="attention-row" onClick={action}><span>{label}</span><b>{value}</b><ChevronRight size={15}/></button>}
function Panel({title,children}:{title:string;children:any}){return <section className="panel"><div className="panel-title"><h3>{title}</h3></div>{children}</section>}
function Table({title,count,headers,rows,onRow}:{title:string;count:number;headers:string[];rows:any[][];onRow?:(i:number)=>void}){return <Panel title={`${title} · ${count}`}><div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} onClick={()=>onRow?.(i)}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table>{!rows.length&&<div className="empty-table">No records returned.</div>}</div></Panel>}
function Detail({data,close}:{data:any;close:()=>void}){return <div className="drawer"><div className="drawer-head"><b>Detail</b><button className="icon-btn" onClick={close}><X size={17}/></button></div><pre>{JSON.stringify(data,null,2)}</pre></div>}
function Empty({title,text}:{title:string;text:string}){return <Panel title={title}><div className="module-empty"><ListChecks size={28}/><b>{text}</b><span>Modul belum diberi kontrak backend baru.</span></div></Panel>}
function badge(v:string,good=false){return <span className={`badge ${good||['verified','active','resolved'].includes(v.toLowerCase())?'good':''}`}>{v}</span>}
function fmt(v?:string){return v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'—'}
