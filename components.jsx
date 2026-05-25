/* FOR HOUSE — Reusable UI components & icons
   Exported to window for use across babel scripts
   ============================================================ */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

/* ============ ICONS (inline SVG) ============ */
const Icon = ({ name, size = 16, className = '', style }) => {
  const s = size;
  const p = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', className: `ico ${className}`, style };
  switch (name) {
    case 'dashboard': return (<svg {...p}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>);
    case 'projects': return (<svg {...p}><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21V12h6v9"/></svg>);
    case 'balance': return (<svg {...p}><path d="M12 3v18"/><path d="M3 8h18"/><path d="M3 16h18"/></svg>);
    case 'income': return (<svg {...p}><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>);
    case 'expense': return (<svg {...p}><path d="M12 5v14"/><path d="m5 12 7 7 7-7"/></svg>);
    case 'box': return (<svg {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/></svg>);
    case 'users': return (<svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
    case 'handshake': return (<svg {...p}><path d="m11 17 2 2a1 1 0 0 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/></svg>);
    case 'truck': return (<svg {...p}><path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2"/><path d="M14 8h4l4 4v5a1 1 0 0 1-1 1h-2"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg>);
    case 'dots': return (<svg {...p}><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>);
    case 'tags': return (<svg {...p}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
    case 'overview': return (<svg {...p}><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>);
    case 'plus': return (<svg {...p}><path d="M12 5v14"/><path d="M5 12h14"/></svg>);
    case 'search': return (<svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
    case 'filter': return (<svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>);
    case 'calendar': return (<svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
    case 'edit': return (<svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
    case 'trash': return (<svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
    case 'paperclip': return (<svg {...p}><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.99 8.84L9.41 17.42a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>);
    case 'upload': return (<svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
    case 'download': return (<svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
    case 'print': return (<svg {...p}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>);
    case 'close': return (<svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
    case 'arrow-left': return (<svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
    case 'arrow-right': return (<svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
    case 'check': return (<svg {...p}><polyline points="20 6 9 17 4 12"/></svg>);
    case 'chevron-down': return (<svg {...p}><polyline points="6 9 12 15 18 9"/></svg>);
    case 'chevron-right': return (<svg {...p}><polyline points="9 18 15 12 9 6"/></svg>);
    case 'trend-up': return (<svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
    case 'trend-down': return (<svg {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>);
    case 'warn': return (<svg {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
    case 'info': return (<svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>);
    case 'menu': return (<svg {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
    case 'clock': return (<svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
    case 'send': return (<svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
    case 'document': return (<svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>);
    case 'shield-check': return (<svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>);
    case 'wallet': return (<svg {...p}><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>);
    case 'pie': return (<svg {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>);
    case 'building': return (<svg {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>);
    case 'receipt': return (<svg {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>);
    case 'phone': return (<svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.63 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
    default: return null;
  }
};

/* ============ KIND ICON ============ */
const KindIcon = ({ kind, size = 16 }) => {
  const k = window.KINDS[kind];
  if (!k) return null;
  return <Icon name={k.icon} size={size} />;
};

/* ============ STAT CARD ============ */
const Stat = ({ tone, label, value, unit = 'บาท', delta, deltaTone, hint, icon }) => {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="accent"></div>
      <div className="label">
        {icon ? <span className="dot" style={{display:'none'}}></span> : <span className="dot"></span>}
        {label}
      </div>
      <div className="value-with-icon">
        {icon ? <div className="ic"><Icon name={icon} size={18}/></div> : null}
        <div className="value">
          <span>{value}</span>
          {unit ? <span className="unit">{unit}</span> : null}
        </div>
      </div>
      {delta !== undefined && delta !== null ? (
        <div className={`delta ${deltaTone || 'flat'}`}>
          <Icon name={deltaTone === 'up' ? 'trend-up' : deltaTone === 'down' ? 'trend-down' : 'overview'} size={12} />
          {delta}
        </div>
      ) : hint ? (<div className="delta flat">{hint}</div>) : null}
    </div>
  );
};

/* ============ PROGRESS BAR ============ */
const Bar = ({ value, max, tone, thick, thin }) => {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  let cls = 'bar';
  if (thick) cls += ' thick';
  if (thin) cls += ' thin';
  let toneCls = '';
  const ratio = max > 0 ? value / max : 0;
  if (tone === 'auto') {
    if (ratio > 1) toneCls = 'danger';
    else if (ratio > 0.85) toneCls = 'warn';
  } else if (tone) toneCls = tone;
  return (
    <div className={`${cls} ${toneCls}`}>
      <span style={{ width: pct + '%' }}></span>
    </div>
  );
};

/* ============ BADGE ============ */
const Badge = ({ tone = '', children, dot, lg }) => (
  <span className={`badge ${tone} ${lg ? 'lg' : ''}`}>
    {dot ? <span className="dot"></span> : null}
    {children}
  </span>
);

/* ============ MODAL ============ */
const Modal = ({ open, onClose, title, children, footer, wide }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target.classList.contains('modal-backdrop')) onClose && onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" size={16}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
};

/* ============ EMPTY STATE ============ */
const Empty = ({ icon = 'receipt', title, hint, action }) => (
  <div className="empty">
    <div className="icon-box"><Icon name={icon} size={24}/></div>
    <h3>{title}</h3>
    {hint ? <p>{hint}</p> : null}
    {action || null}
  </div>
);

/* ============ SVG GRADIENT DEFS ============ */
const ChartDefs = () => (
  <svg width="0" height="0" style={{position:'absolute'}}>
    <defs>
      <linearGradient id="grad-brand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45"/>
        <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="grad-danger" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f87171" stopOpacity="0.35"/>
        <stop offset="100%" stopColor="#f87171" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

/* ============ SPARKLINE ============ */
const Sparkline = ({ points, height = 40, color = 'var(--brand)' }) => {
  if (!points || points.length < 2) return <div style={{height: height + 'px'}}/>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 200, H = height;
  const step = W / (points.length - 1);
  const path = points.map((p, i) => {
    const x = i * step;
    const y = H - ((p - min) / range) * (H - 4) - 2;
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  const area = path + ` L${W},${H} L0,${H} Z`;
  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{height}}>
      <path d={area} className="area"/>
      <path d={path} className="line" style={{stroke: color}}/>
    </svg>
  );
};

/* ============ LINE CHART (revenue vs expense over time) ============ */
const LineChart = ({ series, height = 220, labels }) => {
  // series: [{name, color, data:[{x,y}], areaId}]
  if (!series || !series.length) return null;
  const W = 720, H = height;
  const PAD = { l: 60, r: 16, t: 16, b: 28 };
  const allY = series.flatMap(s => s.data.map(d => d.y));
  const allX = series[0].data.map(d => d.x);
  const yMin = 0;
  const yMax = Math.max(...allY) * 1.1 || 1;
  const xMin = 0;
  const xMax = allX.length - 1 || 1;
  const sx = (i) => PAD.l + (i / xMax) * (W - PAD.l - PAD.r);
  const sy = (v) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const yTicks = 4;
  const xStep = Math.max(1, Math.ceil(allX.length / 8));
  return (
    <svg className="line-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <g className="grid">
        {Array.from({length: yTicks + 1}).map((_, i) => {
          const y = PAD.t + (i / yTicks) * (H - PAD.t - PAD.b);
          return <line key={i} x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}/>;
        })}
      </g>
      <g className="axis">
        {Array.from({length: yTicks + 1}).map((_, i) => {
          const v = yMax - (i / yTicks) * (yMax - yMin);
          const y = PAD.t + (i / yTicks) * (H - PAD.t - PAD.b);
          return <text key={i} x={PAD.l - 8} y={y + 3} textAnchor="end">{window.formatBaht(v, {compact: true})}</text>;
        })}
        {allX.map((lab, i) => {
          if (i % xStep !== 0 && i !== allX.length - 1) return null;
          return <text key={i} x={sx(i)} y={H - 10} textAnchor="middle">{lab}</text>;
        })}
      </g>
      {series.map((s, si) => {
        const path = s.data.map((d, i) => (i === 0 ? 'M' : 'L') + sx(i) + ',' + sy(d.y)).join(' ');
        const area = path + ` L${sx(s.data.length - 1)},${H - PAD.b} L${sx(0)},${H - PAD.b} Z`;
        return (
          <g key={si}>
            <path d={area} fill={s.areaColor || s.color} opacity={0.10}/>
            <path d={path} fill="none" stroke={s.color} strokeWidth="2"/>
            {s.data.map((d, i) => (
              <circle key={i} cx={sx(i)} cy={sy(d.y)} r="3" className="dot" stroke={s.color}/>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

/* ============ FILE DROP ============ */
const FileField = ({ value, onChange }) => {
  const onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) onChange(f.name);
  };
  if (value) {
    return (
      <div className="row">
        <span className="file-pill">
          <Icon name="paperclip" size={14}/> {value}
          <button onClick={() => onChange(null)} aria-label="ลบไฟล์"><Icon name="close" size={12}/></button>
        </span>
      </div>
    );
  }
  return (
    <label className="file-drop">
      <input type="file" style={{display:'none'}} onChange={onPick} accept="image/*,application/pdf"/>
      <Icon name="upload" size={16}/> &nbsp;<strong>เลือกไฟล์</strong> หรือลากมาวาง (รูปใบเสร็จ / PDF)
    </label>
  );
};

/* ============ ALERT BANNER ============ */
const Alert = ({ tone = 'warn', icon = 'warn', children }) => (
  <div className={`alert ${tone}`}>
    <Icon name={icon} size={18} className="ico"/>
    <div className="body">{children}</div>
  </div>
);

/* ============ TOAST (simple inline notification) ============ */
const ToastContext = React.createContext({ push: () => {} });
const useToast = () => React.useContext(ToastContext);

/* ============ Confirm dialog ============ */
const Confirm = ({ open, title, message, onConfirm, onClose, danger }) => {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={() => { onConfirm(); onClose(); }}>ยืนยัน</button>
      </>}>
      <div style={{padding: '4px 0 8px'}}>{message}</div>
    </Modal>
  );
};

/* ============ PO helpers ============ */
// Status logic: legacy transactions without status are treated as 'paid' (already disbursed)
function getStatus(t) { return t.status || 'paid'; }
function getPOItems(t) {
  if (t.items && t.items.length) return t.items;
  return [{
    id: (t.id || 'tx') + '_it',
    category: t.category,
    description: t.description,
    qty: 1,
    unit: 'งาน',
    unitPrice: t.amount,
    amount: t.amount
  }];
}
const PO_STATUS = {
  draft:    { label: 'ร่าง',          tone: '',         color: '#a4b0a8', icon: 'edit',     order: 0 },
  pending:  { label: 'รออนุมัติ',     tone: 'warn',     color: '#fbbf24', icon: 'clock',    order: 1 },
  approved: { label: 'อนุมัติแล้ว',   tone: 'info',     color: '#60a5fa', icon: 'check',    order: 2 },
  paid:     { label: 'จ่ายแล้ว',      tone: 'brand',    color: '#22c55e', icon: 'check',    order: 3 },
  rejected: { label: 'ถูกปฏิเสธ',     tone: 'danger',   color: '#f87171', icon: 'close',    order: -1 }
};

/* ============ Aggregations helper ============ */
function aggregateProject(project) {
  const totals = {
    income: 0, incomeNet: 0, incomeDeduction: 0,
    expense: 0, expensePending: 0,
    byKind: { income: 0, material: 0, labor: 0, subcontract: 0, machine: 0, other: 0 },
    pendingByKind: { material: 0, labor: 0, subcontract: 0, machine: 0, other: 0 },
    statusCountByKind: {},
    depositPending: 0,
    depositReturned: 0,
    retentionHeld: 0
  };
  for (const k of (window.EXPENSE_KINDS || [])) {
    totals.statusCountByKind[k] = { draft: 0, pending: 0, approved: 0, paid: 0, rejected: 0 };
  }
  for (const t of project.transactions) {
    if (t.kind === 'income') {
      totals.byKind.income += t.amount;
      totals.income += t.amount;
      // หักออกจากรายรับ (เช่น ค่าธรรมเนียม/หัก ณ ที่จ่าย)
      const ded = t.deductionPct > 0 ? t.amount * (t.deductionPct / 100) : 0;
      totals.incomeDeduction += ded;
      totals.incomeNet += (t.amount - ded);
      continue;
    }
    const status = getStatus(t);
    if (totals.statusCountByKind[t.kind]) {
      totals.statusCountByKind[t.kind][status] = (totals.statusCountByKind[t.kind][status] || 0) + 1;
    }
    if (status === 'paid') {
      totals.byKind[t.kind] += t.amount;
      totals.expense += t.amount;
      if (t.deposit && t.deposit.amount > 0) {
        if (t.deposit.status === 'returned') totals.depositReturned += t.deposit.amount;
        else totals.depositPending += t.deposit.amount;
      }
      if (t.retentionAmount && t.retentionAmount > 0) {
        totals.retentionHeld += t.retentionAmount;
      }
    } else if (status === 'draft' || status === 'pending' || status === 'approved') {
      totals.pendingByKind[t.kind] = (totals.pendingByKind[t.kind] || 0) + t.amount;
      totals.expensePending += t.amount;
    }
  }
  // กำไรคำนวณจาก "รายรับสุทธิ" (หลังหักค่าธรรมเนียม)
  totals.profit = totals.incomeNet - totals.expense;
  totals.margin = totals.incomeNet > 0 ? (totals.profit / totals.incomeNet) * 100 : 0;
  totals.totalBudget = (project.budgets.material || 0) + (project.budgets.labor || 0) + (project.budgets.subcontract || 0) + (project.budgets.machine || 0) + (project.budgets.other || 0);
  totals.contractValue = project.contractValue;
  totals.balanceLeft = project.contractValue - totals.income;
  return totals;
}

/* Effective budget per kind — falls back to sum of category cost prices
   when project.budgets[kind] hasn't been set. */
function effectiveBudget(project, kind) {
  var b = (project.budgets && project.budgets[kind]) || 0;
  if (b > 0) return b;
  var costs = (project.categoryCosts && project.categoryCosts[kind]) || {};
  var sum = 0;
  for (var k in costs) { if (Object.prototype.hasOwnProperty.call(costs, k)) sum += Number(costs[k] || 0); }
  return sum;
}

function totalEffectiveBudget(project) {
  var kinds = window.EXPENSE_KINDS || ['material','labor','subcontract','machine','other'];
  return kinds.reduce(function (s, k) { return s + effectiveBudget(project, k); }, 0);
}

window.effectiveBudget = effectiveBudget;
window.totalEffectiveBudget = totalEffectiveBudget;

/* ============ Vendor advance/retention history helper ============ */
// คืนประวัติการเบิก/หักของช่างทีมเดียวกัน ในหมวดงานเดียวกัน ภายในโครงการเดียวกัน
function getVendorHistory(project, kind, vendorName, excludeId) {
  if (!vendorName || !vendorName.trim()) return [];
  const target = vendorName.trim().toLowerCase();
  return project.transactions
    .filter(t => t.kind === kind && t.id !== excludeId)
    .filter(t => (t.vendor || '').trim().toLowerCase() === target)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ============ Per-project effective role ============ */
// In live mode matches by userId; falls back to name for demo mode.
function getEffectiveRole(project, userName, globalRole) {
  if (!project || !project.members || !project.members.length) return globalRole;
  const cu = window.CURRENT_USER;
  // Live mode: match by userId
  if (cu && cu.id && cu.id !== 'demo') {
    const byId = project.members.find(m => m.userId === cu.id);
    if (byId) return byId.role; // already mapped to UI role by db.js
  }
  // Demo mode: match by name
  const byName = project.members.find(m => (m.displayName || m.name) === userName);
  return byName ? byName.role : globalRole;
}

function monthlyTrend(transactions) {
  // returns ordered array of {label, income, expense}
  const map = new Map();
  for (const t of transactions) {
    const d = new Date(t.date);
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!map.has(k)) map.set(k, { key: k, year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 });
    const e = map.get(k);
    if (t.kind === 'income') e.income += t.amount;
    else e.expense += t.amount;
  }
  const arr = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return arr.map(e => ({
    label: months[e.month],
    income: e.income,
    expense: e.expense
  }));
}

/* ============ CSV export ============ */
function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(x => {
    const s = (x === null || x === undefined) ? '' : String(x);
    if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(',')).join('\n');
  // Add BOM for Excel Thai support
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Export everything to window */
Object.assign(window, {
  Icon, KindIcon, Stat, Bar, Badge, Modal, Empty, ChartDefs, Sparkline, LineChart,
  FileField, Alert, Confirm,
  aggregateProject, getStatus, getPOItems, PO_STATUS, getVendorHistory, getEffectiveRole,
  effectiveBudget, totalEffectiveBudget,
  monthlyTrend, downloadCSV,
  ToastContext, useToast
});
