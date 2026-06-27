'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion';
import {
  Video,
  Activity,
  Clock,
  LayoutGrid,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Wifi,
  Moon,
  Zap,
  MonitorPlay,
  Users,
  ArrowRight,
  Eye,
  Layers,
  Radio,
  Crosshair,
  Globe,
  BarChart3,
  Bell,
  Gauge,
  Camera,
  Lock,
  ScanLine,
  TrendingUp,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Minus,
  ChevronRight,
  Play,
  AlignJustify,
  X,
  Mail,  
  Phone, 
  Heart,
  Coffee,
  Sparkles,
  Rocket,
  Database,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string; }

// ─── Static data ─────────────────────────────────────────────────────────────
const features = [
  { title: 'Real-Time Monitoring',   desc: 'Multi-camera AI surveillance with live detection and seamless tracking across all zones.',        Icon: MonitorPlay, accent: '#4ecdc4', bg: 'rgba(78,205,196,0.07)'   },
  { title: 'AI Density Detection',   desc: 'YOLOv8-powered density scoring with adaptive thresholds, auto-calibration and zone mapping.',    Icon: Cpu,         accent: '#00d4ff', bg: 'rgba(0,212,255,0.07)'   },
  { title: 'Predictive Alerts',      desc: 'Forecast crowd congestion 2–5 min ahead using optical flow and movement trend analysis.',        Icon: Bell,        accent: '#a78bfa', bg: 'rgba(167,139,250,0.07)' },
  { title: 'Heatmap Visualization',  desc: 'Color-coded density heatmaps with timeline playback to analyse crowd behaviour over time.',      Icon: BarChart3,    accent: '#39d98a', bg: 'rgba(57,217,138,0.07)'  },
  { title: 'Smart Zone Management',  desc: 'Define custom zones, set capacity limits and receive instant threshold breach notifications.',   Icon: Layers,      accent: '#fb923c', bg: 'rgba(251,146,60,0.07)'  },
  { title: 'Global Command Center',  desc: 'Unified dashboard across venues with per-camera drill-down and live incident reporting.',        Icon: Globe,       accent: '#f472b6', bg: 'rgba(244,114,182,0.07)' },
];

const steps = [
  { num: '01', title: 'Ingest Feeds',    desc: 'Multi-camera RTSP or WebSocket streams ingested in real-time.',     Icon: Video    },
  { num: '02', title: 'Detect People',   desc: 'YOLOv8 nano model detects every individual with 95%+ accuracy.',    Icon: Eye      },
  { num: '03', title: 'Score Density',   desc: 'Scientific density metrics calculated per zone with risk scores.',  Icon: Gauge    },
  { num: '04', title: 'Fire Alerts',     desc: 'AI-driven alerts with actionable suggestions delivered instantly.',  Icon: Bell     },
];

const cameras = [
  { id: 'CAM-01', zone: 'Main Entrance',  count: 47,  density: '1.2', risk: 'LOW',  color: '#39d98a' },
  { id: 'CAM-02', zone: 'Central Hall',   count: 183, density: '5.8', risk: 'HIGH', color: '#ff4757' },
  { id: 'CAM-03', zone: 'Exit Corridor',  count: 28,  density: '0.9', risk: 'LOW',  color: '#39d98a' },
  { id: 'CAM-04', zone: 'VIP Lounge',     count: 94,  density: '3.1', risk: 'MED',  color: '#f59e0b' },
  { id: 'CAM-05', zone: 'Food Court',     count: 211, density: '7.2', risk: 'CRIT', color: '#ff2d55' },
  { id: 'CAM-06', zone: 'Parking Zone',   count: 63,  density: '1.6', risk: 'LOW',  color: '#39d98a' },
];

const techSpecs = [
  { Icon: LayoutGrid, label: 'Resolution',   val: '4K UHD · 8 MP'         },
  { Icon: Activity,   label: 'Frame Rate',   val: '30 fps real-time'       },
  { Icon: Moon,       label: 'Night Vision', val: 'IR Enhanced'            },
  { Icon: Radio,      label: 'Protocol',     val: 'RTSP / WebSocket'       },
  { Icon: Cpu,        label: 'Model',        val: 'YOLOv8n + DeepSORT'     },
  { Icon: Zap,        label: 'Inference',    val: '<50 ms per frame'       },
];

const stats = [
  { val: 99, suffix: '.2%', label: 'Detection Accuracy', sub: 'YOLOv8 validated',     Icon: Crosshair  },
  { val: 50, suffix: 'ms',  label: 'Processing Latency', sub: 'GPU accelerated',       Icon: Zap, pre: '<' },
  { val: 128,suffix: '+',   label: 'Camera Streams',     sub: 'Simultaneous feeds',    Icon: Camera     },
  { val: 5,  suffix: ' min',label: 'Predictive Window',  sub: 'Ahead of incidents',    Icon: TrendingUp  },
];

const densityLevels = [
  { level: 'LOW',      range: '0 – 2 p/m²', color: '#39d98a', pct: 28,  Icon: CheckCircle2  },
  { level: 'MEDIUM',   range: '2 – 4 p/m²', color: '#f59e0b', pct: 52,  Icon: Minus         },
  { level: 'HIGH',     range: '4 – 6 p/m²', color: '#ff4757', pct: 74,  Icon: AlertTriangle  },
  { level: 'CRITICAL', range: '6+ p/m²',    color: '#ff2d55', pct: 94,  Icon: ShieldAlert    },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useLive(base: number, lo: number, hi: number, ms: number) {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setV(p => Math.max(lo, Math.min(hi, p + Math.floor(Math.random() * 3) - 1))), ms);
    return () => clearInterval(id);
  }, [lo, hi, ms]);
  return v;
}

function useCountUp(to: number, active: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cur = 0;
    const id = setInterval(() => { cur += to / 70; if (cur >= to) { setV(to); clearInterval(id); } else setV(Math.floor(cur)); }, 16);
    return () => clearInterval(id);
  }, [to, active]);
  return v;
}

// ─── Reveal ───────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 34 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Particle Canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -999, y: -999 });
  useEffect(() => {
    const cvs = ref.current!;
    const ctx = cvs.getContext('2d')!;
    let W = 0, H = 0, raf: number, angle = 0;
    const ps: Particle[] = [];
    const COLS = ['#4ecdc4','#4ecdc4','#00d4ff','#39d98a'];
    const resize = () => { W = cvs.width = innerWidth; H = cvs.height = innerHeight; };
    const make = (): Particle => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.4 + .3, alpha: Math.random() * .45 + .08,
      color: COLS[Math.floor(Math.random() * COLS.length)],
    });
    resize(); addEventListener('resize', resize);
    for (let i = 0; i < 130; i++) ps.push(make());
    const mv = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    addEventListener('mousemove', mv);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.75);
      bg.addColorStop(0,'rgba(4,12,18,.97)'); bg.addColorStop(1,'rgba(2,4,7,.99)');
      ctx.fillStyle = bg; ctx.globalAlpha = 1; ctx.fillRect(0,0,W,H);
      const cx = W*.8, cy = H*.24, mR = Math.min(W,H)*.2;
      for (let r = mR/4; r <= mR; r += mR/4) {
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.strokeStyle='rgba(78,205,196,.04)'; ctx.lineWidth=1; ctx.globalAlpha=1; ctx.stroke();
      }
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,mR,0,-Math.PI*.5,false);
      const rg = ctx.createRadialGradient(0,0,0,0,0,mR);
      rg.addColorStop(0,'rgba(78,205,196,.15)'); rg.addColorStop(1,'rgba(78,205,196,0)');
      ctx.fillStyle=rg; ctx.fill(); ctx.restore(); angle += .0038;
      const t = Date.now()/1000;
      [[W*.18,H*.28,190,'rgba(78,205,196,.055)'],[W*.72,H*.68,250,'rgba(0,212,255,.04)'],[W*.5,H*.42,120,'rgba(57,217,138,.04)']].forEach(([ox,oy,r,c],i) => {
        const x2=(ox as number)+Math.sin(t*.45+i)*48, y2=(oy as number)+Math.cos(t*.38+i)*36;
        const g=ctx.createRadialGradient(x2,y2,0,x2,y2,r as number);
        g.addColorStop(0,c as string); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.globalAlpha=1; ctx.beginPath(); ctx.arc(x2,y2,r as number,0,Math.PI*2); ctx.fill();
      });
      for (let i=0;i<ps.length;i++) for (let j=i+1;j<ps.length;j++) {
        const dx=ps[i].x-ps[j].x, dy=ps[i].y-ps[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<90){ctx.beginPath();ctx.moveTo(ps[i].x,ps[i].y);ctx.lineTo(ps[j].x,ps[j].y);ctx.strokeStyle=`rgba(78,205,196,${.075*(1-d/90)})`;ctx.globalAlpha=1;ctx.lineWidth=.4;ctx.stroke();}
      }
      ps.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W||p.y<0||p.y>H){Object.assign(p,make());return;}
        const dx=p.x-mouse.current.x,dy=p.y-mouse.current.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<110){const f=(110-d)/110;p.x+=dx/d*f*1.8;p.y+=dy/d*f*1.8;}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=p.alpha;ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize',resize); removeEventListener('mousemove',mv); };
  },[]);
  return <canvas ref={ref} className="fixed inset-0 z-0 opacity-80 pointer-events-none" />;
}

// ─── Cursor ───────────────────────────────────────────────────────────────────
function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [hov, setHov] = useState(false);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const mv = (e: MouseEvent) => {
      setVis(true);
      dot.current && Object.assign(dot.current.style, { left: e.clientX+'px', top: e.clientY+'px' });
      setTimeout(() => ring.current && Object.assign(ring.current.style, { left: e.clientX+'px', top: e.clientY+'px' }), 55);
    };
    addEventListener('mousemove', mv);
    const en = () => setHov(true), le = () => setHov(false);
    document.querySelectorAll('a,button').forEach(el => { el.addEventListener('mouseenter',en); el.addEventListener('mouseleave',le); });
    return () => removeEventListener('mousemove', mv);
  },[]);
  if (!vis) return null;
  return (
    <>
      <div ref={dot} className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4ecdc4] mix-blend-screen transition-all duration-150"
        style={{ width: hov?7:11, height: hov?7:11 }} />
      <div ref={ring} className="fixed z-[9998] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(78,205,196,0.45)] transition-all duration-[55ms]"
        style={{ width: hov?52:34, height: hov?52:34 }} />
    </>
  );
}

// ─── Hero Dashboard ───────────────────────────────────────────────────────────
function HeroDash() {
  const people = useLive(247,240,256,1800);
  const [conf, setConf] = useState(98.4);
  useEffect(() => {
    const id = setInterval(()=>setConf(c=>parseFloat(Math.max(97.8,Math.min(99.1,c+(Math.random()-.5)*.25)).toFixed(1))),2100);
    return ()=>clearInterval(id);
  },[]);

  const cams = [
    { id:'CAM-01', fill:45, color:'#39d98a', st:'CLEAR' },
    { id:'CAM-02', fill:79, color:'#ff4757', st:'ALERT' },
    { id:'CAM-03', fill:31, color:'#39d98a', st:'CLEAR' },
  ];
  const metrics = [
    { v: String(people), l:'PEOPLE',   Icon: Users,      c:'#4ecdc4' },
    { v: 'LOW',          l:'RISK LVL', Icon: ShieldCheck, c:'#39d98a' },
    { v: conf+'%',       l:'ACCURACY', Icon: Crosshair,  c:'#00d4ff' },
    { v: '3',            l:'ZONES',    Icon: Layers,      c:'#a78bfa' },
  ];

  return (
    <div className="mt-16 relative w-full max-w-5xl mx-auto px-4 perspective-1000">
      <motion.div 
        initial={{ opacity: 0, y: 40, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="glass-strong rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-jet font-bold tracking-[0.2em] text-white/40 uppercase">System Live: Command Center v2.4</span>
          </div>
          <div className="flex gap-4">
            {cams.map(c => (
              <div key={c.id} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full" style={{ background: c.color }} />
                <span className="text-[9px] font-jet text-white/30">{c.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
          {metrics.map((m, idx) => {
            const Icon = m.Icon;
            return (
              <div key={idx} className="p-6 group hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 group-hover:text-white transition-colors">
                    <Icon size={14} style={{ color: m.c }} />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">{m.l}</span>
                </div>
                <div className="text-2xl font-jet font-bold text-white tracking-tighter" style={{ color: m.c }}>
                  {m.v}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 bg-black/40 flex items-center justify-between">
          <div className="flex gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div 
                key={i} 
                className="w-[2px] h-3 bg-white/10 rounded-full"
                animate={{ height: [4, 12, 4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
          <span className="text-[8px] font-jet text-white/20 tracking-widest">ENCRYPTED DATA FEED // SECURE_SOCKET_7718</span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Camera Card ──────────────────────────────────────────────────────────────
function CamCard({ cam, index }: { cam: typeof cameras[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:'-50px' });
  const count = useLive(cam.count, cam.count-5, cam.count+9, 1700+index*280);
  const [gl, setGl] = useState(false);
  const alert = cam.risk==='HIGH'||cam.risk==='CRIT';

  useEffect(()=>{
    const id=setInterval(()=>{ if(Math.random()>.86){ setGl(true); setTimeout(()=>setGl(false),110); } },2800+index*600);
    return ()=>clearInterval(id);
  },[index]);

  const RiskIcon = cam.risk==='LOW' ? CheckCircle2 : cam.risk==='MED' ? AlertTriangle : ShieldAlert;

  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:64, scale:.93 }}
      animate={inView?{ opacity:1, y:0, scale:1 }:{}}
      transition={{ duration:.85, delay:index*.09, ease:[.22,1,.36,1] }}
      whileHover={{ y:-6, scale:1.015 }}
      style={{ transformStyle:'preserve-3d', perspective:'900px' }}
      className="relative group"
    >
      {/* alert glow ring */}
      {alert&&(
        <motion.div animate={{ opacity:[.3,.7,.3], scale:[1,1.02,1] }} transition={{ duration:1.6, repeat:Infinity }}
          className="absolute -inset-[1px] rounded-[18px] pointer-events-none"
          style={{ background:`linear-gradient(135deg,${cam.color}35,transparent 60%,${cam.color}15)`, filter:'blur(.5px)' }} />
      )}

      <div className="relative rounded-[16px] overflow-hidden border"
        style={{
          borderColor: alert ? `${cam.color}35` : 'rgba(78,205,196,.1)',
          background:'rgba(4,9,14,.94)',
          boxShadow: alert
            ? `0 0 0 1px ${cam.color}18, 0 20px 60px rgba(0,0,0,.45), 0 0 40px ${cam.color}12`
            : '0 20px 60px rgba(0,0,0,.4), inset 0 1px 0 rgba(78,205,196,.06)',
        }}>

        {/* Viewport */}
        <div className="relative overflow-hidden bg-[#020709]" style={{ aspectRatio:'16/9' }}>
          {/* Grid */}
          <div className="absolute inset-0"
            style={{ backgroundImage:`linear-gradient(rgba(78,205,196,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(78,205,196,.025) 1px,transparent 1px)`, backgroundSize:'18px 18px' }} />

          {/* Crowd blobs SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 180" preserveAspectRatio="none">
            <defs>
              <radialGradient id={`hg-${index}`} cx="50%" cy="60%" r="50%">
                <stop offset="0%" stopColor={cam.color} stopOpacity=".45" />
                <stop offset="100%" stopColor={cam.color} stopOpacity="0" />
              </radialGradient>
            </defs>
            {count>40&&<ellipse cx="160" cy="100" rx="100" ry="65" fill={`url(#hg-${index})`} />}
            {Array.from({length:Math.min(count,28)}).map((_,i)=>{
              const s=i*79+index*23;
              return (
                <motion.circle key={i}
                  cx={((s*37)%280)+20} cy={((s*61)%140)+20}
                  r={2.8+(s%3)*.7} fill={cam.color} opacity={.65}
                  animate={{ cx:[((s*37)%280)+20, ((s*37)%280)+20+Math.sin(i)*8, ((s*37)%280)+20], cy:[((s*61)%140)+20, ((s*61)%140)+20+Math.cos(i)*6, ((s*61)%140)+20] }}
                  transition={{ duration:3+(i%4), repeat:Infinity, ease:'easeInOut', delay:i*.09 }} />
              );
            })}
          </svg>

          {/* Scan sweep */}
          <motion.div animate={{ y:['0%','100%','0%'] }} transition={{ duration:3.2, repeat:Infinity, ease:'linear' }}
            className="absolute left-0 right-0 h-[1.5px] pointer-events-none"
            style={{ background:`linear-gradient(90deg,transparent,${cam.color}60,transparent)`, boxShadow:`0 0 8px ${cam.color}30` }} />

          {/* Glitch */}
          {gl&&(
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute inset-0" style={{ background:`${cam.color}06`, transform:'translateX(2px)' }} />
              <div className="absolute top-[28%] left-0 right-0 h-[2px]" style={{ background:`${cam.color}28`, transform:'translateX(-3px)' }} />
            </div>
          )}

          {/* Corner brackets */}
          {['tl','tr','bl','br'].map(c=>(
            <div key={c} className="absolute w-4 h-4 pointer-events-none" style={{
              top:c[0]==='t'?10:'auto', bottom:c[0]==='b'?10:'auto',
              left:c[1]==='l'?10:'auto', right:c[1]==='r'?10:'auto',
              borderTop:c[0]==='t'?`1.5px solid ${cam.color}70`:'none',
              borderBottom:c[0]==='b'?`1.5px solid ${cam.color}70`:'none',
              borderLeft:c[1]==='l'?`1.5px solid ${cam.color}70`:'none',
              borderRight:c[1]==='r'?`1.5px solid ${cam.color}70`:'none',
            }} />
          ))}

          {/* ID tag */}
          <div className="absolute top-2.5 left-3 flex items-center gap-1.5 z-10">
            <motion.div animate={{ opacity:[1,.2,1] }} transition={{ duration:1.6, repeat:Infinity }}
              className="w-1.5 h-1.5 rounded-full" style={{ background:cam.color, boxShadow:`0 0 5px ${cam.color}` }} />
            <span className="text-[.54rem] font-mono tracking-[.1em]" style={{ color:cam.color }}>{cam.id}</span>
          </div>

          {/* REC */}
          <div className="absolute top-2.5 right-3 z-10">
            <motion.span animate={{ opacity:[1,0,1] }} transition={{ duration:.9, repeat:Infinity }}
              className="text-[.52rem] font-mono font-bold text-red-400 tracking-widest">● REC</motion.span>
          </div>

          {/* Count */}
          <div className="absolute bottom-2.5 left-3 z-10">
            <div className="text-[.48rem] font-mono text-white/35 tracking-widest mb-0.5">DETECTED</div>
            <motion.div key={count} initial={{ opacity:0, y:3 }} animate={{ opacity:1, y:0 }}
              className="font-mono text-xl font-bold leading-none"
              style={{ color:cam.color, textShadow:`0 0 16px ${cam.color}55` }}>
              {count.toString().padStart(3,'0')}
            </motion.div>
          </div>

          {/* Mini waveform */}
          <div className="absolute bottom-3 right-3 flex items-end gap-[2px] h-5 z-10">
            {Array.from({length:10}).map((_,i)=>(
              <motion.div key={i} className="w-[2px] rounded-full"
                style={{ background:cam.color, opacity:.55 }}
                animate={{ height:[`${4+Math.random()*14}px`,`${3+Math.random()*18}px`,`${4+Math.random()*14}px`] }}
                transition={{ duration:.45+Math.random()*.45, repeat:Infinity, delay:i*.06 }} />
            ))}
          </div>

          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.1) 2px,rgba(0,0,0,.1) 4px)' }} />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-[rgba(255,255,255,.04)]">
          <div>
            <div className="text-[.75rem] font-semibold text-white/85 font-syne tracking-tight">{cam.zone}</div>
            <div className="text-[.58rem] text-white/28 mt-0.5 tracking-wider font-mono">{cam.density} p/m² · Zone {index+1}</div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
            style={{ color:cam.color, background:`${cam.color}12`, borderColor:`${cam.color}28`, boxShadow:alert?`0 0 10px ${cam.color}25`:'none' }}>
            <RiskIcon className="w-3 h-3" />
            <span className="text-[.58rem] font-mono font-bold tracking-widest">{cam.risk}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Scroll strip ─────────────────────────────────────────────────────────────
function ScrollStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:['start end','end start'] });
  const x = useTransform(scrollYProgress,[0,1],['2%','-44%']);
  const sx = useSpring(x,{ stiffness:55, damping:18 });

  return (
    <div ref={ref} className="relative overflow-hidden py-6">
      <motion.div style={{ x:sx }} className="flex gap-4 w-max px-6">
        {[...cameras,...cameras].map((cam,i)=>{
          const c2 = useLive(cam.count,cam.count-4,cam.count+8,2100+i*220);
          return (
            <div key={`${cam.id}-${i}`} className="rounded-xl overflow-hidden flex-shrink-0 border"
              style={{ width:230, borderColor:`${cam.color}22`, background:'rgba(4,9,14,.96)' }}>
              <div className="relative bg-[#020507] overflow-hidden" style={{ aspectRatio:'16/9' }}>
                <div className="absolute inset-0"
                  style={{ backgroundImage:`linear-gradient(rgba(78,205,196,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(78,205,196,.025) 1px,transparent 1px)`, backgroundSize:'14px 14px' }} />
                <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 230 130" preserveAspectRatio="none">
                  <defs><radialGradient id={`sg-${i}`} cx="50%" cy="60%" r="45%">
                    <stop offset="0%" stopColor={cam.color} stopOpacity=".55" />
                    <stop offset="100%" stopColor={cam.color} stopOpacity="0" />
                  </radialGradient></defs>
                  <ellipse cx="115" cy="78" rx="80" ry="50" fill={`url(#sg-${i})`} />
                  {Array.from({length:Math.min(c2,18)}).map((_,j)=>{
                    const s=j*83+i*23;
                    return <circle key={j} cx={((s*31)%190)+20} cy={((s*53)%100)+15} r={2.4+(s%2)*.6} fill={cam.color} opacity={.65} />;
                  })}
                </svg>
                <motion.div animate={{ y:['0%','100%','0%'] }} transition={{ duration:2.5, repeat:Infinity, ease:'linear' }}
                  className="absolute left-0 right-0 h-[1px]"
                  style={{ background:`linear-gradient(90deg,transparent,${cam.color}50,transparent)` }} />
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.1) 2px,rgba(0,0,0,.1) 4px)' }} />
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <motion.div animate={{ opacity:[1,.2,1] }} transition={{ duration:1.4, repeat:Infinity }}
                    className="w-1 h-1 rounded-full" style={{ background:cam.color }} />
                  <span className="text-[.48rem] font-mono" style={{ color:cam.color }}>{cam.id}</span>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="font-mono font-bold text-base" style={{ color:cam.color }}>{c2.toString().padStart(3,'0')}</span>
                </div>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-[.65rem] text-white/55 font-syne">{cam.zone}</span>
                <span className="text-[.52rem] font-mono font-bold px-2 py-0.5 rounded-md"
                  style={{ color:cam.color, background:`${cam.color}15` }}>{cam.risk}</span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ stat, i }: { stat: typeof stats[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:'-40px' });
  const v = useCountUp(stat.val, inView);
  const I = stat.Icon;
  return (
    <Reveal delay={i*.09} className="h-full">
      <div ref={ref} className="h-full px-8 py-10 rounded-2xl border border-[rgba(78,205,196,.08)] relative overflow-hidden group"
        style={{ background:'rgba(78,205,196,.025)' }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background:'radial-gradient(circle at 50% 0%,rgba(78,205,196,.06),transparent 70%)' }} />
        <I className="w-5 h-5 text-[#4ecdc4] mb-6 opacity-60" />
        <div className="font-syne text-[2.8rem] font-extrabold text-white leading-none tracking-tight">
          {stat.pre??''}{v}{stat.suffix}
        </div>
        <div className="text-white/60 text-[.88rem] mt-3 font-medium">{stat.label}</div>
        <div className="text-white/25 text-[.72rem] mt-1">{stat.sub}</div>
      </div>
    </Reveal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target:heroRef, offset:['start start','end start'] });
  const heroY = useTransform(heroScroll,[0,1],[0,110]);
  const heroOp = useTransform(heroScroll,[0,.55],[1,0]);
  const heroSc = useTransform(heroScroll,[0,1],[1,.96]);

  useEffect(()=>{
    const fn=()=>setScrolled(scrollY>50);
    addEventListener('scroll',fn);
    return ()=>removeEventListener('scroll',fn);
  },[]);

  const navLinks = [
    { href:'#features', label:'Features' },
    { href:'#cameras',  label:'Cameras'  },
    { href:'#process',  label:'Process'  },
    { href:'#contact',  label:'Contact'  },
  ];

  return (
    <div className="min-h-screen bg-[#030508] overflow-x-hidden cursor-none"
      style={{ fontFamily:"'DM Sans',sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-syne{font-family:'Syne',sans-serif}
        .font-jet{font-family:'JetBrains Mono',monospace}
        @keyframes gradShift{0%,100%{background-position:0%}50%{background-position:100%}}
        @keyframes pulseRing{0%,100%{box-shadow:0 0 0 0 rgba(78,205,196,0)}50%{box-shadow:0 0 0 8px rgba(78,205,196,.1)}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#030508}
        ::-webkit-scrollbar-thumb{background:rgba(78,205,196,.25);border-radius:4px}
        @media(max-width:768px){.cursor-none{cursor:auto!important}}
      `}</style>

      <Cursor />
      <ParticleCanvas />

      {/* Noise */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[.032]"
        style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* ── NAV ── */}
      <nav className={`fixed top-0 w-full z-50 px-6 md:px-10 h-[66px] flex items-center justify-between border-b transition-all duration-500 ${scrolled?'border-[rgba(78,205,196,.1)] bg-[rgba(3,5,8,.92)]':'border-transparent bg-[rgba(3,5,8,.4)]'} backdrop-blur-2xl`}>
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{ background:'linear-gradient(135deg,#4ecdc4,#00d4ff)', boxShadow:'0 0 20px rgba(78,205,196,.38)' }}>
            <ShieldCheck className="w-4 h-4 text-[#030508]" />
          </div>
          <span className="font-syne text-[1.05rem] font-bold tracking-tight text-white">CrowdAI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-[.85rem] text-white/38">
          {navLinks.map(({href,label})=>(
            <a key={href} href={href} className="relative hover:text-white transition-colors duration-200 no-underline group py-1">
              {label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-[#4ecdc4] to-[#00d4ff] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden md:flex px-5 py-2 text-[.84rem] text-white/40 hover:text-white transition-colors duration-200 rounded-xl hover:bg-white/[.04] no-underline border border-transparent hover:border-white/[.07]">
            Login
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 px-5 py-2 text-[.84rem] font-medium rounded-xl text-[#030508] no-underline transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
            style={{ background:'linear-gradient(135deg,#4ecdc4,#00d4ff)', boxShadow:'0 0 24px rgba(78,205,196,.28)' }}>
            <Play className="w-3 h-3 fill-[#030508]" />
            Live Demo
          </Link>
          {/* Mobile hamburger */}
          <button className="md:hidden ml-1 p-2 text-white/50 hover:text-white" onClick={()=>setMenuOpen(o=>!o)}>
            {menuOpen ? <X className="w-5 h-5" /> : <AlignJustify className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen&&(
        <div className="fixed inset-0 z-40 bg-[rgba(3,5,8,.96)] backdrop-blur-2xl flex flex-col items-center justify-center gap-8 md:hidden">
          {navLinks.map(({href,label})=>(
            <a key={href} href={href} onClick={()=>setMenuOpen(false)}
              className="text-2xl font-syne font-bold text-white/70 hover:text-white no-underline transition-colors">{label}</a>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center text-center px-6 pt-28 pb-20 z-10">
        <motion.div style={{ y:heroY, opacity:heroOp, scale:heroSc }} className="max-w-3xl mx-auto w-full">

          {/* Eyebrow */}
          <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2, duration:.7 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-8 border border-[rgba(78,205,196,.2)] bg-[rgba(78,205,196,.055)]">
            <motion.span animate={{ opacity:[1,.25,1], scale:[1,.75,1] }} transition={{ duration:2, repeat:Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-[#4ecdc4]" style={{ boxShadow:'0 0 8px #4ecdc4' }} />
            <span className="text-[#4ecdc4] text-[.7rem] font-medium tracking-[.16em] uppercase">Powered by YOLOv8 + DeepSORT</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ delay:.34, duration:.8, ease:[.22,1,.36,1] }}
            className="font-syne text-[clamp(2.9rem,6.5vw,5.2rem)] font-extrabold leading-[.96] tracking-[-0.04em] text-white">
            AI-Powered<br/>Crowd
            <span style={{ background:'linear-gradient(90deg,#4ecdc4,#00d4ff,#39d98a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundSize:'200%', animation:'gradShift 4s ease infinite' }}> Intelligence</span>
          </motion.h1>

          {/* Sub */}
          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.5, duration:.8 }}
            className="mt-6 text-[1.02rem] leading-[1.75] text-white/38 max-w-[480px] mx-auto">
            Real-time monitoring, density prediction & safety management. Transform any venue into a smart, AI-protected environment.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:.65, duration:.8 }}
            className="mt-10 flex items-center justify-center gap-3.5 flex-wrap">
            <Link href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[.88rem] font-semibold text-[#030508] no-underline transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
              style={{ background:'linear-gradient(135deg,#4ecdc4,#00d4ff)', boxShadow:'0 8px 32px rgba(78,205,196,.28)' }}>
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[.88rem] font-medium text-white/65 no-underline border border-white/[.08] bg-white/[.03] hover:bg-white/[.06] hover:border-white/[.15] hover:text-white transition-all duration-300">
              <Play className="w-3.5 h-3.5" />
              Live Demo
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:.82, duration:.8 }}
            className="mt-14 flex justify-center items-center gap-10 md:gap-16 flex-wrap">
            {[{v:'99.2%',l:'Accuracy'},{v:'<50ms',l:'Latency'},{v:'24/7',l:'Monitoring'}].map((s,i)=>(
              <div key={s.l} className={`text-center ${i<3?'border-r border-[rgba(78,205,196,.1)] pr-10 md:pr-16':''}`}>
                <div className="font-syne text-[1.7rem] font-extrabold text-white tracking-tight leading-none">{s.v}</div>
                <div className="text-[.68rem] text-white/28 mt-1.5 tracking-[.08em] uppercase">{s.l}</div>
              </div>
            ))}
          </motion.div>

          <HeroDash />
        </motion.div>
      </section>

      {/* ── CAMERA SECTION ── */}
      <section id="cameras" className="relative z-10 py-28 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <Reveal>
              <div className="text-[.68rem] font-medium tracking-[.17em] uppercase text-[#4ecdc4] mb-3 flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" />
                Live Surveillance Network
              </div>
              <h2 className="font-syne text-[clamp(1.9rem,3.8vw,2.9rem)] font-extrabold tracking-[-0.035em] text-white">
                Every Camera.<br />
                <span style={{ background:'linear-gradient(90deg,#4ecdc4,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Every Moment.</span>
              </h2>
            </Reveal>
            <Reveal delay={.1}>
              <p className="text-white/35 text-[.9rem] leading-[1.7] max-w-xs">
                6 feeds analyzed simultaneously. Every person detected. Every anomaly flagged in real time.
              </p>
            </Reveal>
          </div>

          {/* Status bar */}
          <Reveal delay={.12} className="mb-10">
            <div className="flex flex-wrap gap-3">
              {[
                { Icon: Wifi,         label:'FEEDS ACTIVE',   val:'6 / 6',     color:'#39d98a' },
                { Icon: Users,        label:'TOTAL DETECTED', val:'626',       color:'#4ecdc4' },
                { Icon: AlertTriangle,label:'ALERTS',         val:'2 ACTIVE',  color:'#ff4757' },
                { Icon: Activity,     label:'UPTIME',         val:'99.98 %',   color:'#4ecdc4' },
              ].map(s=>{
                const I=s.Icon;
                return (
                  <div key={s.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[rgba(78,205,196,.09)] bg-[rgba(78,205,196,.03)]">
                    <I className="w-3.5 h-3.5 opacity-50" style={{ color:s.color }} />
                    <span className="text-[.62rem] font-jet text-white/28 tracking-[.1em]">{s.label}</span>
                    <span className="text-[.72rem] font-jet font-bold" style={{ color:s.color }}>{s.val}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* Camera grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map((cam,i)=><CamCard key={cam.id} cam={cam} index={i} />)}
          </div>

          {/* Scroll strip */}
          {/* <Reveal delay={.2} className="mt-16">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(78,205,196,.15)] to-transparent" />
              <span className="text-[.62rem] font-jet text-white/22 tracking-[.14em] uppercase">Continuous feed overview — scroll to pan</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(78,205,196,.15)] to-transparent" />
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-[rgba(78,205,196,.07)]"
              style={{ background:'rgba(3,6,9,.85)' }}>
              <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none"
                style={{ background:'linear-gradient(90deg,rgba(3,6,9,.95),transparent)' }} />
              <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none"
                style={{ background:'linear-gradient(-90deg,rgba(3,6,9,.95),transparent)' }} />
              <ScrollStrip />
            </div>
          </Reveal> */}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s,i)=><StatCard key={s.label} stat={s} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-14">
            <div className="text-[.68rem] font-medium tracking-[.17em] uppercase text-[#4ecdc4] mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Core Capabilities
            </div>
            <h2 className="font-syne text-[clamp(1.9rem,3.8vw,2.9rem)] font-extrabold tracking-[-0.035em] text-white">Intelligent Features</h2>
            <p className="text-white/35 text-[.92rem] leading-[1.75] mt-3 max-w-md">
              Everything you need for comprehensive crowd safety — built on cutting-edge computer vision.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f,i)=>{
              const I=f.Icon;
              return (
                <Reveal key={f.title} delay={i*.07}>
                  <motion.div whileHover={{ y:-5, scale:1.015 }} transition={{ duration:.25 }}
                    className="group p-7 rounded-2xl border border-[rgba(255,255,255,.05)] relative overflow-hidden cursor-pointer"
                    style={{ background:'rgba(6,12,18,.8)' }}>
                    {/* hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                      style={{ background:`radial-gradient(circle at 0% 0%,${f.accent}10,transparent 70%)` }} />
                    {/* top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background:`linear-gradient(90deg,transparent,${f.accent}60,transparent)` }} />
                    {/* Icon box */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                      style={{ background:f.bg, border:`1px solid ${f.accent}25` }}>
                      <I className="w-5 h-5" style={{ color:f.accent }} />
                    </div>
                    <div className="font-syne text-[.95rem] font-bold text-white mb-2.5 tracking-tight">{f.title}</div>
                    <div className="text-[.83rem] leading-[1.68] text-white/38">{f.desc}</div>
                    <div className="mt-5 flex items-center gap-1.5 text-[.72rem] font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:translate-x-0"
                      style={{ color:f.accent }}>
                      Learn more <ChevronRight className="w-3 h-3" />
                    </div>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CRITICAL ZONE CINEMATIC ── */}
      <section className="relative z-10 py-28 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse 70% 80% at 80% 50%,rgba(255,45,85,.04),transparent)' }} />
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left copy */}
            <div>
              <Reveal>
                <div className="text-[.68rem] font-medium tracking-[.17em] uppercase text-[#ff4757] mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Critical Zone Detection
                </div>
                <h2 className="font-syne text-[clamp(1.9rem,3.8vw,2.9rem)] font-extrabold tracking-[-0.035em] text-white mb-6">
                  When Density<br/>
                  <span style={{ background:'linear-gradient(90deg,#ff4757,#ff6b81)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Becomes Danger</span>
                </h2>
                <p className="text-white/38 text-[.92rem] leading-[1.8] mb-10">
                  Our AI monitors every square metre in real time. The moment density crosses safety thresholds, alerts fire instantly — giving your team the critical minutes needed to act before an incident.
                </p>
              </Reveal>

              {/* Density levels */}
              <div className="space-y-4">
                {densityLevels.map((d,i)=>{
                  const I=d.Icon;
                  return (
                    <Reveal key={d.level} delay={i*.1}>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5 w-28 flex-shrink-0">
                          <I className="w-4 h-4 flex-shrink-0" style={{ color:d.color }} />
                          <span className="text-[.6rem] font-jet font-bold tracking-widest" style={{ color:d.color }}>{d.level}</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-white/[.04] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width:0 }} whileInView={{ width:`${d.pct}%` }} viewport={{ once:true }}
                            transition={{ duration:1.3, delay:i*.14, ease:[.22,1,.36,1] }}
                            className="h-full rounded-full"
                            style={{ background:d.color, boxShadow:`0 0 8px ${d.color}55` }} />
                        </div>
                        <span className="text-[.62rem] text-white/28 font-jet w-18 flex-shrink-0">{d.range}</span>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>

            {/* Right — big camera */}
            <Reveal delay={.15}>
              <motion.div whileHover={{ scale:1.018, rotateY:-2 }}
                style={{ transformStyle:'preserve-3d', perspective:'1000px' }}
                className="relative">
                {/* glow */}
                <motion.div animate={{ opacity:[.35,.65,.35] }} transition={{ duration:2.5, repeat:Infinity }}
                  className="absolute -inset-6 rounded-3xl pointer-events-none"
                  style={{ background:'radial-gradient(ellipse,rgba(255,45,85,.12),transparent 70%)' }} />

                <div className="relative rounded-2xl overflow-hidden border border-[rgba(255,71,87,.28)]"
                  style={{ background:'rgba(4,8,12,.96)', boxShadow:'0 0 80px rgba(255,45,85,.1),inset 0 1px 0 rgba(255,71,87,.18)' }}>

                  {/* Big viewport */}
                  <div className="relative bg-[#020506] overflow-hidden" style={{ paddingBottom:'56.25%' }}>
                    <div className="absolute inset-0">
                      {/* Grid */}
                      <div className="absolute inset-0"
                        style={{ backgroundImage:`linear-gradient(rgba(255,71,87,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,71,87,.03) 1px,transparent 1px)`, backgroundSize:'22px 22px' }} />

                      {/* Crowd SVG */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 640 360" preserveAspectRatio="none">
                        <defs>
                          <radialGradient id="bh1" cx="55%" cy="64%" r="45%">
                            <stop offset="0%" stopColor="#ff2d55" stopOpacity=".5" />
                            <stop offset="50%" stopColor="#ff4757" stopOpacity=".22" />
                            <stop offset="100%" stopColor="#ff4757" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="bh2" cx="26%" cy="44%" r="30%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity=".3" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <ellipse cx="352" cy="230" rx="195" ry="116" fill="url(#bh1)" />
                        <ellipse cx="162" cy="158" rx="98" ry="66" fill="url(#bh2)" />
                        {Array.from({length:64}).map((_,i)=>{
                          const s=i*89;
                          const bx=((s*37)%580)+30, by=((s*61)%300)+30;
                          return (
                            <motion.circle key={i} cx={bx} cy={by} r={3.4+(i%3)*.8}
                              fill={by>170?'#ff2d55':'#f59e0b'} opacity={.62}
                              animate={{ cx:[bx,bx+Math.sin(i)*10,bx], cy:[by,by+Math.cos(i)*8,by] }}
                              transition={{ duration:3+(i%4), repeat:Infinity, ease:'easeInOut', delay:i*.08 }} />
                          );
                        })}
                        {/* Detection boxes */}
                        {[{x:278,y:158,w:196,h:148,c:'#ff2d55',l:'CRITICAL ZONE'},{x:62,y:98,w:136,h:108,c:'#f59e0b',l:'HIGH ZONE'}].map((b,i)=>(
                          <g key={i}>
                            <motion.rect x={b.x} y={b.y} width={b.w} height={b.h}
                              fill="none" stroke={b.c} strokeWidth={1.5} strokeDasharray="6 3"
                              animate={{ opacity:[.45,1,.45] }} transition={{ duration:1.6, repeat:Infinity, delay:i*.4 }} />
                            <text x={b.x+6} y={b.y+14} fill={b.c} fontSize={7} fontFamily="JetBrains Mono,monospace" fontWeight="bold" letterSpacing={1}>{b.l}</text>
                          </g>
                        ))}
                      </svg>

                      {/* Scan */}
                      <motion.div animate={{ y:['0%','100%','0%'] }} transition={{ duration:3.5, repeat:Infinity, ease:'linear' }}
                        className="absolute left-0 right-0 h-[2px] pointer-events-none"
                        style={{ background:'linear-gradient(90deg,transparent,rgba(255,45,85,.55),transparent)', boxShadow:'0 0 10px rgba(255,45,85,.35)' }} />

                      {/* Corners */}
                      {['tl','tr','bl','br'].map(c=>(
                        <div key={c} className="absolute w-5 h-5" style={{
                          top:c[0]==='t'?12:'auto', bottom:c[0]==='b'?12:'auto',
                          left:c[1]==='l'?12:'auto', right:c[1]==='r'?12:'auto',
                          borderTop:c[0]==='t'?'2px solid rgba(255,71,87,.65)':'none',
                          borderBottom:c[0]==='b'?'2px solid rgba(255,71,87,.65)':'none',
                          borderLeft:c[1]==='l'?'2px solid rgba(255,71,87,.65)':'none',
                          borderRight:c[1]==='r'?'2px solid rgba(255,71,87,.65)':'none',
                        }} />
                      ))}

                      {/* HUD */}
                      <div className="absolute top-3 left-4 flex items-center gap-2">
                        <motion.div animate={{ opacity:[1,.15,1] }} transition={{ duration:.75, repeat:Infinity }}
                          className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" style={{ boxShadow:'0 0 8px #ff2d55' }} />
                        <span className="text-[.58rem] font-jet text-red-400 tracking-[.1em] font-bold">CAM-02 · CRITICAL ALERT</span>
                      </div>
                      <motion.span animate={{ opacity:[1,0,1] }} transition={{ duration:.65, repeat:Infinity }}
                        className="absolute top-3 right-4 text-[.54rem] font-jet text-red-500 tracking-widest font-bold">● REC</motion.span>

                      <div className="absolute bottom-3 left-4">
                        <div className="text-[.52rem] font-jet text-white/35 tracking-widest mb-0.5">DENSITY / ZONE B</div>
                        <div className="font-jet text-2xl font-bold text-red-400" style={{ textShadow:'0 0 20px rgba(255,45,85,.65)' }}>6.8 p/m²</div>
                      </div>
                      <div className="absolute bottom-3 right-4 text-right">
                        <div className="text-[.52rem] font-jet text-white/35 tracking-widest mb-0.5">DETECTED</div>
                        <div className="font-jet text-2xl font-bold text-red-400">183</div>
                      </div>

                      {/* Scanlines */}
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.12) 2px,rgba(0,0,0,.12) 4px)' }} />
                    </div>
                  </div>

                  {/* Alert bar */}
                  <motion.div animate={{ opacity:[.75,1,.75] }} transition={{ duration:1.1, repeat:Infinity }}
                    className="px-5 py-3 flex items-center gap-3 border-t border-[rgba(255,71,87,.2)]"
                    style={{ background:'rgba(255,45,85,.06)' }}>
                    <motion.div animate={{ scale:[1,1.35,1] }} transition={{ duration:.9, repeat:Infinity }}
                      className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" style={{ boxShadow:'0 0 8px #ff2d55' }} />
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-[.68rem] font-jet text-red-400 tracking-[.08em] font-bold">CRITICAL DENSITY EXCEEDED — EVACUATION PROTOCOL SUGGESTED</span>
                  </motion.div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="process" className="relative z-10 py-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <div className="text-[.68rem] font-medium tracking-[.17em] uppercase text-[#4ecdc4] mb-3 flex items-center justify-center gap-2">
              <ScanLine className="w-3.5 h-3.5" />
              How It Works
            </div>
            <h2 className="font-syne text-[clamp(1.9rem,3.8vw,2.9rem)] font-extrabold tracking-[-0.035em] text-white">
              Four steps to<br />
              <span style={{ background:'linear-gradient(90deg,#4ecdc4,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>total crowd safety</span>
            </h2>
          </Reveal>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
              style={{ background:'linear-gradient(90deg,transparent,rgba(78,205,196,.25) 20%,rgba(78,205,196,.25) 80%,transparent)' }} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s,i)=>{
                const I=s.Icon;
                return (
                  <Reveal key={s.num} delay={i*.1}>
                    <motion.div whileHover={{ scale:1.04, y:-4 }} transition={{ duration:.25 }}
                      className="text-center group cursor-pointer">
                      <div className="relative w-16 h-16 mx-auto mb-6">
                        <motion.div animate={{ opacity:[.4,.7,.4] }} transition={{ duration:2.5, repeat:Infinity, delay:i*.5 }}
                          className="absolute inset-0 rounded-2xl"
                          style={{ background:`rgba(78,205,196,.12)`, filter:'blur(8px)' }} />
                        <div className="relative w-full h-full rounded-2xl flex items-center justify-center border border-[rgba(78,205,196,.18)] transition-all duration-300 group-hover:border-[rgba(78,205,196,.4)]"
                          style={{ background:'linear-gradient(135deg,rgba(78,205,196,.12),rgba(0,212,255,.06))' }}>
                          <I className="w-5 h-5 text-[#4ecdc4]" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[.52rem] font-jet font-bold text-[#030508]"
                          style={{ background:'linear-gradient(135deg,#4ecdc4,#00d4ff)' }}>{s.num.slice(1)}</div>
                      </div>
                      <div className="font-syne text-[.94rem] font-bold text-white mb-2.5 tracking-tight">{s.title}</div>
                      <div className="text-[.82rem] leading-[1.65] text-white/36">{s.desc}</div>
                    </motion.div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH SPECS STRIP ── */}
      <section className="relative z-10 py-16 px-6 md:px-10 border-y border-[rgba(78,205,196,.06)]"
        style={{ background:'rgba(78,205,196,.018)' }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
              {techSpecs.map(({Icon:I,label,val})=>(
                <div key={label} className="text-center group">
                  <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center border border-[rgba(78,205,196,.1)] bg-[rgba(78,205,196,.05)] transition-all duration-300 group-hover:border-[rgba(78,205,196,.25)] group-hover:bg-[rgba(78,205,196,.1)]">
                    <I className="w-4.5 h-4.5 text-[#4ecdc4] w-[18px] h-[18px]" />
                  </div>
                  <div className="text-[.58rem] text-white/28 tracking-[.1em] uppercase mb-1">{label}</div>
                  <div className="text-[.78rem] font-jet font-bold text-[#4ecdc4]">{val}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="relative text-center py-20 px-8 md:px-16 rounded-3xl overflow-hidden border border-[rgba(78,205,196,.14)]"
              style={{ background:'linear-gradient(135deg,rgba(78,205,196,.07) 0%,rgba(0,212,255,.04) 50%,rgba(57,217,138,.06) 100%)' }}>
              {/* Breathe orb */}
              <motion.div animate={{ scale:[.88,1.1,.88], opacity:[.5,.8,.5] }} transition={{ duration:5, repeat:Infinity, ease:'easeInOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{ background:'radial-gradient(circle,rgba(78,205,196,.07),transparent 65%)' }} />
              {/* Grid */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage:`linear-gradient(rgba(78,205,196,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(78,205,196,.03) 1px,transparent 1px)`, backgroundSize:'40px 40px' }} />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(78,205,196,.2)] bg-[rgba(78,205,196,.06)] mb-6">
                  <Lock className="w-3 h-3 text-[#4ecdc4]" />
                  <span className="text-[.65rem] text-[#4ecdc4] font-medium tracking-[.14em] uppercase">Enterprise Ready</span>
                </div>
                <h2 className="font-syne text-[clamp(1.8rem,3.8vw,2.8rem)] font-extrabold tracking-[-0.035em] text-white mb-4">
                  Ready to Secure<br />Your Venue?
                </h2>
                <p className="text-white/38 text-[.92rem] max-w-md mx-auto leading-[1.75]">
                  Deploy CrowdAI in minutes and start monitoring with full AI-powered intelligence. No hardware required.
                </p>
                <div className="mt-9 flex items-center justify-center gap-3.5 flex-wrap">
                  <Link href="/dashboard"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[.9rem] font-semibold text-[#030508] no-underline transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
                    style={{ background:'linear-gradient(135deg,#4ecdc4,#00d4ff)', boxShadow:'0 12px 40px rgba(78,205,196,.32)' }}>
                    Launch Command Center
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/login"
                    className="px-8 py-4 rounded-2xl text-[.9rem] font-medium text-white/55 no-underline border border-white/[.08] bg-white/[.03] hover:bg-white/[.06] hover:text-white transition-all duration-300">
                    View Pricing
                  </Link>
                </div>
                <p className="mt-5 text-[.72rem] text-white/22">No credit card required · Free 14-day trial</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <div>
        
      </div>
      <footer id="contact" className="relative z-10 border-t border-[rgba(78,205,196,.1)] bg-gradient-to-b from-transparent to-black/20">
  {/* Animated gradient line at top */}
  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4ecdc4] to-transparent opacity-50" />
  
  <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
    {/* Main Footer Content */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
      
      {/* Brand Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#4ecdc4] to-[#00d4ff] shadow-lg shadow-[#4ecdc4]/20">
            <ShieldCheck className="w-4.5 h-4.5 text-[#030508]" strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-syne text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              CrowdAI
            </span>
            <p className="text-[0.7rem] text-white/30 font-jet">Intelligent Crowd Management</p>
          </div>
        </div>
        <p className="text-white/40 text-sm leading-relaxed max-w-xs">
          Real-time crowd intelligence and predictive analytics for safer, smarter spaces.
        </p>
        {/* <div className="flex items-center gap-3 pt-2">
          <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-[#4ecdc4]/20 transition-all duration-300 group">
            <Github className="w-4 h-4 text-white/40 group-hover:text-[#4ecdc4] transition-colors" />
          </a>
          <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-[#4ecdc4]/20 transition-all duration-300 group">
            <Twitter className="w-4 h-4 text-white/40 group-hover:text-[#4ecdc4] transition-colors" />
          </a>
          <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-[#4ecdc4]/20 transition-all duration-300 group">
            <Linkedin className="w-4 h-4 text-white/40 group-hover:text-[#4ecdc4] transition-colors" />
          </a>
        </div> */}
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h4 className="text-white/70 text-sm font-semibold tracking-wide flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#4ecdc4]" />
          Quick Links
        </h4>
        <ul className="space-y-2.5">
          {['Dashboard', 'Analytics', 'Heatmap', 'Alerts', 'Live Cameras'].map((link) => (
            <li key={link}>
              <a href="#" className="text-white/40 hover:text-[#4ecdc4] text-sm transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-[#4ecdc4]/40 group-hover:bg-[#4ecdc4] transition-all" />
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Resources */}
      <div className="space-y-4">
        <h4 className="text-white/70 text-sm font-semibold tracking-wide flex items-center gap-2">
          <Database className="w-4 h-4 text-[#4ecdc4]" />
          Resources
        </h4>
        <ul className="space-y-2.5">
          {['Documentation', 'API Reference', 'Integration Guide', 'Privacy Policy', 'Terms of Service'].map((link) => (
            <li key={link}>
              <a href="#" className="text-white/40 hover:text-[#4ecdc4] text-sm transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-[#4ecdc4]/40 group-hover:bg-[#4ecdc4] transition-all" />
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h4 className="text-white/70 text-sm font-semibold tracking-wide flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#4ecdc4]" />
          Contact Us
        </h4>
        <div className="space-y-3">
          <a href="mailto:support@crowdai.com" className="flex items-center gap-2 text-white/40 hover:text-[#4ecdc4] text-sm transition-colors group">
            <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>support@crowdai.com</span>
          </a>
          <a href="tel:+1234567890" className="flex items-center gap-2 text-white/40 hover:text-[#4ecdc4] text-sm transition-colors group">
            <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>+1 (234) 567-890</span>
          </a>
          <div className="flex items-start gap-2 text-white/40 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>123 Innovation Hub,<br />San Francisco, CA 94105</span>
          </div>
        </div>
      </div>
    </div>

    {/* Stats Badges */}
    <div className="flex flex-wrap justify-center gap-4 mb-8 pt-6 border-t border-white/5">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
        <Cpu className="w-4 h-4 text-[#4ecdc4]" />
        <span className="text-white/50 text-xs">99.9% Uptime</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
        <Rocket className="w-4 h-4 text-[#4ecdc4]" />
        <span className="text-white/50 text-xs">Real-time Processing</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
        <Globe className="w-4 h-4 text-[#4ecdc4]" />
        <span className="text-white/50 text-xs">Global Coverage</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
        <Sparkles className="w-4 h-4 text-[#4ecdc4]" />
        <span className="text-white/50 text-xs">AI-Powered Analytics</span>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
      <div className="flex items-center gap-2 text-white/30 text-xs">
        <span>© 2026 CrowdAI</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>All rights reserved</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="flex items-center gap-1">
          Made with <Heart className="w-3 h-3 text-red-400 fill-red-400/20" /> using AI
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        <a href="#" className="text-white/30 hover:text-[#4ecdc4] transition-colors">Privacy</a>
        <a href="#" className="text-white/30 hover:text-[#4ecdc4] transition-colors">Terms</a>
        <a href="#" className="text-white/30 hover:text-[#4ecdc4] transition-colors">Docs</a>
        <a href="#" className="text-white/30 hover:text-[#4ecdc4] transition-colors">API</a>
        <a href="#" className="text-white/30 hover:text-[#4ecdc4] transition-colors">Contact</a>
      </div>
      
      <div className="flex items-center gap-1 text-white/20 text-[10px] font-mono">
        <span>v2.4.1</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="flex items-center gap-1">
          <Coffee className="w-3 h-3" />
          <span>Build stable</span>
        </span>
      </div>
    </div>
  </div>

  {/* Decorative elements */}
  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#4ecdc4]/5 to-transparent pointer-events-none" />
  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#4ecdc4]/5 rounded-full blur-3xl pointer-events-none" />
  <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#4ecdc4]/5 rounded-full blur-3xl pointer-events-none" />
</footer>

    </div>

    
  );
}