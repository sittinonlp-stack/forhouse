/* FOR HOUSE — Income Plan module
   - Per-project planned milestones
   - Monthly carry-over of unreceived amounts
   ============================================================ */

/* ============ Helpers: month keys & formatters ============ */
function ymKey(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function ymLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-');
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return months[Number(m) - 1] + ' ' + (Number(y) + 543);
}
function addMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function currentYmKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

/* ============ Compute plan status for a project ============ */
// Returns plan entries enriched with:
//   - receivedAmount: how much was actually received (matched income txs)
//   - status: 'paid' | 'partial' | 'overdue' | 'upcoming'
//   - carryFromMonths: previous months' shortfalls rolled into this entry's month bucket
function computePlanStatus(project, asOfDate) {
  const plan = (project.incomePlan || []).slice().sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const incomes = project.transactions.filter(t => t.kind === 'income');
  const totalReceived = incomes.reduce((s, t) => s + t.amount, 0);

  // Greedy match: walk plan in order, allocate received amount sequentially
  let remaining = totalReceived;
  const today = asOfDate || new Date().toISOString().slice(0, 10);

  return plan.map(p => {
    const allocated = Math.min(remaining, p.plannedAmount);
    remaining -= allocated;
    let status;
    if (allocated >= p.plannedAmount) status = 'paid';
    else if (allocated > 0) status = (p.dueDate < today) ? 'partial-overdue' : 'partial';
    else status = (p.dueDate < today) ? 'overdue' : 'upcoming';
    return {
      ...p,
      receivedAmount: allocated,
      shortfall: p.plannedAmount - allocated,
      status
    };
  });
}

/* ============ Monthly plan view across projects (with carry-over) ============ */
// For a given month YYYY-MM, returns rows of:
// { project, planEntry (or null for carry), originalDueDate, plannedAmount, carriedFrom?, receivedThisMonth, expectedThisMonth }
function buildMonthlyPlan(projects, ymKeyFilter, asOfDate) {
  const out = [];
  const cutoff = asOfDate || new Date().toISOString().slice(0, 10);
  // ymKeyFilter may be like "2026-04"
  const monthFromKey = (k) => k.split('-')[0] + '-' + k.split('-')[1];
  const monthStart = ymKeyFilter + '-01';
  const [yy, mm] = ymKeyFilter.split('-').map(Number);
  const lastDay = new Date(yy, mm, 0).getDate();
  const monthEnd = ymKeyFilter + '-' + String(lastDay).padStart(2, '0');

  for (const project of projects) {
    const plan = computePlanStatus(project, cutoff);

    // Compute incomes received in this specific month
    const monthIncomes = project.transactions.filter(t =>
      t.kind === 'income' && monthFromKey(t.date) === ymKeyFilter
    );
    const receivedThisMonth = monthIncomes.reduce((s, t) => s + t.amount, 0);

    // Plan entries whose dueDate falls in this month
    const entriesThisMonth = plan.filter(p => p.dueDate && monthFromKey(p.dueDate) === ymKeyFilter);

    // Carry-over: plan entries due BEFORE this month with a shortfall, not yet "covered"
    // (i.e., the project's cumulative income hasn't reached up to that entry)
    const carriedEntries = plan.filter(p =>
      p.dueDate && p.dueDate < monthStart &&
      p.shortfall > 0
    );

    // Build rows
    for (const e of entriesThisMonth) {
      out.push({
        project,
        plan: e,
        plannedAmount: e.plannedAmount,
        receivedAmount: e.receivedAmount,
        shortfall: e.shortfall,
        status: e.status,
        carriedFrom: null
      });
    }
    for (const e of carriedEntries) {
      out.push({
        project,
        plan: e,
        plannedAmount: e.shortfall, // only the unpaid portion is carried
        receivedAmount: 0,
        shortfall: e.shortfall,
        status: 'carried',
        carriedFrom: e.dueDate
      });
    }
    // Also append a "receivedThisMonth" line even if no plan due (extra collection / advance)
    if (entriesThisMonth.length === 0 && receivedThisMonth > 0) {
      out.push({
        project,
        plan: null,
        plannedAmount: 0,
        receivedAmount: receivedThisMonth,
        shortfall: 0,
        status: 'extra',
        carriedFrom: null,
        extraNote: 'รับเงินเกินแผนหรือไม่มีแผนในเดือนนี้'
      });
    }
  }
  return out;
}

/* ============ PLAN_STATUS metadata ============ */
const PLAN_STATUS_META = {
  'upcoming':         { label: 'รอรับ',                tone: '',        color: '#a4b0a8', icon: 'clock' },
  'paid':             { label: 'รับครบแล้ว',           tone: 'brand',   color: '#22c55e', icon: 'check' },
  'partial':          { label: 'รับบางส่วน',           tone: 'info',    color: '#60a5fa', icon: 'overview' },
  'partial-overdue':  { label: 'รับบางส่วน (เกินกำหนด)', tone: 'warn',    color: '#fbbf24', icon: 'warn' },
  'overdue':          { label: 'เกินกำหนด',           tone: 'danger',  color: '#f87171', icon: 'warn' },
  'carried':          { label: 'ยกยอดมา',              tone: 'warn',    color: '#fbbf24', icon: 'arrow-right' },
  'extra':            { label: 'รับเพิ่ม',              tone: 'brand',   color: '#22c55e', icon: 'income' }
};

/* ============ Plan Status Badge ============ */
function PlanStatusBadge({ status, large }) {
  const s = PLAN_STATUS_META[status] || PLAN_STATUS_META.upcoming;
  return (
    <Badge tone={s.tone} dot lg={large}>
      <Icon name={s.icon} size={11}/> {s.label}
    </Badge>
  );
}

/* ============ Income Plan Editor Modal ============ */
function IncomePlanEditModal({ project, initial, onClose, onSubmit }) {
  const isEdit = !!initial;
  const [label, setLabel] = useState(initial ? initial.label : '');
  const [dueDate, setDueDate] = useState(initial ? initial.dueDate : new Date().toISOString().slice(0, 10));
  const [plannedAmount, setPlannedAmount] = useState(initial ? String(initial.plannedAmount) : '');
  const [note, setNote] = useState(initial ? initial.note || '' : '');
  // Free-form sub-details (bullet list) — add/remove as needed
  const [details, setDetails] = useState(() => {
    if (initial && Array.isArray(initial.details) && initial.details.length) {
      return initial.details.map(d => ({ id: uid('d'), text: d.text || d }));
    }
    return [];
  });
  const [newDetail, setNewDetail] = useState('');

  const amt = parseFloat(String(plannedAmount).replace(/,/g, '')) || 0;
  const canSubmit = label.trim() && dueDate && amt > 0;

  const addDetail = () => {
    const t = newDetail.trim();
    if (!t) return;
    setDetails(d => [...d, { id: uid('d'), text: t }]);
    setNewDetail('');
  };
  const removeDetail = (id) => setDetails(d => d.filter(x => x.id !== id));
  const updateDetail = (id, text) => setDetails(d => d.map(x => x.id === id ? { ...x, text } : x));

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      id: initial ? initial.id : uid('ip'),
      label: label.trim(),
      dueDate,
      plannedAmount: amt,
      note: note.trim(),
      details: details.filter(d => d.text.trim()).map(d => ({ id: d.id, text: d.text.trim() }))
    });
  };

  // Quick presets for labels
  const presetLabels = [
    'ค่ามัดจำ',
    'งวดที่ 1 - เริ่มงาน',
    'งวดที่ 2 - งานโครงสร้าง',
    'งวดที่ 3 - งานสถาปัตย์',
    'งวดที่ 4 - งานระบบ',
    'งวดที่ 5 - ตกแต่ง',
    'งวดสุดท้าย - ส่งมอบงาน'
  ];

  return (
    <Modal open={true} onClose={onClose}
      title={isEdit ? 'แก้ไขแผนงวดงาน' : 'เพิ่มแผนงวดงานใหม่'}
      wide
      footer={<>
        <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" disabled={!canSubmit} onClick={submit}>
          <Icon name="check" size={14}/> {isEdit ? 'บันทึก' : 'เพิ่มงวด'}
        </button>
      </>}>
      <div className="form-grid">
        <div className="field full">
          <label>ชื่องวดงาน <span className="req">*</span></label>
          <input className="input-base" placeholder="เช่น งวดที่ 1 - เริ่มงาน, ค่ามัดจำ"
            value={label} onChange={e => setLabel(e.target.value)} autoFocus/>
          <div className="row gap-4 mt-8" style={{flexWrap:'wrap'}}>
            {presetLabels.map(p => (
              <button key={p} type="button" className={`chip ${label === p ? 'on' : ''}`}
                onClick={() => setLabel(p)} style={{fontSize:'11.5px', padding:'4px 10px'}}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>วันที่กำหนดรับเงิน <span className="req">*</span></label>
          <input className="input-base" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
        </div>
        <div className="field">
          <label>ยอดที่วางแผนรับ <span className="req">*</span></label>
          <div className="with-suffix">
            <input className="input-base num-input" inputMode="decimal" placeholder="0"
              value={plannedAmount} onChange={e => setPlannedAmount(e.target.value.replace(/[^\d.,]/g, ''))}
              style={{textAlign:'right'}}/>
            <span className="suffix">บาท</span>
          </div>
        </div>
        <div className="field full">
          <label>หมายเหตุ (สรุปสั้นๆ)</label>
          <input className="input-base" placeholder="เช่น เก็บเมื่อเทคาน-เสา ชั้น 1 เสร็จ"
            value={note} onChange={e => setNote(e.target.value)}/>
        </div>

        {/* Free-form sub-detail list */}
        <div className="field full">
          <label>รายละเอียดงวดงาน <span className="dim sublabel">(เพิ่ม/ลด รายการย่อยได้ตามต้องการ)</span></label>
          <div className="plan-details-list">
            {details.length === 0 ? (
              <div className="dim" style={{padding:'8px 12px', fontSize:'12.5px', fontStyle:'italic'}}>
                ยังไม่มีรายการย่อย — เพิ่มได้จากช่องด้านล่าง
              </div>
            ) : details.map((d, idx) => (
              <div key={d.id} className="plan-detail-row">
                <span className="plan-detail-num">{idx + 1}</span>
                <input className="input-base" value={d.text}
                  onChange={e => updateDetail(d.id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDetail(); }}}
                  style={{flex:1, fontSize:'13px'}}/>
                <button className="icon-btn danger" onClick={() => removeDetail(d.id)} title="ลบรายการย่อย" type="button">
                  <Icon name="trash" size={13}/>
                </button>
              </div>
            ))}
            <div className="plan-detail-add">
              <Icon name="plus" size={13} style={{color:'var(--brand-bright)'}}/>
              <input className="input-base" placeholder="พิมพ์เพิ่มรายการย่อย เช่น 'งานวางเหล็กฐานราก', 'งานเทคอนกรีต'..."
                value={newDetail} onChange={e => setNewDetail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDetail(); }}}
                style={{flex:1, fontSize:'13px'}}/>
              <button className="btn sm primary" disabled={!newDetail.trim()} onClick={addDetail} type="button">
                <Icon name="plus" size={12}/> เพิ่ม
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Income Plan Tab (in project) ============ */
function IncomePlanTab({ project, onUpdate, currentRole }) {
  const canEdit = (ROLES[currentRole] || ROLES.staff).canEditPlan;
  const [editing, setEditing] = useState(null);  // null | {} for new | plan entry for edit
  const [confirmDel, setConfirmDel] = useState(null);

  const plan = useMemo(() => computePlanStatus(project), [project]);
  const totals = useMemo(() => {
    const t = { planned: 0, received: 0, shortfall: 0 };
    for (const p of plan) {
      t.planned += p.plannedAmount;
      t.received += p.receivedAmount;
      t.shortfall += p.shortfall;
    }
    return t;
  }, [plan]);

  const overdueCount = plan.filter(p => p.status === 'overdue' || p.status === 'partial-overdue').length;
  const upcomingCount = plan.filter(p => p.status === 'upcoming' || p.status === 'partial').length;

  const upsert = (entry) => {
    const existing = (project.incomePlan || []).some(p => p.id === entry.id);
    const next = existing
      ? (project.incomePlan || []).map(p => p.id === entry.id ? entry : p)
      : [...(project.incomePlan || []), entry];
    next.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    onUpdate({ ...project, incomePlan: next });
    setEditing(null);
  };

  const remove = (id) => {
    onUpdate({ ...project, incomePlan: (project.incomePlan || []).filter(p => p.id !== id) });
    setConfirmDel(null);
  };

  return (
    <div>
      {canEdit ? (
        <Alert tone="info" icon="info">
          <strong>แผนรายรับของโครงการ</strong>
          <p>กำหนดงวดงาน-วันที่-ยอดเงินที่คาดว่าจะเก็บได้ ระบบจะเทียบกับรายรับจริงและคำนวณยอดค้างรับให้ — งวดที่เลยกำหนดและยังไม่ได้รับครบ จะถูกยกยอดไปแสดงในเดือนถัดไปอัตโนมัติ</p>
        </Alert>
      ) : (
        <Alert tone="warn" icon="info">
          <strong>ดูแผนรายรับเท่านั้น</strong> — เฉพาะผู้บริหารสามารถเพิ่มหรือแก้ไขแผนรายรับได้
        </Alert>
      )}

      {/* Summary */}
      <div className="stat-grid">
        <Stat tone="profit" icon="document" label="ยอดวางแผนทั้งโครงการ"
          value={formatBaht(totals.planned)} delta={`${plan.length} งวด`}/>
        <Stat tone="income" icon="income" label="รับมาแล้ว"
          value={formatBaht(totals.received)}
          delta={`${totals.planned > 0 ? Math.round(totals.received / totals.planned * 100) : 0}% ของแผน`} deltaTone={totals.received >= totals.planned ? 'up' : 'flat'}/>
        <Stat tone="margin" icon="clock" label="ยังค้างรับ"
          value={formatBaht(totals.shortfall)}
          delta={`${upcomingCount} งวดรอรับ`} deltaTone="flat"/>
        <Stat tone={overdueCount > 0 ? 'expense' : 'income'} icon="warn" label="เกินกำหนด"
          value={overdueCount} unit="งวด"
          delta={overdueCount > 0 ? 'ต้องติดตามทวงถาม' : 'ไม่มีงวดเกินกำหนด'}
          deltaTone={overdueCount > 0 ? 'down' : 'up'}/>
      </div>

      <div className="between mb-16">
        <div>
          <div className="uppercase muted">รายการแผนงวดงาน</div>
          <div style={{fontSize:'15px', fontWeight:600, marginTop:'2px'}}>
            ทั้งหมด {plan.length} งวด · มูลค่าสัญญา {formatBaht(project.contractValue, {compact: true})} บ.
          </div>
        </div>
        {canEdit ? (
          <button className="btn primary" onClick={() => setEditing({})}>
            <Icon name="plus" size={14}/> เพิ่มแผนงวดงาน
          </button>
        ) : null}
      </div>

      {plan.length === 0 ? (
        <Empty
          icon="document"
          title="ยังไม่มีแผนรายรับ"
          hint="กำหนดงวดงาน-วันที่-ยอดเงิน เพื่อให้ระบบติดตามและแจ้งเตือนได้"
          action={canEdit ? <button className="btn primary sm" onClick={() => setEditing({})}><Icon name="plus" size={14}/> เพิ่มงวดแรก</button> : null}
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{width:'40px'}}>#</th>
                <th>งวดงาน</th>
                <th style={{width:'130px'}}>กำหนดรับ</th>
                <th className="num" style={{width:'150px'}}>ยอดวางแผน</th>
                <th className="num" style={{width:'150px'}}>รับแล้ว</th>
                <th className="num" style={{width:'140px'}}>คงเหลือ</th>
                <th style={{width:'160px'}}>สถานะ</th>
                <th className="actions" style={{width:'80px'}}></th>
              </tr>
            </thead>
            <tbody>
              {plan.map((p, i) => (
                <tr key={p.id}>
                  <td className="mono dim">{i + 1}</td>
                  <td className="desc">
                    <div className="title">{p.label}</div>
                    {p.note ? <div className="sub dim" style={{fontSize:'11.5px', marginTop:'2px'}}>{p.note}</div> : null}
                    {Array.isArray(p.details) && p.details.length > 0 ? (
                      <ul className="plan-detail-bullets">
                        {p.details.map(d => <li key={d.id || d.text}>{d.text || d}</li>)}
                      </ul>
                    ) : null}
                  </td>
                  <td className="date">{formatDate(p.dueDate)}</td>
                  <td className="num"><strong>{formatBaht(p.plannedAmount)}</strong></td>
                  <td className={`num ${p.receivedAmount > 0 ? 'pos' : 'dim'}`}>
                    {p.receivedAmount > 0 ? formatBaht(p.receivedAmount) : '—'}
                  </td>
                  <td className={`num ${p.shortfall > 0 ? 'neg' : 'dim'}`}>
                    {p.shortfall > 0 ? formatBaht(p.shortfall) : '0'}
                  </td>
                  <td><PlanStatusBadge status={p.status}/></td>
                  <td className="actions">
                    {canEdit ? (
                      <>
                        <button className="icon-btn" onClick={() => setEditing(p)} title="แก้ไข"><Icon name="edit" size={13}/></button>
                        <button className="icon-btn danger" onClick={() => setConfirmDel(p.id)} title="ลบ"><Icon name="trash" size={13}/></button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="muted">รวม {plan.length} งวด</td>
                <td className="num"><strong>{formatBaht(totals.planned)}</strong></td>
                <td className="num pos"><strong>{formatBaht(totals.received)}</strong></td>
                <td className={`num ${totals.shortfall > 0 ? 'neg' : ''}`}><strong>{formatBaht(totals.shortfall)}</strong></td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {editing !== null ? (
        <IncomePlanEditModal
          project={project}
          initial={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSubmit={upsert}
        />
      ) : null}
      <Confirm
        open={!!confirmDel}
        title="ยืนยันการลบงวด"
        message="ลบงวดงานออกจากแผนรายรับ — รายการรายรับจริงจะไม่ถูกลบ"
        danger
        onClose={() => setConfirmDel(null)}
        onConfirm={() => remove(confirmDel)}
      />
    </div>
  );
}

/* ============ MONTHLY INCOME PLAN VIEW (Dashboard) ============ */
function MonthlyIncomePlan({ projects, onBack, currentRole }) {
  const role = ROLES[currentRole] || ROLES.staff;
  // Use the manager+ tier (planning info is sensitive)
  const allowed = role.canApprove || role.canViewBalance;
  if (!allowed) {
    return (
      <div>
        <div className="print-hide" style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
          <button className="btn ghost sm" onClick={onBack}>
            <Icon name="arrow-left" size={14}/> กลับแดชบอร์ด
          </button>
        </div>
        <div className="lock-screen">
          <div className="icon-circle"><Icon name="shield-check" size={28}/></div>
          <h2>หน้านี้สำหรับผู้จัดการขึ้นไป</h2>
          <p>แผนรายรับและข้อมูลค้างรับเปิดให้เฉพาะผู้จัดการและผู้บริหารเท่านั้น</p>
          <div className="row" style={{justifyContent:'center', gap:'8px'}}>
            <span className="dim" style={{fontSize:'12px'}}>สิทธิ์ปัจจุบัน:</span>
            <span className={`role-badge ${role.key}`}>{role.short} · {role.label}</span>
          </div>
        </div>
      </div>
    );
  }

  const [ym, setYm] = useState(currentYmKey());

  const rows = useMemo(() => buildMonthlyPlan(projects, ym), [projects, ym]);

  const totals = useMemo(() => {
    let planned = 0, received = 0, carried = 0;
    for (const r of rows) {
      planned += r.plannedAmount;
      received += r.receivedAmount;
      if (r.status === 'carried') carried += r.plannedAmount;
    }
    return { planned, received, shortfall: planned - received, carried };
  }, [rows]);

  // Group rows by project
  const byProject = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r.project.id)) m.set(r.project.id, { project: r.project, rows: [], planned: 0, received: 0 });
      const e = m.get(r.project.id);
      e.rows.push(r);
      e.planned += r.plannedAmount;
      e.received += r.receivedAmount;
    }
    return Array.from(m.values()).sort((a, b) => b.planned - a.planned);
  }, [rows]);

  const print = () => window.print();
  const exportCSV = () => {
    const csvRows = [['โครงการ', 'งวดงาน', 'กำหนดรับ', 'ยอดวางแผน', 'รับแล้ว', 'คงเหลือ', 'สถานะ', 'หมายเหตุ']];
    for (const r of rows) {
      csvRows.push([
        r.project.name,
        r.plan ? r.plan.label : '(รับเพิ่มเติม)',
        r.carriedFrom ? `ยกมาจาก ${formatDate(r.carriedFrom)}` : (r.plan ? formatDate(r.plan.dueDate) : ''),
        r.plannedAmount,
        r.receivedAmount,
        r.shortfall,
        (PLAN_STATUS_META[r.status] || {}).label || r.status,
        r.plan?.note || r.extraNote || ''
      ]);
    }
    downloadCSV(`Monthly_IncomePlan_${ym}_${new Date().toISOString().slice(0,10)}.csv`, csvRows);
  };

  return (
    <div>
      <div className="print-hide" style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
        <button className="btn ghost sm" onClick={onBack}>
          <Icon name="arrow-left" size={14}/> กลับแดชบอร์ด
        </button>
        <span className={`role-badge ${role.key}`} style={{marginLeft:'auto'}}>
          <Icon name="shield-check" size={11}/> {role.short} · {role.label}
        </span>
      </div>

      <div className="page-header print-hide">
        <div className="titles">
          <h1>แผนรายรับรายเดือน</h1>
          <div className="sub">รวมแผนงวดงานของทุกโครงการในเดือนที่เลือก — งวดที่เลยกำหนดจะถูกยกยอดมาแสดงอัตโนมัติ</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={exportCSV}><Icon name="download" size={14}/> ส่งออก CSV</button>
          <button className="btn primary" onClick={print}><Icon name="print" size={14}/> พิมพ์รายงาน</button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="bs-controls print-hide">
        <button className="icon-btn" onClick={() => setYm(addMonth(ym, -1))} title="เดือนก่อนหน้า">
          <Icon name="arrow-left" size={16}/>
        </button>
        <div className="month-display">
          <Icon name="calendar" size={14}/>
          <strong>{ymLabel(ym)}</strong>
        </div>
        <button className="icon-btn" onClick={() => setYm(addMonth(ym, 1))} title="เดือนถัดไป">
          <Icon name="arrow-right" size={16}/>
        </button>
        <input className="input-base" type="month" value={ym} onChange={e => setYm(e.target.value)} style={{width:'auto', marginLeft:'8px'}}/>
        <button className="btn ghost sm" onClick={() => setYm(currentYmKey())} style={{marginLeft:'4px'}}>
          เดือนปัจจุบัน
        </button>
        <div style={{flex:1}}></div>
        <span className="label-tag">โครงการ:</span>
        <Badge>{byProject.length} โครงการ</Badge>
        <Badge>{rows.length} งวด</Badge>
      </div>

      {/* KPIs */}
      <div className="stat-grid">
        <Stat tone="profit" icon="document" label="ยอดวางแผนเดือนนี้"
          value={formatBaht(totals.planned)} delta={`${rows.length} งวดในเดือน ${ymLabel(ym)}`}/>
        <Stat tone="income" icon="income" label="รับแล้วในเดือนนี้"
          value={formatBaht(totals.received)}
          delta={`${totals.planned > 0 ? Math.round(totals.received / totals.planned * 100) : 0}% ของแผน`}
          deltaTone={totals.received >= totals.planned ? 'up' : 'flat'}/>
        <Stat tone="margin" icon="clock" label="ยังค้างรับ"
          value={formatBaht(totals.shortfall)}
          delta={totals.shortfall > 0 ? 'จะถูกยกยอดเดือนหน้า' : 'รับครบตามแผน'}
          deltaTone={totals.shortfall > 0 ? 'down' : 'up'}/>
        <Stat tone="expense" icon="arrow-right" label="ยกยอดมาจากเดือนก่อน"
          value={formatBaht(totals.carried)}
          delta={totals.carried > 0 ? 'งวดที่ยังไม่ได้รับ' : 'ไม่มีค้างมา'}
          deltaTone={totals.carried > 0 ? 'down' : 'up'}/>
      </div>

      {/* Project groups */}
      {byProject.length === 0 ? (
        <Empty
          icon="document"
          title={`ไม่มีแผนรายรับในเดือน ${ymLabel(ym)}`}
          hint="ลองดูเดือนอื่น หรือเพิ่มแผนงวดงานในโครงการ"
        />
      ) : byProject.map(({ project, rows: prRows, planned, received }) => (
        <div key={project.id} className="card mb-16">
          <div className="between mb-12" style={{paddingBottom:'12px', borderBottom:'1px solid var(--border)'}}>
            <div className="row gap-12">
              <div className="thumb" style={{width:'42px', height:'42px', borderRadius:'var(--r-sm)', background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--brand-bright)'}}>
                <Icon name="building" size={20}/>
              </div>
              <div>
                <div style={{fontWeight:600, fontSize:'14.5px'}}>{project.name}</div>
                <div className="dim mono" style={{fontSize:'12px'}}>{project.code}</div>
              </div>
            </div>
            <div className="row gap-16">
              <div style={{textAlign:'right'}}>
                <div className="uppercase muted">วางแผน</div>
                <div className="mono" style={{fontSize:'15px', fontWeight:500}}>{formatBaht(planned)} บ.</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="uppercase muted">รับแล้ว</div>
                <div className={`mono ${received > 0 ? 'pos' : 'dim'}`} style={{fontSize:'15px', fontWeight:500}}>{formatBaht(received)} บ.</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="uppercase muted">คงเหลือ</div>
                <div className={`mono ${planned - received > 0 ? 'neg' : 'pos'}`} style={{fontSize:'15px', fontWeight:600}}>{formatBaht(planned - received)} บ.</div>
              </div>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>งวดงาน / รายการ</th>
                  <th style={{width:'140px'}}>กำหนดรับ</th>
                  <th className="num" style={{width:'140px'}}>ยอดวางแผน</th>
                  <th className="num" style={{width:'140px'}}>รับแล้ว</th>
                  <th className="num" style={{width:'140px'}}>คงเหลือ</th>
                  <th style={{width:'180px'}}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {prRows.map((r, i) => (
                  <tr key={(r.plan?.id || 'extra') + '-' + i}>
                    <td className="desc">
                      <div className="title">{r.plan ? r.plan.label : <em className="dim">รับเงินเพิ่มเติม</em>}</div>
                      {r.plan?.note ? <div className="sub dim" style={{fontSize:'11.5px'}}>{r.plan.note}</div> : null}
                      {r.extraNote ? <div className="sub dim" style={{fontSize:'11.5px'}}>{r.extraNote}</div> : null}
                    </td>
                    <td className="date">
                      {r.carriedFrom ? (
                        <span style={{color:'var(--warn-bright)'}}>
                          <Icon name="arrow-right" size={11}/> ยกมาจาก {formatDate(r.carriedFrom)}
                        </span>
                      ) : r.plan?.dueDate ? formatDate(r.plan.dueDate) : '—'}
                    </td>
                    <td className="num"><strong>{formatBaht(r.plannedAmount)}</strong></td>
                    <td className={`num ${r.receivedAmount > 0 ? 'pos' : 'dim'}`}>
                      {r.receivedAmount > 0 ? formatBaht(r.receivedAmount) : '—'}
                    </td>
                    <td className={`num ${r.shortfall > 0 ? 'neg' : 'dim'}`}>
                      {r.shortfall > 0 ? formatBaht(r.shortfall) : '0'}
                    </td>
                    <td><PlanStatusBadge status={r.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  computePlanStatus, buildMonthlyPlan, ymKey, ymLabel, addMonth, currentYmKey,
  PLAN_STATUS_META, PlanStatusBadge,
  IncomePlanEditModal, IncomePlanTab, MonthlyIncomePlan
});
