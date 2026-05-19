/* FOR HOUSE — Screens: Dashboard, ProjectView, BalanceSheet
   + Modal forms for transactions & category management
   ============================================================ */

const SCR = {}; // will be exported to window at the end

/* ============================================================
   DASHBOARD — overview of all projects
   ============================================================ */
function Dashboard({ projects, onOpenProject, onNewProject, onOpenAllBalance, onOpenMonthlyPlan }) {
  const all = useMemo(() => {
    const totals = { income: 0, expense: 0, profit: 0, contract: 0, budget: 0 };
    const list = projects.map(p => {
      const agg = aggregateProject(p);
      totals.income += agg.income;
      totals.expense += agg.expense;
      totals.profit += agg.profit;
      totals.contract += p.contractValue;
      totals.budget += agg.totalBudget;
      return { project: p, agg };
    });
    const margin = totals.income > 0 ? (totals.profit / totals.income) * 100 : 0;
    return { totals, margin, list };
  }, [projects]);

  // Combined monthly trend across all projects
  const trend = useMemo(() => {
    const allTx = projects.flatMap(p => p.transactions);
    return monthlyTrend(allTx);
  }, [projects]);

  return (
    <div>
      <div className="page-header">
        <div className="titles">
          <h1>แดชบอร์ดรวมโครงการ</h1>
          <div className="sub">ภาพรวมรายรับ-รายจ่ายและกำไรของทุกโครงการที่กำลังดำเนินงาน · {projects.length} โครงการ</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={onOpenMonthlyPlan}>
            <Icon name="document" size={16}/> แผนรายรับรายเดือน
          </button>
          <button className="btn" onClick={onOpenAllBalance}>
            <Icon name="balance" size={16}/> งบดุลรวมรายวัน/รายเดือน
          </button>
          <button className="btn primary" onClick={onNewProject}>
            <Icon name="plus" size={16}/> เพิ่มโครงการใหม่
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat tone="income" icon="income" label="รายรับรวมทุกโครงการ"
          value={formatBaht(all.totals.income)}
          delta={`จาก ${formatBaht(all.totals.contract, {compact: true})} ของมูลค่าสัญญารวม`} deltaTone="flat"/>
        <Stat tone="expense" icon="expense" label="รายจ่ายรวมทุกโครงการ"
          value={formatBaht(all.totals.expense)}
          delta={`คิดเป็น ${all.totals.income > 0 ? Math.round(all.totals.expense / all.totals.income * 100) : 0}% ของรายรับ`} deltaTone="flat"/>
        <Stat tone="profit" icon="wallet" label="กำไร/ขาดทุนสุทธิรวม"
          value={formatBaht(all.totals.profit)}
          delta={all.totals.profit >= 0 ? 'กำไรสะสม' : 'ขาดทุนสะสม'} deltaTone={all.totals.profit >= 0 ? 'up' : 'down'}/>
        <Stat tone="margin" icon="pie" label="อัตรากำไรขั้นต้นรวม" unit="%"
          value={all.margin.toFixed(1)}
          delta={all.margin >= 15 ? 'อยู่ในเกณฑ์ดี' : all.margin >= 5 ? 'พอใช้' : all.margin >= 0 ? 'ควรเฝ้าระวัง' : 'ติดลบ'}
          deltaTone={all.margin >= 15 ? 'up' : all.margin >= 0 ? 'flat' : 'down'}/>
      </div>

      {trend.length > 1 ? (
        <div className="card mb-24">
          <div className="between mb-16">
            <div>
              <div className="uppercase muted">รายรับ vs รายจ่ายรวมตามเดือน</div>
              <div style={{fontSize:'15px', fontWeight:600, marginTop:4}}>กระแสเงินสดรายเดือน</div>
            </div>
            <div className="legend">
              <span className="item"><span className="swatch" style={{background:'var(--brand)'}}></span> รายรับ</span>
              <span className="item"><span className="swatch" style={{background:'var(--danger)'}}></span> รายจ่าย</span>
            </div>
          </div>
          <LineChart series={[
            { name: 'รายรับ', color: '#22c55e', data: trend.map((t, i) => ({ x: t.label, y: t.income })) },
            { name: 'รายจ่าย', color: '#f87171', data: trend.map((t, i) => ({ x: t.label, y: t.expense })) }
          ]}/>
        </div>
      ) : null}

      <div className="between mb-16">
        <div className="uppercase muted">รายการโครงการทั้งหมด</div>
        <Badge>{projects.length} โครงการ</Badge>
      </div>

      <div className="project-grid">
        {all.list.map(({ project, agg }) => {
          // budget alert
          let overBudget = false;
          for (const k of EXPENSE_KINDS) {
            if (project.budgets[k] > 0 && agg.byKind[k] > project.budgets[k]) { overBudget = true; break; }
          }
          const status = agg.profit < 0 ? 'danger' : overBudget ? 'warn' : 'brand';
          const statusText = agg.profit < 0 ? 'ขาดทุน' : overBudget ? 'รายจ่ายเกินงบ' : 'กำไรปกติ';
          return (
            <button key={project.id} className="project-card shimmer" onClick={() => onOpenProject(project.id)}>
              <div className="head">
                <div className="thumb"><Icon name="building" size={22}/></div>
                <div className="info">
                  <div className="name">{project.name}</div>
                  <div className="meta">
                    <span className="mono">{project.code}</span>
                    <span className="sep">·</span>
                    <span>{project.location}</span>
                  </div>
                </div>
                <Badge tone={status} dot>{statusText}</Badge>
              </div>

              <div className="stats">
                <div className="cell">
                  <div className="label">รับมาแล้ว</div>
                  <div className="v">{formatBaht(agg.income)} <span style={{fontSize:'11px', color:'var(--text-3)'}}>บ.</span></div>
                </div>
                <div className="cell">
                  <div className="label">จ่ายไปแล้ว</div>
                  <div className="v">{formatBaht(agg.expense)} <span style={{fontSize:'11px', color:'var(--text-3)'}}>บ.</span></div>
                </div>
                <div className="cell">
                  <div className="label">กำไรปัจจุบัน</div>
                  <div className={`v ${agg.profit >= 0 ? 'pos' : 'neg'}`}>{formatBaht(agg.profit)}</div>
                </div>
                <div className="cell">
                  <div className="label">Margin</div>
                  <div className={`v ${agg.margin >= 0 ? 'pos' : 'neg'}`}>{agg.margin.toFixed(1)}%</div>
                </div>
              </div>

              <div className="progress-row">
                <div className="progress-label">
                  <span>ความคืบหน้างาน</span>
                  <strong>{Math.round(project.progress * 100)}%</strong>
                </div>
                <Bar value={project.progress * 100} max={100} tone="brand"/>
                <div className="progress-label">
                  <span>เก็บเงินจากเจ้าของงาน</span>
                  <strong>{Math.round(agg.income / project.contractValue * 100)}%</strong>
                </div>
                <Bar value={agg.income} max={project.contractValue} thin tone="brand"/>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   PROJECT VIEW
   ============================================================ */
function ProjectView({ project, onBack, onUpdate, onDelete, onOpenBalance, currentRole }) {
  const [tab, setTab] = useState('overview');
  const role = ROLES[currentRole] || ROLES.staff;
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [editTx, setEditTx] = useState(null);     // income edit
  const [addingIncome, setAddingIncome] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  // PO state
  const [poEditor, setPOEditor] = useState(null);  // { kind, po? }
  const [poDetail, setPODetail] = useState(null);  // po

  const agg = useMemo(() => aggregateProject(project), [project]);

  const addTx = useCallback((tx) => {
    const np = { ...project, transactions: [{ ...tx, id: tx.id || genId() }, ...project.transactions] };
    onUpdate(np);
    if (window.notify) {
      const label = (KINDS[tx.kind] && KINDS[tx.kind].short) || 'รายการ';
      window.notify(`เพิ่ม${label} ${formatBaht(tx.amount)} บาทเรียบร้อย`, 'success');
    }
  }, [project, onUpdate]);

  const updateTx = useCallback((tx) => {
    const np = { ...project, transactions: project.transactions.map(t => t.id === tx.id ? tx : t) };
    onUpdate(np);
    if (window.notify) window.notify('บันทึกการแก้ไขรายการแล้ว', 'info');
  }, [project, onUpdate]);

  const removeTx = useCallback((id) => {
    const np = { ...project, transactions: project.transactions.filter(t => t.id !== id) };
    onUpdate(np);
    if (window.notify) window.notify('ลบรายการแล้ว', 'info');
  }, [project, onUpdate]);

  // PO save: insert if new, update if existing
  const savePO = useCallback((po) => {
    const exists = project.transactions.some(t => t.id === po.id);
    const np = exists
      ? { ...project, transactions: project.transactions.map(t => t.id === po.id ? po : t) }
      : { ...project, transactions: [po, ...project.transactions] };
    onUpdate(np);
    setPOEditor(null);
    // refresh detail if showing same
    setPODetail(d => d && d.id === po.id ? po : d);
    if (window.notify) {
      const kindShort = (KINDS[po.kind] && KINDS[po.kind].short) || '';
      if (!exists) {
        window.notify(`สร้างใบสั่งซื้อ ${po.code || ''} (${kindShort}) สำเร็จ`, 'success');
      } else if (po.status === 'paid') {
        window.notify(`บันทึกการชำระเงิน ${po.code || ''} เรียบร้อย`, 'success');
      } else if (po.status === 'approved') {
        window.notify(`อนุมัติ ${po.code || ''} แล้ว`, 'success');
      } else if (po.status === 'rejected') {
        window.notify(`ปฏิเสธ ${po.code || ''}`, 'warn');
      } else if (po.deposit && po.deposit.status === 'returned') {
        window.notify(`บันทึกรับคืนเงินประกัน ${po.code || ''} แล้ว`, 'success');
      } else {
        window.notify(`บันทึกการเปลี่ยนแปลง ${po.code || ''}`, 'info');
      }
    }
  }, [project, onUpdate]);

  const updateCategories = useCallback((kind, cats) => {
    const np = { ...project, categories: { ...project.categories, [kind]: cats } };
    onUpdate(np);
  }, [project, onUpdate]);

  const updateCategoryCost = useCallback((kind, name, cost) => {
    const all = { ...(project.categoryCosts || {}) };
    all[kind] = { ...(all[kind] || {}), [name]: Number(cost) || 0 };
    onUpdate({ ...project, categoryCosts: all });
  }, [project, onUpdate]);

  const bulkSaveCategories = useCallback((newCats, newCosts) => {
    onUpdate({ ...project, categories: newCats, categoryCosts: newCosts });
  }, [project, onUpdate]);

  const TABS = [
    { key: 'overview', label: 'ภาพรวม', icon: 'overview' },
    { key: 'income', label: 'รายรับงวดงาน', icon: 'income' },
    { key: 'material', label: 'วัสดุ', icon: 'box' },
    { key: 'labor', label: 'แรงงาน', icon: 'users' },
    { key: 'subcontract', label: 'รับเหมาช่วง', icon: 'handshake' },
    { key: 'machine', label: 'เครื่องจักร', icon: 'truck' },
    { key: 'other', label: 'อื่นๆ', icon: 'dots' },
    { key: 'team', label: 'ทีมงาน', icon: 'users' },
    { key: 'plan', label: 'แผนรายรับ', icon: 'document' },
    { key: 'categories', label: 'จัดการหมวดหมู่', icon: 'tags' }
  ];

  const counts = useMemo(() => {
    const c = { overview: 0, categories: 0 };
    for (const k of ALL_KINDS) c[k] = 0;
    for (const t of project.transactions) c[t.kind] = (c[t.kind] || 0) + 1;
    return c;
  }, [project]);

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
        <button className="btn ghost sm" onClick={onBack}>
          <Icon name="arrow-left" size={14}/> กลับแดชบอร์ด
        </button>
        <span className="dim mono" style={{fontSize:'12px'}}>{project.code}</span>
      </div>

      <div className="page-header">
        <div className="titles">
          <h1>{project.name}</h1>
          <div className="sub">
            {project.client} · {project.location} · {formatDateLong(project.startDate)}—{formatDateLong(project.endDate)}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={onOpenBalance}>
            <Icon name="balance" size={16}/> งบดุลโครงการ
          </button>
          <button className="btn primary" onClick={() => {
            if (tab === 'income') setAddingIncome(true);
            else if (tab === 'overview' || tab === 'categories') setPOEditor({ kind: 'material' });
            else setPOEditor({ kind: tab });
          }}>
            <Icon name="plus" size={16}/> {tab === 'income' ? 'เพิ่มรายรับ' : 'สร้างใบสั่งซื้อ'}
          </button>
        </div>
      </div>

      {/* Project KPIs */}
      <div className="stat-grid">
        <Stat tone="income" icon="income" label="ต้นทุนโครงการ"
          value={formatBaht(agg.incomeNet)}
          delta={agg.incomeDeduction > 0
            ? `จากเก็บจริง ${formatBaht(agg.income, {compact:true})} บ. (หัก ${formatBaht(agg.incomeDeduction, {compact:true})} บ.)`
            : `${project.contractValue > 0 ? Math.round(agg.income / project.contractValue * 100) : 0}% ของ ${formatBaht(project.contractValue, {compact:true})} มูลค่าสัญญา`}
          deltaTone="flat"/>
        <Stat tone="expense" icon="expense" label="จ่ายต้นทุนแล้ว"
          value={formatBaht(agg.expense)}
          delta={`เทียบงบประมาณ ${agg.totalBudget > 0 ? Math.round(agg.expense / agg.totalBudget * 100) : 0}%`} deltaTone="flat"/>
        <Stat tone="profit" icon="wallet" label="กำไร/ขาดทุนสุทธิ"
          value={formatBaht(agg.profit)}
          delta={agg.incomeDeduction > 0 ? 'คำนวณจากรายรับสุทธิหลังหัก' : (agg.profit >= 0 ? 'อยู่ในแดน + ' : 'ขาดทุนปัจจุบัน')}
          deltaTone={agg.profit >= 0 ? 'up' : 'down'}/>
        <Stat tone="margin" icon="pie" label="อัตรากำไร" unit="%"
          value={agg.margin.toFixed(1)}
          delta={`คาดมูลค่าสัญญาเต็ม: ${formatBaht(project.contractValue - agg.expense, {compact:true})}`} deltaTone="flat"/>
      </div>

      {/* Budget alerts */}
      {(() => {
        const alerts = [];
        for (const k of EXPENSE_KINDS) {
          const b = effectiveBudget(project, k);
          const a = agg.byKind[k] || 0;
          if (b > 0 && a > b) alerts.push({ kind: k, budget: b, actual: a, over: a - b });
          else if (b > 0 && a / b > 0.9 && a <= b) alerts.push({ kind: k, budget: b, actual: a, warn: true });
        }
        if (!alerts.length) return null;
        return (
          <div className="mb-24">
            {alerts.map((al, i) => (
              <Alert key={i} tone={al.over ? 'danger' : 'warn'} icon="warn">
                <strong>{KINDS[al.kind].label}</strong>
                {al.over
                  ? <> มีรายจ่ายเกินงบประมาณ <span className="mono">{formatBaht(al.over)} บาท</span> (จ่ายจริง {formatBaht(al.actual)} / ตั้งงบ {formatBaht(al.budget)})</>
                  : <> ใช้งบไปแล้ว <span className="mono">{Math.round(al.actual / al.budget * 100)}%</span> ของงบ {formatBaht(al.budget)} บาท — ใกล้เต็มงบ</>
                }
              </Alert>
            ))}
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            <Icon name={t.icon} size={15}/> {t.label}
            {t.key !== 'overview' && t.key !== 'categories' ? <span className="count">{counts[t.key] || 0}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <OverviewTab project={project} agg={agg} onOpenPO={(po) => setPODetail(po)} onGoToCategories={() => setTab('categories')}/>
      ) : tab === 'team' ? (
        <TeamTab project={project} onUpdate={onUpdate} currentRole={currentRole} onDeleteProject={() => setConfirmDeleteProject(true)}/>
      ) : tab === 'plan' ? (
        <IncomePlanTab project={project} onUpdate={onUpdate} currentRole={currentRole}/>
      ) : tab === 'categories' ? (
        <CategoriesTab project={project} onBulkSave={bulkSaveCategories} currentRole={currentRole}/>
      ) : tab === 'income' ? (
        <TransactionsTab
          kind={tab}
          project={project}
          onAdd={() => setAddingIncome(true)}
          onEdit={setEditTx}
          onDelete={(id) => setConfirmDel(id)}
        />
      ) : (
        <PurchaseOrdersTab
          kind={tab}
          project={project}
          agg={agg}
          onAdd={() => setPOEditor({ kind: tab })}
          onOpen={(po) => setPODetail(po)}
        />
      )}
      {/* Modals */}
      {addingIncome ? (
        <TransactionModal
          mode="add"
          kind="income"
          project={project}
          onClose={() => setAddingIncome(false)}
          onSubmit={(t) => { addTx(t); setAddingIncome(false); }}
        />
      ) : null}
      {editTx ? (
        <TransactionModal
          mode="edit"
          kind={editTx.kind}
          project={project}
          initial={editTx}
          onClose={() => setEditTx(null)}
          onSubmit={(t) => { updateTx(t); setEditTx(null); }}
        />
      ) : null}
      {poEditor ? (
        <POEditorModal
          project={project}
          defaultKind={poEditor.kind}
          initial={poEditor.po}
          onClose={() => setPOEditor(null)}
          onSubmit={savePO}
        />
      ) : null}
      {poDetail ? (
        <PODetailModal
          project={project}
          po={project.transactions.find(t => t.id === poDetail.id) || poDetail}
          onClose={() => setPODetail(null)}
          onEdit={(po) => { setPODetail(null); setPOEditor({ kind: po.kind, po }); }}
          onAction={(po) => { savePO(po); }}
          onDelete={(id) => { removeTx(id); setPODetail(null); }}
        />
      ) : null}
      <Confirm
        open={!!confirmDel}
        title="ยืนยันการลบรายการ"
        message="ระบบจะลบรายการนี้ออกจากบัญชีโครงการ ดำเนินการต่อหรือไม่?"
        danger
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { removeTx(confirmDel); setConfirmDel(null); }}
      />
      {confirmDeleteProject ? (
        <Modal open={true} onClose={() => { setConfirmDeleteProject(false); setDeleteConfirmText(''); }} title="ยืนยันการลบโครงการ"
          footer={<>
            <button className="btn ghost" onClick={() => { setConfirmDeleteProject(false); setDeleteConfirmText(''); }}>ยกเลิก</button>
            <button className="btn danger"
              disabled={deleteConfirmText !== project.name}
              onClick={() => { setConfirmDeleteProject(false); setDeleteConfirmText(''); onDelete && onDelete(); }}>
              <Icon name="trash" size={14}/> ลบถาวร
            </button>
          </>}>
          <div className="col gap-16">
            <Alert tone="danger" icon="warn">
              <strong>การลบนี้ไม่สามารถยกเลิกได้</strong>
              <p style={{margin:'6px 0 0', fontSize:'12.5px'}}>
                ระบบจะลบ <strong>โครงการ "{project.name}"</strong> รวมถึงรายรับ ใบสั่งซื้อ แผนรายรับ สมาชิก และไฟล์แนบทั้งหมดอย่างถาวร
              </p>
            </Alert>
            <div className="field" style={{margin:0}}>
              <label>พิมพ์ชื่อโครงการเพื่อยืนยัน: <strong>{project.name}</strong></label>
              <input className="input-base" autoFocus placeholder={project.name}
                value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}/>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

/* ===== Overview tab ===== */
function OverviewTab({ project, agg, onOpenPO, onGoToCategories }) {
  const trend = useMemo(() => monthlyTrend(project.transactions), [project]);
  const recent = useMemo(() => [...project.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8), [project]);
  // Pending-vs-paid totals for header alert
  const pendingTotal = agg.expensePending || 0;

  // เงินค้างรับ (เงินประกันสินค้า/เครื่องจักรที่ยังไม่ได้รับคืน)
  // แสดงทุก PO ที่ตั้งเงินมัดจำไว้ ไม่ว่าจะอยู่สถานะใด ยกเว้นถูกปฏิเสธ
  const pendingDeposits = useMemo(() =>
    project.transactions.filter(t =>
      t.kind !== 'income' &&
      getStatus(t) !== 'rejected' &&
      t.deposit && t.deposit.amount > 0 && t.deposit.status !== 'returned'
    ),
    [project]
  );
  const pendingDepositsTotal = useMemo(
    () => pendingDeposits.reduce((s, t) => s + (t.deposit?.amount || 0), 0),
    [pendingDeposits]
  );
  return (
    <div>
      {pendingTotal > 0 ? (
        <Alert tone="info" icon="clock">
          <strong>มีรายจ่ายรอชำระ <span className="mono">{formatBaht(pendingTotal)} บาท</span></strong>
          <p>ยังมีใบสั่งซื้อที่อยู่ระหว่างร่าง/รออนุมัติ/รอชำระ ยังไม่ถูกนับรวมในรายจ่ายจริงจนกว่าจะชำระเสร็จสิ้น</p>
        </Alert>
      ) : null}

      {/* เงินค้างรับ (Pending deposits) */}
      {pendingDeposits.length > 0 ? (
        <div className="card mb-24" style={{borderColor:'rgba(96,165,250,0.25)', background:'linear-gradient(180deg, rgba(96,165,250,0.04), transparent 60%)'}}>
          <div className="between mb-16" style={{flexWrap:'wrap'}}>
            <div className="row gap-12">
              <div className="ic-tag info" style={{width:'40px', height:'40px', background:'var(--info-soft)', color:'var(--info)', borderRadius:'var(--r-sm)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Icon name="shield-check" size={20}/>
              </div>
              <div>
                <div className="uppercase muted">เงินค้างรับของโครงการ</div>
                <div style={{fontSize:'18px', fontWeight:600, marginTop:'2px'}}>
                  <span className="mono" style={{color:'var(--info)'}}>{formatBaht(pendingDepositsTotal)}</span>
                  <span className="dim" style={{fontSize:'13px', fontWeight:400, marginLeft:'4px'}}>บาท · {pendingDeposits.length} รายการ</span>
                </div>
                <div className="dim" style={{fontSize:'12px', marginTop:'2px'}}>เงินประกันที่จ่ายไปแล้วและรอรับคืน (ไม่ถูกรวมเป็นรายจ่าย)</div>
              </div>
            </div>
            {agg.depositReturned > 0 ? (
              <div style={{textAlign:'right'}}>
                <div className="uppercase muted">ได้รับคืนสะสม</div>
                <div className="mono pos" style={{fontSize:'15px', fontWeight:500, marginTop:'2px'}}>{formatBaht(agg.depositReturned)} <span className="dim" style={{fontSize:'12px'}}>บ.</span></div>
              </div>
            ) : null}
          </div>
          <div className="table-wrap" style={{background:'var(--bg-1)'}}>
            <div className="table-scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th style={{width:'100px'}}>วันที่จ่าย</th>
                    <th style={{width:'130px'}}>เลขที่ PO</th>
                    <th>คู่ค้า / รายละเอียด</th>
                    <th className="num" style={{width:'150px'}}>จำนวนเงิน</th>
                    <th style={{width:'140px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeposits.map(po => {
                    const st = getStatus(po);
                    const isPaid = st === 'paid';
                    return (
                    <tr key={po.id}>
                      <td className="date">{formatDate(po.paidAt || po.date)}</td>
                      <td className="mono" style={{fontSize:'12.5px'}}>{po.code}</td>
                      <td className="desc">
                        <div className="title">{po.vendor}</div>
                        <div className="sub">
                          <Badge>{KINDS[po.kind].short}</Badge>
                          <POStatusBadge status={st}/>
                          {po.deposit.note ? <span className="dim" style={{marginLeft:'6px'}}>· {po.deposit.note}</span> : null}
                        </div>
                      </td>
                      <td className="num"><strong style={{color: isPaid ? 'var(--info)' : 'var(--text-2)'}}>{formatBaht(po.deposit.amount)}</strong></td>
                      <td>
                        <button className="btn sm" onClick={() => onOpenPO && onOpenPO(po)} title={isPaid ? 'แนบสลิปและรับคืนเงิน' : 'เปิดดูใบสั่งซื้อ'}>
                          <Icon name={isPaid ? 'download' : 'edit'} size={12}/> {isPaid ? 'รับคืนเงิน' : 'เปิดดู'}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'16px', marginBottom:'16px'}} className="responsive-2col">
        <div className="card">
          {(() => {
            const sumCostsByKind = {};
            for (const k of EXPENSE_KINDS) {
              const cmap = (project.categoryCosts && project.categoryCosts[k]) || {};
              let s = 0;
              for (const n in cmap) if (Object.prototype.hasOwnProperty.call(cmap, n)) s += Number(cmap[n] || 0);
              sumCostsByKind[k] = s;
            }
            const totalCosts = EXPENSE_KINDS.reduce((s, k) => s + sumCostsByKind[k], 0);
            const totalBudgetSet = EXPENSE_KINDS.reduce((s, k) => s + (project.budgets[k] || 0), 0);
            const totalEff = totalEffectiveBudget(project);
            const hasAnyData = totalCosts > 0 || totalBudgetSet > 0;
            return (
              <>
                <div className="between mb-16" style={{flexWrap:'wrap', gap:'8px'}}>
                  <div>
                    <div className="uppercase muted">ต้นทุนตั้งไว้ vs จ่ายจริง</div>
                    <div style={{fontSize:'15px', fontWeight:600, marginTop:4}}>เปรียบเทียบรายหมวด</div>
                  </div>
                  <div className="row gap-8" style={{flexWrap:'wrap'}}>
                    {totalCosts > 0 ? <Badge tone="info">ต้นทุนรวม {formatBaht(totalCosts, {compact:true})} บ.</Badge> : null}
                    {totalBudgetSet > 0 && totalBudgetSet !== totalCosts ? <Badge>งบโครงการ {formatBaht(totalBudgetSet, {compact:true})} บ.</Badge> : null}
                    {!hasAnyData ? (
                      <button className="btn sm primary" onClick={onGoToCategories} title="ไปตั้งราคาต้นทุนต่อหมวดย่อย">
                        <Icon name="plus" size={12}/> ตั้งต้นทุนหมวดงาน
                      </button>
                    ) : null}
                  </div>
                </div>

                {!hasAnyData ? (
                  <div style={{padding:'14px 16px', background:'var(--bg-2)', borderRadius:'var(--r-sm)', border:'1px dashed var(--border)', marginBottom:'12px', fontSize:'12.5px'}} className="row gap-12">
                    <Icon name="info" size={18} style={{color:'var(--info)', flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <strong>ยังไม่ได้ตั้งต้นทุนหมวดงาน</strong>
                      <div className="dim" style={{marginTop:'2px', lineHeight:1.5}}>
                        ไปที่แท็บ <strong>"จัดการหมวดหมู่"</strong> เพื่อกำหนดราคาต้นทุนของแต่ละหมวดย่อย — ระบบจะรวมเป็นต้นทุนรวมของหมวดงาน แล้วนำมาเปรียบเทียบกับยอดจ่ายจริงในตารางนี้
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="breakdown">
                  {EXPENSE_KINDS.map(k => {
                    const meta = KINDS[k];
                    const planned = project.budgets[k] || 0;
                    const costSum = sumCostsByKind[k];
                    const b = Math.max(planned, costSum);
                    const a = agg.byKind[k] || 0;
                    const ratio = b > 0 ? a / b : 0;
                    return (
                      <div key={k} className="breakdown-row">
                        <div className="swatch" style={{background: meta.color}}></div>
                        <div className="lbl">
                          <div className="name">
                            <KindIcon kind={k} size={14}/> {meta.short}
                            {ratio > 1 ? <Badge tone="danger" dot>เกินงบ</Badge> : ratio > 0.9 ? <Badge tone="warn" dot>ใกล้เต็ม</Badge> : null}
                            {costSum > 0 && planned === 0 ? <span className="dim" style={{fontSize:'10.5px'}}>(รวมจากหมวดย่อย)</span> : null}
                          </div>
                          <div className="sub">
                            {b > 0 ? (
                              <>
                                <span>{Math.round(ratio * 100)}% ของต้นทุน</span>
                                <span className="sep">·</span>
                                <span>{b - a >= 0 ? <>คงเหลือ {formatBaht(b - a)} บ.</> : <span style={{color:'var(--danger)'}}>เกิน {formatBaht(a - b)} บ.</span>}</span>
                              </>
                            ) : (
                              <span className="dim">ยังไม่ตั้งต้นทุน · <a onClick={onGoToCategories} style={{color:'var(--brand-bright)', cursor:'pointer', textDecoration:'underline'}}>ตั้งค่า</a></span>
                            )}
                          </div>
                          <Bar value={a} max={b} tone="auto" thin/>
                        </div>
                        <div className="num">{formatBaht(a)}</div>
                        <div className="num sec">/ {b > 0 ? formatBaht(b, {compact: true}) : '—'}</div>
                      </div>
                    );
                  })}
                  <div className="breakdown-row" style={{paddingTop:'12px', borderTop:'1px solid var(--border)', marginTop:'4px'}}>
                    <div className="swatch" style={{background: 'var(--text-2)'}}></div>
                    <div className="lbl">
                      <div className="name"><strong>รวมรายจ่ายทั้งหมด</strong></div>
                    </div>
                    <div className="num"><strong>{formatBaht(agg.expense)}</strong></div>
                    <div className="num sec">/ {totalEff > 0 ? formatBaht(totalEff, {compact:true}) : '—'}</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <div className="card">
          <div className="uppercase muted mb-8">รายรับ vs รายจ่ายรายเดือน</div>
          <div style={{fontSize:'15px', fontWeight:600, marginBottom:12}}>กระแสเงินสด</div>
          {trend.length >= 2 ? (
            <>
              <LineChart series={[
                { name: 'รายรับ', color: '#22c55e', data: trend.map(t => ({ x: t.label, y: t.income })) },
                { name: 'รายจ่าย', color: '#f87171', data: trend.map(t => ({ x: t.label, y: t.expense })) }
              ]} height={180}/>
              <div className="legend mt-8">
                <span className="item"><span className="swatch" style={{background:'var(--brand)'}}></span> รายรับ</span>
                <span className="item"><span className="swatch" style={{background:'var(--danger)'}}></span> รายจ่าย</span>
              </div>
            </>
          ) : <Empty title="ยังไม่มีข้อมูลพอ" hint="ต้องมีรายการอย่างน้อย 2 เดือน"/>}
        </div>
      </div>

      <div className="card">
        <div className="between mb-16">
          <div>
            <div className="uppercase muted">รายการล่าสุด</div>
            <div style={{fontSize:'15px', fontWeight:600, marginTop:4}}>8 รายการล่าสุดในโครงการ</div>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th style={{width: '110px'}}>วันที่</th>
                <th>ประเภท / รายละเอียด</th>
                <th>หมวดหมู่ / คู่ค้า</th>
                <th>สถานะ</th>
                <th className="num">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(t => {
                const isIncome = t.kind === 'income';
                const status = isIncome ? null : getStatus(t);
                const items = isIncome ? null : getPOItems(t);
                const desc = isIncome ? t.description : (t.vendor || (items && items[0]?.description) || t.description);
                const catLabel = isIncome ? t.category : (items && items.length > 1 ? `${items.length} หมวด` : (items && items[0]?.category) || t.category);
                return (
                  <tr key={t.id}>
                    <td className="date">{formatDate(t.date)}</td>
                    <td className="desc">
                      <div className="row gap-8">
                        <Badge tone={isIncome ? 'brand' : ''} dot>
                          <KindIcon kind={t.kind} size={11}/> {KINDS[t.kind].short}
                        </Badge>
                        <span className="title">{desc}</span>
                        {(t.attachment || t.paymentSlip) ? <Icon name="paperclip" size={12} className="attach-icon"/> : null}
                      </div>
                    </td>
                    <td className="muted">{catLabel}</td>
                    <td>{isIncome ? <span className="muted">{t.vendor || '—'}</span> : <POStatusBadge status={status}/>}</td>
                    <td className={`num ${isIncome ? 'pos' : status === 'paid' ? 'neg' : 'muted'}`}>
                      {isIncome ? '+' : status === 'paid' ? '−' : ''}{formatBaht(t.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===== Transactions tab ===== */
function TransactionsTab({ kind, project, onAdd, onEdit, onDelete }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [printingTx, setPrintingTx] = useState(null);     // {tx, kind: doc kind}
  const [showPrintMenu, setShowPrintMenu] = useState(null); // tx.id whose menu is open
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showPrintMenu) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowPrintMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showPrintMenu]);

  const onPickIncomeDoc = (tx, docKind) => {
    setShowPrintMenu(null);
    if (window.openLinkedDoc && window.openLinkedDoc(docKind)) return;
    setPrintingTx({ tx, docKind });
  };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return project.transactions
      .filter(t => t.kind === kind)
      .filter(t => cat === 'all' || t.category === cat)
      .filter(t => !from || t.date >= from)
      .filter(t => !to || t.date <= to)
      .filter(t => !ql || (t.description.toLowerCase().includes(ql) || (t.vendor || '').toLowerCase().includes(ql) || t.category.toLowerCase().includes(ql)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [project, kind, q, cat, from, to]);

  const total = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalNet = useMemo(() => filtered.reduce((s, t) => {
    const d = t.deductionPct > 0 ? t.amount * (t.deductionPct / 100) : 0;
    return s + (t.amount - d);
  }, 0), [filtered]);
  const budget = kind === 'income' ? project.contractValue : (project.budgets[kind] || 0);
  const totalKindAmt = useMemo(() => project.transactions.filter(t => t.kind === kind).reduce((s, t) => s + t.amount, 0), [project, kind]);
  const totalKindNet = useMemo(() => project.transactions.filter(t => t.kind === kind).reduce((s, t) => {
    const d = t.deductionPct > 0 ? t.amount * (t.deductionPct / 100) : 0;
    return s + (t.amount - d);
  }, 0), [project, kind]);

  const onExport = () => {
    const rows = [['วันที่', 'หมวดหมู่ย่อย', 'รายการ', 'คู่ค้า', 'จำนวนเงิน', '% หักออก', 'ยอดสุทธิ', 'VAT', 'หัก ณ ที่จ่าย (%)', 'แนบไฟล์']];
    for (const t of filtered) {
      const d = t.deductionPct > 0 ? t.amount * (t.deductionPct / 100) : 0;
      const net = t.amount - d;
      rows.push([t.date, t.category, t.description, t.vendor || '', t.amount, t.deductionPct || 0, net, t.vat ? 'มี' : 'ไม่', t.withholding, t.attachment || '']);
    }
    downloadCSV(`${project.code}_${kind}_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div>
      {/* Summary banner */}
      <div className="card tight mb-16">
        <div className="between" style={{flexWrap:'wrap', gap:'16px'}}>
          <div className="row gap-16">
            <div className="value-with-icon">
              <div className="ic" style={{background:'var(--brand-soft)', color: KINDS[kind].color}}>
                <KindIcon kind={kind} size={20}/>
              </div>
              <div>
                <div className="uppercase muted">รวม{KINDS[kind].label}ทั้งหมด</div>
                <div className="num" style={{fontSize:'22px', fontWeight:500, marginTop:'2px'}}>{formatBaht(totalKindAmt)} <span className="dim" style={{fontSize:'13px'}}>บาท</span></div>
                {kind === 'income' && totalKindAmt !== totalKindNet ? (
                  <div className="dim" style={{fontSize:'12px', marginTop:'2px'}}>
                    → ต้นทุนจริง <strong className="mono pos">{formatBaht(totalKindNet)}</strong> บ. (หังหัก {formatBaht(totalKindAmt - totalKindNet)} บ.)
                  </div>
                ) : null}
              </div>
            </div>
            {budget > 0 ? (
              <>
                <div style={{height:'40px', width:'1px', background:'var(--border)'}}></div>
                <div>
                  <div className="uppercase muted">{kind === 'income' ? 'มูลค่าสัญญา' : 'งบประมาณตั้งไว้'}</div>
                  <div className="num" style={{fontSize:'18px', fontWeight:500, marginTop:'2px'}}>{formatBaht(budget)} <span className="dim" style={{fontSize:'12px'}}>บาท</span></div>
                  <div style={{marginTop:'6px', width:'200px'}}>
                    <Bar value={totalKindAmt} max={budget} tone={kind === 'income' ? 'brand' : 'auto'} thin/>
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <button className="btn primary" onClick={onAdd}>
            <Icon name="plus" size={14}/> เพิ่ม{KINDS[kind].short}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-row">
        <div className="input-with-icon" style={{flex:1, maxWidth:'360px'}}>
          <Icon name="search" size={14}/>
          <input className="input-base" placeholder="ค้นหาในรายการ / คู่ค้า / หมวด..." value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <select className="input-base" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="all">หมวดหมู่ทั้งหมด</option>
          {(project.categories[kind] || []).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input-base" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{width:'auto'}} title="ตั้งแต่วันที่"/>
        <span className="muted">—</span>
        <input className="input-base" type="date" value={to} onChange={e => setTo(e.target.value)} style={{width:'auto'}} title="ถึงวันที่"/>
        <button className="btn ghost sm" onClick={onExport} title="ดาวน์โหลด CSV">
          <Icon name="download" size={14}/> CSV
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {filtered.length === 0 ? (
          <Empty
            title={q || cat !== 'all' || from || to ? 'ไม่พบรายการตามเงื่อนไข' : `ยังไม่มี${KINDS[kind].label}`}
            hint={q || cat !== 'all' || from || to ? 'ลองล้างตัวกรองหรือปรับช่วงวันที่' : `เริ่มจากการเพิ่มรายการแรกในหมวด ${KINDS[kind].short}`}
            action={!(q || cat !== 'all' || from || to) ? <button className="btn primary sm" onClick={onAdd}><Icon name="plus" size={14}/> เพิ่มรายการแรก</button> : null}
          />
        ) : (
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th style={{width:'110px'}}>วันที่</th>
                <th style={{width:'160px'}}>หมวดหมู่ย่อย</th>
                <th>รายการ</th>
                <th>คู่ค้า / ผู้รับ</th>
                <th className="num" style={{width:'130px'}}>จำนวนเงิน</th>
                {kind === 'income' ? <th className="num" style={{width:'140px'}}>ยอดสุทธิ (ต้นทุน)</th> : null}
                <th style={{width:'120px'}}>ภาษี / หัก</th>
                <th style={{width:'40px'}}></th>
                <th className="actions" style={{width:'80px'}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const ded = t.deductionPct > 0 ? t.amount * (t.deductionPct / 100) : 0;
                const net = t.amount - ded;
                return (
                <tr key={t.id}>
                  <td className="date">{formatDate(t.date)}</td>
                  <td><Badge>{t.category}</Badge></td>
                  <td className="desc">
                    <div className="title">{t.description}</div>
                    {t.deductionNote ? <div className="sub dim" style={{fontSize:'11.5px', marginTop:'2px'}}>มอ.หัก: {t.deductionNote}</div> : null}
                  </td>
                  <td className="muted">{t.vendor || '—'}</td>
                  <td className={`num ${kind === 'income' ? 'pos' : ''}`}>
                    {kind === 'income' ? '+' : ''}{formatBaht(t.amount)}
                  </td>
                  {kind === 'income' ? (
                    <td className="num">
                      <div style={{fontWeight:600, color:'var(--brand-bright)'}}>{formatBaht(net)}</div>
                      {ded > 0 ? <div className="dim" style={{fontSize:'11px', fontFamily:'var(--mono)'}}>−{t.deductionPct}% (−{formatBaht(ded)})</div> : null}
                    </td>
                  ) : null}
                  <td>
                    <div className="row gap-4">
                      {t.vat ? <Badge tone="info">VAT 7%</Badge> : null}
                      {t.withholding ? <Badge tone="purple">หัก {t.withholding}%</Badge> : null}
                      {!t.vat && !t.withholding ? <span className="dim">—</span> : null}
                    </div>
                  </td>
                  <td>
                    {t.attachment ? <Icon name="paperclip" size={14} className="attach-icon" title={t.attachment}/> : null}
                  </td>
                  <td className="actions">
                    {kind === 'income' ? (
                      <div ref={showPrintMenu === t.id ? menuRef : null} style={{position:'relative', display:'inline-block'}}>
                        <button className="icon-btn" onClick={() => setShowPrintMenu(s => s === t.id ? null : t.id)} title="พิมพ์เอกสาร">
                          <Icon name="print" size={14}/>
                        </button>
                        {showPrintMenu === t.id ? (
                          <div className="doc-menu-popover" style={{bottom:'auto', top:'calc(100% + 4px)', right:0, left:'auto', minWidth:'260px'}}>
                            {[
                              { key: 'income-receipt', icon: 'receipt', title: 'ใบเสร็จรับเงิน', sub: 'Official Receipt — ออกให้เจ้าของงาน' },
                              { key: 'income-taxinvoice', icon: 'document', title: 'ใบกำกับภาษี', sub: 'Tax Invoice — VAT 7%' }
                            ].map(d => {
                              const linked = window.getLinkedDocFile ? window.getLinkedDocFile(d.key) : null;
                              return (
                                <button key={d.key} className="doc-menu-item" onClick={() => onPickIncomeDoc(t, d.key)}>
                                  <Icon name={d.icon} size={14}/>
                                  <div style={{flex:1, minWidth:0}}>
                                    <div style={{fontWeight:500, display:'flex', alignItems:'center', gap:'6px'}}>
                                      {d.title}
                                      {linked ? (
                                        <span className="doc-link-badge" title={linked.name}>
                                          <Icon name="paperclip" size={10}/> ไฟล์ภายนอก
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="dim" style={{fontSize:'11px'}}>
                                      {linked ? <>เปิดไฟล์: <strong style={{color:'var(--brand-bright)'}}>{linked.name}</strong></> : d.sub}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <button className="icon-btn" onClick={() => onEdit(t)} title="แก้ไข"><Icon name="edit" size={14}/></button>
                    <button className="icon-btn danger" onClick={() => onDelete(t.id)} title="ลบ"><Icon name="trash" size={14}/></button>
                  </td>
                </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="muted">รวม {filtered.length} รายการที่กรองอยู่</td>
                <td className={`num ${kind === 'income' ? 'pos' : ''}`}><strong>{kind === 'income' ? '+' : ''}{formatBaht(total)}</strong></td>
                {kind === 'income' ? (
                  <td className="num"><strong style={{color:'var(--brand-bright)'}}>{formatBaht(totalNet)}</strong></td>
                ) : null}
                <td colSpan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        )}
      </div>
      {printingTx ? (
        <DocumentModal
          project={project}
          po={printingTx.tx}
          kind={printingTx.docKind}
          onClose={() => setPrintingTx(null)}
        />
      ) : null}
    </div>
  );
}

/* ===== Team tab ===== */
function TeamTab({ project, onUpdate, currentRole, onDeleteProject }) {
  const isExec  = (ROLES[currentRole] || ROLES.staff).canManageTeam;
  const isLive  = window.db && window.db.isReady();

  const [members,    setMembers]    = useState(project.members || []);
  const [adding,     setAdding]     = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [newRole,    setNewRole]    = useState('staff');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  // Keep local state in sync when project prop refreshes
  useEffect(() => { setMembers(project.members || []); }, [project.id]);

  const refreshMembers = () => {
    if (!isLive) return Promise.resolve();
    return window.db.members.getProjectMembers(project.id)
      .then(fresh => {
        console.log('[TeamTab] loaded members:', fresh);
        setMembers(fresh);
        onUpdate({ ...project, members: fresh });
        return fresh;
      })
      .catch(err => {
        console.error('[TeamTab] refresh members failed:', err);
        setError('โหลดรายชื่อสมาชิกไม่สำเร็จ: ' + (err.message || err));
        throw err;
      });
  };

  const handleAdd = () => {
    const val = emailInput.trim();
    if (!val) return;

    if (!isLive) {
      // Demo mode: add by name directly
      if (members.some(m => (m.displayName || m.email) === val)) {
        setError('มีสมาชิกนี้แล้ว'); return;
      }
      const next = [...members, {
        id: uid('u'), userId: 'demo-' + uid(), displayName: val,
        email: val.includes('@') ? val : val + '@demo', role: newRole,
        addedAt: new Date().toISOString(), isOwner: false
      }];
      setMembers(next);
      onUpdate({ ...project, members: next });
      setEmailInput(''); setAdding(false); setError('');
      return;
    }

    setLoading(true); setError('');
    var cu = window.CURRENT_USER || {};
    window.db.members.findUserByEmail(val)
      .then(function(user) {
        if (!user) {
          setError('ไม่พบอีเมลนี้ในระบบ — ผู้ใช้ต้องสมัครบัญชีก่อน');
          setLoading(false);
          return null;
        }
        if (members.some(function(m) { return m.userId === user.id; })) {
          setError('ผู้ใช้นี้เป็นสมาชิกโครงการอยู่แล้ว');
          setLoading(false);
          return null;
        }
        return window.db.members.addMember(project.id, user.id, newRole, cu.id);
      })
      .then(function(result) {
        if (result === null) return;
        setEmailInput(''); setAdding(false);
        return refreshMembers();
      })
      .then(function() { setLoading(false); })
      .catch(function(err) { setError(err.message || 'เกิดข้อผิดพลาด'); setLoading(false); });
  };

  const handleChangeRole = (member, newR) => {
    if (member.isOwner) return;
    if (!isLive) {
      const next = members.map(m => m.userId === member.userId ? { ...m, role: newR } : m);
      setMembers(next);
      onUpdate({ ...project, members: next });
      return;
    }
    window.db.members.updateMemberRole(project.id, member.userId, newR)
      .then(() => refreshMembers())
      .catch(err => alert(err.message));
  };

  const handleRemove = (member) => {
    if (member.isOwner) { alert('ไม่สามารถลบเจ้าของโครงการได้'); return; }
    if (!confirm('ลบสมาชิกคนนี้ออกจากโครงการ?')) return;
    if (!isLive) {
      const next = members.filter(m => m.userId !== member.userId);
      setMembers(next);
      onUpdate({ ...project, members: next });
      return;
    }
    window.db.members.removeMember(project.id, member.userId)
      .then(() => refreshMembers())
      .catch(err => alert(err.message));
  };

  const byRole = useMemo(() => {
    const g = { executive: [], manager: [], staff: [] };
    for (const m of members) (g[m.role] || g.staff).push(m);
    return g;
  }, [members]);

  const ROLE_PERMS = [
    { key:'executive', line:'ดูงบดุล · อนุมัติ PO · แก้ไขแผนรายรับ · จัดการหมวดหมู่' },
    { key:'manager',   line:'อนุมัติ PO ได้ · ไม่สามารถแก้แผนรายรับ/หมวดหมู่' },
    { key:'staff',     line:'สร้าง PO และทำรายการ · ไม่อนุมัติ · ไม่แก้แผน/หมวดหมู่' }
  ];

  return (
    <div>
      <Alert tone="info" icon="info">
        <strong>สิทธิ์การทำงานในโครงการนี้</strong>
        <div style={{marginTop:'8px', display:'flex', flexDirection:'column', gap:'4px'}}>
          {ROLE_PERMS.map(rp => (
            <div key={rp.key} className="row gap-8" style={{fontSize:'12.5px'}}>
              <span className={`role-badge ${rp.key}`} style={{padding:'1px 7px', fontSize:'10px'}}>{ROLES[rp.key].short}</span>
              <span className="dim">{rp.line}</span>
            </div>
          ))}
        </div>
      </Alert>

      <div className="between mb-16">
        <div>
          <div className="uppercase muted">สมาชิกทั้งหมด</div>
          <div style={{fontSize:'15px', fontWeight:600, marginTop:'2px'}}>{members.length} คน ในโครงการ</div>
        </div>
        <div className="row gap-8">
          {isLive ? (
            <button className="btn ghost sm" onClick={() => refreshMembers().catch(() => {})} title="โหลดรายชื่อใหม่จากเซิร์ฟเวอร์">
              <Icon name="refresh" size={13}/> รีเฟรช
            </button>
          ) : null}
          {isExec && !adding ? (
            <button className="btn primary" onClick={() => { setAdding(true); setError(''); }}>
              <Icon name="plus" size={14}/> เพิ่มสมาชิก
            </button>
          ) : null}
        </div>
      </div>

      {adding && isExec ? (
        <div className="card mb-16" style={{background:'var(--brand-soft)', borderColor:'var(--border-brand)'}}>
          <div className="form-grid">
            <div className="field full">
              <label>{isLive ? 'อีเมลผู้ใช้งาน (ต้องสมัครบัญชีไว้แล้ว)' : 'ชื่อสมาชิก'} <span className="req">*</span></label>
              <input className="input-base" autoFocus
                placeholder={isLive ? 'email@example.com' : 'ชื่อ-นามสกุล'}
                type={isLive ? 'email' : 'text'}
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}/>
              {error ? <span className="hint" style={{color:'var(--danger)'}}>{error}</span> : null}
            </div>
            <div className="field full">
              <label>สิทธิ์ในโครงการนี้</label>
              <div className="role-switcher" style={{width:'100%'}}>
                {Object.values(ROLES).map(r => (
                  <button key={r.key} className={newRole === r.key ? 'on' : ''} onClick={() => setNewRole(r.key)} type="button" style={{flex:1, justifyContent:'center'}}>
                    {r.short}
                  </button>
                ))}
              </div>
              <span className="hint">
                {ROLES[newRole].label} — {
                  newRole === 'executive' ? 'ใช้งานได้ทุกอย่าง' :
                  newRole === 'manager'   ? 'อนุมัติ PO ได้ ยกเว้นแก้แผนรายรับ/หมวดหมู่' :
                  'สร้าง PO และทำรายการ ไม่อนุมัติ'
                }
              </span>
            </div>
          </div>
          <div className="row mt-16" style={{justifyContent:'flex-end', gap:'8px'}}>
            <button className="btn ghost" onClick={() => { setAdding(false); setEmailInput(''); setError(''); }}>ยกเลิก</button>
            <button className="btn primary" onClick={handleAdd} disabled={loading || !emailInput.trim()}>
              {loading ? 'กำลังค้นหา...' : <><Icon name="check" size={14}/> เพิ่มสมาชิก</>}
            </button>
          </div>
        </div>
      ) : null}

      {!isExec ? (
        <Alert tone="warn" icon="info">
          <strong>คุณมีสิทธิ์ดูรายชื่อสมาชิก</strong> เฉพาะผู้บริหารเท่านั้นที่สามารถเพิ่ม/ลบ/เปลี่ยนสิทธิ์สมาชิกได้
        </Alert>
      ) : null}

      {/* Members grouped by role */}
      {Object.entries(ROLES).map(([key, r]) => {
        const list = byRole[key] || [];
        if (list.length === 0) return null;
        return (
          <div key={key} className="card mb-16">
            <div className="row gap-8 mb-12" style={{paddingBottom:'10px', borderBottom:'1px solid var(--border)'}}>
              <span className={`role-badge ${key}`}>{r.short}</span>
              <span style={{fontSize:'14px', fontWeight:600}}>{r.label}</span>
              <Badge>{list.length} คน</Badge>
              <span className="dim" style={{fontSize:'11.5px', marginLeft:'auto'}}>
                {r.canEditPlan ? '✓ แผนรายรับ' : '✗ แผนรายรับ'} · {r.canApprove ? '✓ อนุมัติ PO' : '✗ อนุมัติ PO'} · {r.canViewBalance ? '✓ งบดุล' : '✗ งบดุล'}
              </span>
            </div>
            <div className="member-list">
              {list.map(m => {
                const initials = (m.displayName || m.email || '?').split(' ').map(w => w[0] || '').join('').slice(0,2).toUpperCase() || '??';
                return (
                  <div key={m.id || m.userId} className="member-row">
                    <div className="avatar member-avatar" style={{background: r.color + '30', color: r.color, border: '1px solid ' + r.color + '50', fontSize:'11px'}}>
                      {initials}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontWeight:500, fontSize:'13.5px'}}>{m.displayName || m.email || 'ไม่ระบุชื่อ'}</div>
                      <div className="dim" style={{fontSize:'11.5px'}}>
                        {m.email || ''}
                        {m.isOwner ? <span style={{marginLeft:'6px', color:'var(--brand-bright)', fontSize:'10px'}}>เจ้าของโครงการ</span> : null}
                      </div>
                    </div>
                    {m.addedAt ? (
                      <div className="dim mono" style={{fontSize:'11px'}}>เพิ่ม {formatDate(m.addedAt.slice(0,10))}</div>
                    ) : null}
                    {isExec && !m.isOwner ? (
                      <>
                        <select className="input-base" value={m.role}
                          onChange={e => handleChangeRole(m, e.target.value)}
                          style={{padding:'4px 8px', fontSize:'12px', width:'auto'}}>
                          {Object.values(ROLES).map(rr => <option key={rr.key} value={rr.key}>{rr.short} — {rr.label}</option>)}
                        </select>
                        <button className="icon-btn danger" onClick={() => handleRemove(m)} title="ลบสมาชิก">
                          <Icon name="trash" size={13}/>
                        </button>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {members.length === 0 && !adding ? (
        <Empty
          icon="users"
          title="ยังไม่มีสมาชิกในโครงการ"
          hint={isExec ? 'เพิ่มทีมงานเพื่อกำหนดสิทธิ์การทำงานในโครงการนี้' : 'ยังไม่มีสมาชิกในโครงการนี้'}
          action={isExec ? <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" size={14}/> เพิ่มสมาชิกคนแรก</button> : null}
        />
      ) : null}

      {/* Danger Zone — Delete Project (executive only) */}
      {isExec && onDeleteProject ? (
        <div className="card mt-24" style={{borderColor:'rgba(239,68,68,.4)', background:'rgba(239,68,68,.04)'}}>
          <div className="row gap-12" style={{alignItems:'flex-start'}}>
            <Icon name="warn" size={24} style={{color:'var(--danger)', flexShrink:0, marginTop:'2px'}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:'14px', fontWeight:600, color:'var(--danger)'}}>เขตอันตราย — ลบโครงการ</div>
              <div className="dim" style={{fontSize:'12.5px', marginTop:'4px', lineHeight:1.6}}>
                การลบจะทำให้ข้อมูลทั้งหมดของโครงการนี้หายไปถาวร รวมถึง รายรับ ใบสั่งซื้อ แผนรายรับ สมาชิก และไฟล์แนบ — กู้คืนไม่ได้
              </div>
            </div>
            <button className="btn danger" onClick={onDeleteProject}>
              <Icon name="trash" size={14}/> ลบโครงการนี้
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ===== Categories tab ===== */
function CategoriesTab({ project, onBulkSave, currentRole }) {
  const canEdit = (ROLES[currentRole] || ROLES.staff).canManageCategories;

  // Local draft state — changes are batched until user clicks Save
  const initialCats  = () => JSON.parse(JSON.stringify(project.categories  || {}));
  const initialCosts = () => JSON.parse(JSON.stringify(project.categoryCosts || {}));
  const [draftCats,  setDraftCats]  = useState(initialCats);
  const [draftCosts, setDraftCosts] = useState(initialCosts);
  const [adding,  setAdding]  = useState({ kind: null, name: '' });
  const [editing, setEditing] = useState({ kind: null, oldName: '', newName: '' });
  const [saving,  setSaving]  = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Resync draft when the project comes back from the server (id change or new transactions)
  useEffect(() => {
    setDraftCats(initialCats());
    setDraftCosts(initialCosts());
    setAdding({ kind: null, name: '' });
    setEditing({ kind: null, oldName: '', newName: '' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const dirty = useMemo(() => (
    JSON.stringify(draftCats)  !== JSON.stringify(project.categories  || {}) ||
    JSON.stringify(draftCosts) !== JSON.stringify(project.categoryCosts || {})
  ), [draftCats, draftCosts, project.categories, project.categoryCosts]);

  // Per-category aggregation (uses live project.transactions — independent of draft)
  const usage = useMemo(() => {
    const m = {};
    for (const t of project.transactions) {
      if (t.kind === 'income') {
        m.income = m.income || {};
        m.income[t.category] = m.income[t.category] || { count: 0, actual: 0 };
        m.income[t.category].count += 1;
        m.income[t.category].actual += (t.amount || 0);
      } else {
        m[t.kind] = m[t.kind] || {};
        const items = getPOItems(t);
        for (const it of items) {
          m[t.kind][it.category] = m[t.kind][it.category] || { count: 0, actual: 0 };
          m[t.kind][it.category].count += 1;
          m[t.kind][it.category].actual += (it.amount || 0);
        }
      }
    }
    return m;
  }, [project.transactions]);

  const addCat = (kind) => {
    const name = adding.name.trim();
    if (!name) return;
    const list = draftCats[kind] || [];
    if (list.includes(name)) { setAdding({kind:null, name:''}); return; }
    setDraftCats({ ...draftCats, [kind]: [...list, name] });
    setAdding({ kind: null, name: '' });
  };

  const removeCat = (kind, name) => {
    const u = (usage[kind] && usage[kind][name]) || { count: 0, actual: 0 };
    if (u.count > 0) {
      if (!window.confirm(`หมวด "${name}" มีรายการใช้งานอยู่ ${u.count} รายการ ลบหมวดนี้จะไม่ลบรายการ แต่รายการจะยังคงผูกชื่อหมวดเดิม ดำเนินการต่อ?`)) return;
    }
    setDraftCats({ ...draftCats, [kind]: (draftCats[kind] || []).filter(c => c !== name) });
    const nextCosts = { ...(draftCosts[kind] || {}) };
    delete nextCosts[name];
    setDraftCosts({ ...draftCosts, [kind]: nextCosts });
  };

  const saveEdit = () => {
    const newName = editing.newName.trim();
    if (!newName || newName === editing.oldName) { setEditing({kind:null, oldName:'', newName:''}); return; }
    const list = (draftCats[editing.kind] || []).map(c => c === editing.oldName ? newName : c);
    setDraftCats({ ...draftCats, [editing.kind]: list });
    // carry over cost price under the new name
    const kindCosts = { ...(draftCosts[editing.kind] || {}) };
    if (Object.prototype.hasOwnProperty.call(kindCosts, editing.oldName)) {
      kindCosts[newName] = kindCosts[editing.oldName];
      delete kindCosts[editing.oldName];
    }
    setDraftCosts({ ...draftCosts, [editing.kind]: kindCosts });
    setEditing({ kind: null, oldName: '', newName: '' });
  };

  const setCost = (kind, name, cost) => {
    const kindCosts = { ...(draftCosts[kind] || {}), [name]: Number(cost) || 0 };
    setDraftCosts({ ...draftCosts, [kind]: kindCosts });
  };

  const resetDraft = () => {
    setDraftCats(initialCats());
    setDraftCosts(initialCosts());
    setAdding({ kind: null, name: '' });
    setEditing({ kind: null, oldName: '', newName: '' });
  };

  const saveAll = () => {
    if (!dirty || saving) return;
    setSaving(true);
    onBulkSave(draftCats, draftCosts);
    // optimistic — assume sync succeeds; surface error via global toast
    setTimeout(() => {
      setSaving(false);
      setSavedAt(Date.now());
      if (window.notify) window.notify('บันทึกหมวดหมู่งานเรียบร้อย', 'success');
      setTimeout(() => setSavedAt(null), 2400);
    }, 250);
  };

  return (
    <div>
      {canEdit ? (
        <Alert tone="info" icon="info">
          <strong>จัดการหมวดหมู่ย่อย</strong>
          <p>ปรับแต่งหมวดหมู่ย่อยของแต่ละประเภทรายรับ/รายจ่าย — การเพิ่ม แก้ไข ลบ และกำหนดงบ/ต้นทุน จะถูกเก็บไว้ก่อน จนกว่าจะกด <strong>บันทึกทั้งหมด</strong></p>
        </Alert>
      ) : (
        <Alert tone="warn" icon="info">
          <strong>ดูหมวดหมู่ย่อยเท่านั้น</strong> — เฉพาะผู้จัดการและผู้บริหารสามารถเพิ่ม แก้ไข หรือลบหมวดหมู่ได้
        </Alert>
      )}

      {/* Save bar */}
      {canEdit ? (
        <div className="card tight mb-16" style={{
          padding:'10px 14px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexWrap:'wrap', gap:'12px',
          background: dirty ? 'rgba(251,191,36,.08)' : 'var(--bg-1)',
          borderColor: dirty ? 'rgba(251,191,36,.35)' : 'var(--border)'
        }}>
          <div className="row gap-8" style={{fontSize:'13px'}}>
            <Icon name={dirty ? 'warn' : (savedAt ? 'check' : 'info')} size={14}
              style={{color: dirty ? 'var(--warn)' : (savedAt ? 'var(--brand-bright)' : 'var(--text-3)')}}/>
            {dirty ? (
              <span><strong>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</strong> — กดบันทึกทั้งหมดเพื่อยืนยัน</span>
            ) : savedAt ? (
              <span style={{color:'var(--brand-bright)'}}><strong>บันทึกสำเร็จ</strong> ข้อมูลซิงค์เรียบร้อย</span>
            ) : (
              <span className="dim">ยังไม่มีการเปลี่ยนแปลง</span>
            )}
          </div>
          <div className="row gap-8">
            <button className="btn ghost sm" onClick={resetDraft} disabled={!dirty || saving}>
              <Icon name="refresh" size={13}/> ยกเลิกการเปลี่ยนแปลง
            </button>
            <button className="btn primary" onClick={saveAll} disabled={!dirty || saving}>
              <Icon name="check" size={14}/> {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
            </button>
          </div>
        </div>
      ) : null}

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'16px'}}>
        {ALL_KINDS.map(kind => {
          const meta = KINDS[kind];
          const list = draftCats[kind] || [];
          const kindCostMap = draftCosts[kind] || {};
          return (
            <div key={kind} className="card">
              <div className="between mb-16">
                <div className="row gap-8">
                  <div className="value-with-icon">
                    <div className="ic" style={{width:'32px', height:'32px', background: meta.color + '20', color: meta.color}}>
                      <KindIcon kind={kind} size={16}/>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:'14px', fontWeight:600}}>{meta.short}</div>
                    <div className="dim" style={{fontSize:'11.5px'}}>{list.length} หมวดย่อย</div>
                  </div>
                </div>
                {canEdit ? (
                  <button className="btn sm" onClick={() => setAdding({ kind, name: '' })}>
                    <Icon name="plus" size={12}/> เพิ่ม
                  </button>
                ) : null}
              </div>
              <div className="col gap-6">
                {list.map(name => {
                  const isEditing = editing.kind === kind && editing.oldName === name;
                  const u = (usage[kind] && usage[kind][name]) || { count: 0, actual: 0 };
                  const cost = (kindCostMap[name]) || 0;
                  const diff = kind === 'income' ? (u.actual - cost) : (cost - u.actual);
                  const hasCost = cost > 0;
                  const hasActual = u.actual > 0;
                  return (
                    <div key={name} style={{padding:'10px', background:'var(--bg-2)', borderRadius:'var(--r-sm)'}}>
                      {isEditing && canEdit ? (
                        <div className="row" style={{justifyContent:'space-between'}}>
                          <input className="input-base" autoFocus value={editing.newName} onChange={e => setEditing({...editing, newName: e.target.value})}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing({kind:null, oldName:'', newName:''}); }}
                            style={{padding:'4px 8px', fontSize:'13px'}}/>
                          <div className="row gap-4">
                            <button className="icon-btn" onClick={saveEdit} title="บันทึก"><Icon name="check" size={14}/></button>
                            <button className="icon-btn" onClick={() => setEditing({kind:null, oldName:'', newName:''})}><Icon name="close" size={14}/></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="row" style={{justifyContent:'space-between', marginBottom:'6px'}}>
                            <div className="row gap-8" style={{minWidth:0, flex:1}}>
                              <span style={{fontSize:'13px', fontWeight:500}}>{name}</span>
                              {u.count > 0 ? <Badge>{u.count}</Badge> : <span className="dim" style={{fontSize:'11px'}}>ยังไม่ใช้</span>}
                            </div>
                            {canEdit ? (
                              <div className="row gap-4">
                                <button className="icon-btn" onClick={() => setEditing({ kind, oldName: name, newName: name })} title="แก้ไข"><Icon name="edit" size={13}/></button>
                                <button className="icon-btn danger" onClick={() => removeCat(kind, name)} title="ลบ"><Icon name="trash" size={13}/></button>
                              </div>
                            ) : null}
                          </div>
                          <div className="row gap-8" style={{fontSize:'11.5px'}}>
                            <div style={{flex:1, minWidth:0}}>
                              <div className="dim" style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.05em'}}>{kind === 'income' ? 'ราคาเป้าหมาย' : 'งบ/ต้นทุน'}</div>
                              {canEdit ? (
                                <div className="with-suffix" style={{marginTop:'2px'}}>
                                  <input className="input-base num-input mono" inputMode="decimal" placeholder="0"
                                    value={cost === 0 ? '' : cost}
                                    onChange={e => setCost(kind, name, parseFloat(String(e.target.value).replace(/,/g,'')) || 0)}
                                    style={{padding:'3px 6px', fontSize:'11.5px'}}/>
                                  <span className="suffix" style={{fontSize:'10px'}}>บ.</span>
                                </div>
                              ) : (
                                <div className="mono" style={{fontSize:'12px', marginTop:'2px'}}>{hasCost ? formatBaht(cost) : '—'}</div>
                              )}
                            </div>
                            <div style={{flex:1, minWidth:0}}>
                              <div className="dim" style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.05em'}}>{kind === 'income' ? 'รับจริง' : 'จ่ายจริง'}</div>
                              <div className={'mono ' + (hasActual ? '' : 'dim')} style={{fontSize:'12px', marginTop:'2px'}}>{hasActual ? formatBaht(u.actual) : '—'}</div>
                            </div>
                            <div style={{flex:1, minWidth:0, textAlign:'right'}}>
                              <div className="dim" style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.05em'}}>กำไร/ขาดทุน</div>
                              {hasCost && hasActual ? (
                                <div className={'mono ' + (diff >= 0 ? 'pos' : 'neg')} style={{fontSize:'12px', marginTop:'2px', fontWeight:600}}>
                                  {diff >= 0 ? '+' : ''}{formatBaht(diff)}
                                </div>
                              ) : <div className="dim mono" style={{fontSize:'12px', marginTop:'2px'}}>—</div>}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {adding.kind === kind && canEdit ? (
                  <div className="row gap-4" style={{padding:'8px 10px', background:'var(--brand-soft)', borderRadius:'var(--r-sm)'}}>
                    <input className="input-base" autoFocus placeholder="ชื่อหมวดหมู่ใหม่..."
                      value={adding.name} onChange={e => setAdding({...adding, name: e.target.value})}
                      onKeyDown={e => { if (e.key === 'Enter') addCat(kind); if (e.key === 'Escape') setAdding({kind:null,name:''}); }}
                      style={{padding:'5px 8px', fontSize:'13px'}}/>
                    <button className="icon-btn" onClick={() => addCat(kind)}><Icon name="check" size={14}/></button>
                    <button className="icon-btn" onClick={() => setAdding({kind:null, name:''})}><Icon name="close" size={14}/></button>
                  </div>
                ) : null}
                {list.length === 0 && adding.kind !== kind ? (
                  <div className="dim" style={{padding:'12px', textAlign:'center', fontSize:'12.5px'}}>
                    ยังไม่มีหมวดหมู่ย่อย
                  </div>
                ) : null}
              </div>

              {/* Per-kind summary */}
              {(() => {
                const kindCosts  = list.reduce((s, n) => s + ((kindCostMap[n]) || 0), 0);
                const kindActual = list.reduce((s, n) => s + (((usage[kind] || {})[n] || {}).actual || 0), 0);
                if (kindCosts === 0 && kindActual === 0) return null;
                const kindDiff = kind === 'income' ? (kindActual - kindCosts) : (kindCosts - kindActual);
                return (
                  <div className="row" style={{marginTop:'12px', paddingTop:'10px', borderTop:'1px dashed var(--border)', justifyContent:'space-between', fontSize:'12px'}}>
                    <div className="dim uppercase" style={{fontSize:'10px', letterSpacing:'0.05em'}}>รวมทั้งหมวด</div>
                    <div className={'mono ' + (kindCosts === 0 || kindActual === 0 ? 'dim' : kindDiff >= 0 ? 'pos' : 'neg')} style={{fontWeight:600}}>
                      {kindCosts > 0 && kindActual > 0
                        ? (kindDiff >= 0 ? '+' : '') + formatBaht(kindDiff) + ' บาท'
                        : formatBaht(kindActual) + ' / ' + formatBaht(kindCosts)}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   TRANSACTION MODAL — add / edit
   ============================================================ */
function TransactionModal({ mode, kind, project, initial, onClose, onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);
  const [k, setK] = useState(initial ? initial.kind : kind);
  const [date, setDate] = useState(initial ? initial.date : today);
  const [cat, setCat] = useState(initial ? initial.category : (project.categories[kind] || [])[0] || '');
  const [desc, setDesc] = useState(initial ? initial.description : '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [vendor, setVendor] = useState(initial ? initial.vendor || '' : '');
  const [vat, setVat] = useState(initial ? !!initial.vat : false);
  const [wht, setWht] = useState(initial ? initial.withholding || 0 : 0);
  const [deductionPct, setDeductionPct] = useState(initial && initial.deductionPct ? initial.deductionPct : 0);
  const [deductionNote, setDeductionNote] = useState(initial && initial.deductionNote ? initial.deductionNote : '');
  const [attach, setAttach] = useState(initial ? initial.attachment : null);

  // update category list when kind changes
  useEffect(() => {
    const list = project.categories[k] || [];
    if (!list.includes(cat)) setCat(list[0] || '');
  }, [k]);

  const amt = parseFloat(amount.replace(/,/g, '')) || 0;
  const vatAmt = vat ? amt * 0.07 : 0;
  const whtAmt = wht > 0 ? amt * (wht / 100) : 0;
  const dedPct = parseFloat(String(deductionPct).replace(/,/g,'')) || 0;
  const dedAmt = k === 'income' && dedPct > 0 ? amt * (dedPct / 100) : 0;
  const netPay = k === 'income' ? amt - dedAmt : amt + vatAmt - whtAmt;

  const isExpense = k !== 'income';
  const isIncome = k === 'income';
  const canSubmit = date && cat && desc.trim() && amt > 0;

  const submit = () => {
    if (!canSubmit) return;
    const tx = {
      id: initial ? initial.id : genId(),
      kind: k,
      date,
      category: cat,
      description: desc.trim(),
      amount: amt,
      vendor: vendor.trim(),
      vat,
      withholding: wht,
      deductionPct: isIncome ? dedPct : 0,
      deductionNote: isIncome ? deductionNote.trim() : '',
      attachment: attach
    };
    onSubmit(tx);
  };

  return (
    <Modal open={true} onClose={onClose}
      title={mode === 'add' ? `เพิ่ม${KINDS[k].label}` : `แก้ไข${KINDS[k].label}`}
      wide
      footer={<>
        <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" disabled={!canSubmit} onClick={submit}>
          <Icon name="check" size={14}/> {mode === 'add' ? 'บันทึกรายการ' : 'อัปเดตรายการ'}
        </button>
      </>}>
      <div className="form-grid">
        <div className="field full">
          <label>ประเภทรายการ</label>
          <div className="row gap-4" style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'6px'}}>
            {ALL_KINDS.map(x => (
              <button key={x}
                className={`btn sm ${k === x ? 'primary' : ''}`}
                style={{justifyContent:'center', padding:'10px 8px'}}
                onClick={() => setK(x)}>
                <KindIcon kind={x} size={14}/> {KINDS[x].short}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>วันที่ <span className="req">*</span></label>
          <input className="input-base" type="date" value={date} onChange={e => setDate(e.target.value)}/>
        </div>
        <div className="field">
          <label>หมวดหมู่ย่อย <span className="req">*</span></label>
          <select className="input-base" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">— เลือกหมวดหมู่ —</option>
            {(project.categories[k] || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="hint">จัดการเพิ่ม/ลบหมวดได้ที่แท็บ "จัดการหมวดหมู่"</span>
        </div>

        <div className="field full">
          <label>รายละเอียดรายการ <span className="req">*</span></label>
          <textarea className="input-base" placeholder="เช่น ปูน TPI 50ถุง + ทรายหยาบ 4คิว, ค่าแรงทีมปูน เดือน ก.ย."
            value={desc} onChange={e => setDesc(e.target.value)}/>
        </div>

        <div className="field">
          <label>จำนวนเงิน (บาท) <span className="req">*</span></label>
          <div className="with-suffix">
            <input className="input-base num-input" inputMode="decimal" placeholder="0"
              value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}/>
            <span className="suffix">บาท</span>
          </div>
        </div>
        <div className="field">
          <label>คู่ค้า / ผู้รับเงิน</label>
          <input className="input-base" placeholder={k === 'income' ? 'ชื่อเจ้าของงาน' : 'ชื่อร้าน / ผู้รับเหมา / ทีมงาน'}
            value={vendor} onChange={e => setVendor(e.target.value)}/>
        </div>

        {isExpense ? (
          <div className="field full">
            <label>ภาษีและการหัก ณ ที่จ่าย</label>
            <div className="tax-row">
              <label>
                <input type="checkbox" checked={vat} onChange={e => setVat(e.target.checked)}/>
                ใบกำกับภาษี (VAT 7%)
              </label>
              <span className="dim">|</span>
              <label style={{gap:'8px'}}>
                หัก ณ ที่จ่าย:
                <select className="input-base" value={wht} onChange={e => setWht(Number(e.target.value))} style={{padding:'4px 8px', width:'auto'}}>
                  <option value={0}>ไม่หัก</option>
                  <option value={1}>1% (ค่าวัสดุ)</option>
                  <option value={3}>3% (ค่าจ้าง/บริการ)</option>
                  <option value={5}>5% (ค่าเช่า)</option>
                </select>
              </label>
            </div>
          </div>
        ) : (
          <div className="field full">
            <label>หักออกจากรายรับ (%) <span className="dim sublabel">เช่น ค่าธรรมเนียม, หัก ณ ที่จ่าย, ค่านายหน้า</span></label>
            <div className="income-deduction-row">
              <div className="income-deduction-presets">
                {[0, 1, 3, 5, 7, 10].map(p => (
                  <button key={p} type="button" className={`chip ${dedPct === p ? 'on' : ''}`} onClick={() => setDeductionPct(p)}>
                    {p === 0 ? 'ไม่หัก' : p + '%'}
                  </button>
                ))}
                <div className="with-suffix" style={{flex:'0 0 110px'}}>
                  <input className="input-base num-input" inputMode="decimal" placeholder="กำหนดเอง"
                    value={deductionPct || ''} onChange={e => setDeductionPct(e.target.value.replace(/[^\d.]/g,''))} style={{textAlign:'right'}}/>
                  <span className="suffix">%</span>
                </div>
              </div>
              <input className="input-base" placeholder="หมายเหตุ (ถ้ามี) เช่น หัก ณ ที่จ่าย 3% จากเจ้าของงาน, ค่าธรรมเนียมตัวแทน"
                value={deductionNote} onChange={e => setDeductionNote(e.target.value)} style={{marginTop:'8px'}}/>
            </div>
          </div>
        )}

        <div className="field full">
          <label>แนบไฟล์ใบเสร็จ / เอกสาร</label>
          <FileField value={attach} onChange={setAttach}/>
        </div>

        {amt > 0 ? (
          <div className="field full">
            <div className="calc-box">
              <div className="row">
                <span className="uppercase muted">สรุปการคำนวณ</span>
              </div>
              <div className="row" style={{gap:0, justifyContent:'space-between'}}>
                <span>{isIncome ? 'ยอดรายรับที่เรียกเก็บ' : 'มูลค่ารายการ'}</span>
                <span className="v mono">{formatBaht(amt)} บ.</span>
              </div>
              {vat ? (
                <div className="row" style={{gap:0, justifyContent:'space-between'}}>
                  <span>+ VAT 7%</span>
                  <span className="v mono">{formatBaht(vatAmt)} บ.</span>
                </div>
              ) : null}
              {wht > 0 ? (
                <div className="row" style={{gap:0, justifyContent:'space-between'}}>
                  <span>− หัก ณ ที่จ่าย {wht}%</span>
                  <span className="v mono">−{formatBaht(whtAmt)} บ.</span>
                </div>
              ) : null}
              {isIncome && dedPct > 0 ? (
                <div className="row" style={{gap:0, justifyContent:'space-between'}}>
                  <span>− หักออก {dedPct}%{deductionNote ? ' (' + deductionNote + ')' : ''}</span>
                  <span className="v mono">−{formatBaht(dedAmt)} บ.</span>
                </div>
              ) : null}
              <div className="row total" style={{justifyContent:'space-between', borderTop:'1px solid var(--border)', paddingTop:'8px', marginTop:'4px'}}>
                <span style={{fontWeight:600}}>{isIncome ? 'รายรับสุทธิ (ต้นทุนจริง)' : 'ยอดสุทธิที่จ่ายจริง'}</span>
                <span className="v mono pos" style={{fontSize:'17px', fontWeight:600}}>{formatBaht(netPay)} บาท</span>
              </div>
              {isIncome && dedPct > 0 ? (
                <div className="dim" style={{fontSize:'11.5px', marginTop:'4px', textAlign:'right'}}>
                  รายรับตั้งต้น {formatBaht(amt)} บ. · หัก {dedPct}% = ต้นทุนจริง {formatBaht(netPay)} บ.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

/* ============================================================
   BALANCE SHEET
   ============================================================ */
function BalanceSheet({ project, onBack, currentRole }) {
  // Role gating
  const role = ROLES[currentRole] || ROLES.staff;
  if (!role.canViewBalance) {
    return (
      <div>
        <div className="print-hide" style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
          <button className="btn ghost sm" onClick={onBack}>
            <Icon name="arrow-left" size={14}/> กลับสู่โครงการ
          </button>
        </div>
        <div className="lock-screen">
          <div className="icon-circle"><Icon name="shield-check" size={28}/></div>
          <h2>หน้านี้สำหรับผู้บริหารเท่านั้น</h2>
          <p>
            งบดุลโครงการมีข้อมูลทางการเงินที่อ่อนไหว
            จึงเปิดให้เฉพาะผู้ใช้ที่มีสิทธิ์ <strong style={{color:'var(--brand-bright)'}}>"ผู้บริหาร (Executive)"</strong> เท่านั้น
          </p>
          <div className="row" style={{justifyContent:'center', gap:'8px'}}>
            <span className="dim" style={{fontSize:'12px'}}>สิทธิ์ปัจจุบัน:</span>
            <span className={`role-badge ${role.key}`}>{role.short} · {role.label}</span>
          </div>
          <p className="dim" style={{fontSize:'12px', marginTop:'16px'}}>หากต้องการเข้าถึง ติดต่อผู้ดูแลระบบหรือสลับโหมดที่มุมขวาบน</p>
        </div>
      </div>
    );
  }

  const agg = useMemo(() => aggregateProject(project), [project]);

  // Period controls
  const [period, setPeriod] = useState('all'); // all | day | month | range
  const [from, setFrom] = useState(project.startDate);
  const [to, setTo] = useState(new Date().toISOString().slice(0,10));
  const [viewMode, setViewMode] = useState('category'); // category | timeline

  // Filter transactions by date range
  const inRange = useCallback((iso) => {
    if (period === 'all') return true;
    if (!iso) return false;
    return iso >= from && iso <= to;
  }, [period, from, to]);

  const filteredTxs = useMemo(() =>
    project.transactions.filter(t => {
      if (t.kind === 'income') return inRange(t.date);
      // For PO, count only when actually paid (use paidAt for paid POs)
      const status = getStatus(t);
      if (status === 'paid') return inRange(t.paidAt || t.date);
      return false; // pending POs not in balance sheet
    }),
    [project, inRange]);

  // Aggregate for filtered range
  const rangeAgg = useMemo(() => {
    const a = {
      income: 0, incomeNet: 0, incomeDeduction: 0,
      expense: 0, byKind: { income: 0, material: 0, labor: 0, subcontract: 0, machine: 0, other: 0 },
      byCategory: {} // {kind: {category: amount}}
    };
    for (const k of [...EXPENSE_KINDS, 'income']) a.byCategory[k] = {};
    for (const t of filteredTxs) {
      if (t.kind === 'income') {
        a.income += t.amount;
        const d = t.deductionPct > 0 ? t.amount * (t.deductionPct / 100) : 0;
        a.incomeDeduction += d;
        a.incomeNet += t.amount - d;
        a.byCategory.income[t.category] = (a.byCategory.income[t.category] || 0) + t.amount;
      } else {
        a.expense += t.amount;
        a.byKind[t.kind] += t.amount;
        const items = getPOItems(t);
        for (const it of items) {
          a.byCategory[t.kind][it.category] = (a.byCategory[t.kind][it.category] || 0) + it.amount;
        }
      }
    }
    a.profit = a.incomeNet - a.expense;
    a.margin = a.incomeNet > 0 ? (a.profit / a.incomeNet) * 100 : 0;
    return a;
  }, [filteredTxs]);

  // Timeline grouping (day or month)
  const timeline = useMemo(() => {
    if (period !== 'day' && period !== 'month') return null;
    const map = new Map();
    for (const t of filteredTxs) {
      const dateStr = t.kind === 'income' ? t.date : (t.paidAt || t.date);
      const d = new Date(dateStr);
      const key = period === 'day'
        ? dateStr
        : (d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
      if (!map.has(key)) {
        map.set(key, { key, income: 0, incomeNet: 0, material: 0, labor: 0, subcontract: 0, machine: 0, other: 0 });
      }
      const row = map.get(key);
      if (t.kind === 'income') {
        row.income += t.amount;
        const d2 = t.deductionPct > 0 ? t.amount * (t.deductionPct / 100) : 0;
        row.incomeNet += t.amount - d2;
      } else {
        row[t.kind] += t.amount;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredTxs, period]);

  const print = () => window.print();

  const exportCSV = () => {
    const rows = [
      ['งบดุลโครงการ', project.name],
      ['รหัสโครงการ', project.code], ['เจ้าของงาน', project.client],
      ['ช่วงเวลา', period === 'all' ? 'ทั้งหมด' : `${from} ถึง ${to}`],
      [], ['หมวด', 'จำนวนเงิน (บาท)']
    ];
    rows.push(['รายรับรวม (เก็บจากงวดงาน)', rangeAgg.income]);
    rows.push(['หักออกจากรายรับ', rangeAgg.incomeDeduction]);
    rows.push(['รายรับสุทธิ', rangeAgg.incomeNet]);
    for (const k of EXPENSE_KINDS) rows.push([KINDS[k].label, rangeAgg.byKind[k] || 0]);
    rows.push(['รวมรายจ่าย', rangeAgg.expense]);
    rows.push(['กำไร/ขาดทุนสุทธิ', rangeAgg.profit]);
    rows.push(['Margin (%)', rangeAgg.margin.toFixed(2)]);
    if (timeline) {
      rows.push([], [period === 'day' ? 'ราย วัน' : 'ราย เดือน']);
      rows.push(['ช่วงเวลา', 'รายรับ', 'รายรับสุทธิ', 'วัสดุ', 'แรงงาน', 'รับเหมาช่วง', 'เครื่องจักร', 'อื่นๆ', 'รวมจ่าย', 'กำไร']);
      for (const r of timeline) {
        const exp = r.material + r.labor + r.subcontract + r.machine + r.other;
        rows.push([r.key, r.income, r.incomeNet, r.material, r.labor, r.subcontract, r.machine, r.other, exp, r.incomeNet - exp]);
      }
    }
    downloadCSV(`${project.code}_balance_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const periodLabel = period === 'all' ? 'ทั้งหมดของโครงการ'
    : period === 'day' ? `ราย วัน · ${formatDate(from)} — ${formatDate(to)}`
    : period === 'month' ? `ราย เดือน · ${formatDate(from)} — ${formatDate(to)}`
    : `${formatDate(from)} — ${formatDate(to)}`;

  return (
    <div>
      <div className="print-hide" style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
        <button className="btn ghost sm" onClick={onBack}>
          <Icon name="arrow-left" size={14}/> กลับสู่โครงการ
        </button>
        <span className={`role-badge ${role.key}`} style={{marginLeft:'auto'}}>
          <Icon name="shield-check" size={11}/> {role.short} · {role.label}
        </span>
      </div>

      <div className="page-header print-hide">
        <div className="titles">
          <h1>งบดุลโครงการ</h1>
          <div className="sub">รายงานสรุปรายรับ-รายจ่ายเลือกช่วงเวลา หมวดหมู่งาน สำหรับผู้บริหาร</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={exportCSV}><Icon name="download" size={14}/> ส่งออก CSV</button>
          <button className="btn primary" onClick={print}><Icon name="print" size={14}/> พิมพ์ใบสรุป</button>
        </div>
      </div>

      {/* Period + view controls */}
      <div className="bs-controls print-hide">
        <span className="label-tag">รายงานแบบ:</span>
        <div className="role-switcher">
          <button className={period === 'all' ? 'on' : ''} onClick={() => setPeriod('all')}>รวมทั้งหมด</button>
          <button className={period === 'day' ? 'on' : ''} onClick={() => setPeriod('day')}>วันต่อวัน</button>
          <button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>ราย เดือน</button>
          <button className={period === 'range' ? 'on' : ''} onClick={() => setPeriod('range')}>ระบุช่วง</button>
        </div>
        {period !== 'all' ? (
          <>
            <span className="dim" style={{marginLeft:'8px', fontSize:'12px'}}>ตั้งแต่</span>
            <input className="input-base" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{width:'auto'}}/>
            <span className="dim" style={{fontSize:'12px'}}>ถึง</span>
            <input className="input-base" type="date" value={to} onChange={e => setTo(e.target.value)} style={{width:'auto'}}/>
          </>
        ) : null}
        <div style={{flex:1}}></div>
        <span className="label-tag">มุมมอง:</span>
        <div className="role-switcher">
          <button className={viewMode === 'category' ? 'on' : ''} onClick={() => setViewMode('category')}>
            <Icon name="tags" size={12}/> ตามหมวดหมู่
          </button>
          <button className={viewMode === 'timeline' ? 'on' : ''} onClick={() => setViewMode('timeline')} disabled={period === 'all' || period === 'range'}>
            <Icon name="calendar" size={12}/> ตามช่วงเวลา
          </button>
        </div>
      </div>

      <div className="balance-sheet">
        <div className="doc-head">
          <div>
            <h2>งบดุลโครงการ</h2>
            <div className="sub mono">{project.code} · {project.name}</div>
            <div className="sub" style={{marginTop:'8px'}}>
              <div>เจ้าของงาน: <strong>{project.client}</strong></div>
              <div>ที่ตั้ง: {project.location}</div>
              <div>ช่วงเวลารายงาน: <strong style={{color:'var(--brand-bright)'}}>{periodLabel}</strong></div>
              <div>จำนวนรายการในช่วงนี้: {filteredTxs.length} รายการ</div>
            </div>
          </div>
          <div className="right">
            <div className="logo"><img src="assets/forhouse-logo.jpg" alt="FOR HOUSE"/></div>
            <div className="dim" style={{fontSize:'11px', marginTop:'8px'}}>ออกเอกสาร {formatDateLong(new Date().toISOString().slice(0,10))}</div>
            <Badge tone="brand" lg dot>{filteredTxs.length > 0 ? 'พร้อมใช้งาน' : 'ไม่มีข้อมูล'}</Badge>
          </div>
        </div>

        {/* Summary KPIs in balance sheet */}
        <div className="bs-section">
          <h3>สรุปผลประกอบการในช่วงเวลานี้</h3>
          <div className="bs-grid">
            <div>
              <div className="bs-line">
                <span>รายรับรวม (จากเจ้าของงาน)</span>
                <span className="v pos">+ {formatBaht(rangeAgg.income)}</span>
              </div>
              {rangeAgg.incomeDeduction > 0 ? (<>
                <div className="bs-line indent">
                  <span>− หักออกจากรายรับ</span>
                  <span className="v">− {formatBaht(rangeAgg.incomeDeduction)}</span>
                </div>
                <div className="bs-line total">
                  <span>รายรับสุทธิ (ต้นทุนจริง)</span>
                  <span className="v pos">{formatBaht(rangeAgg.incomeNet)}</span>
                </div>
              </>) : null}
            </div>
            <div>
              <div className="bs-line">
                <span>รายจ่ายรวม</span>
                <span className="v neg">− {formatBaht(rangeAgg.expense)}</span>
              </div>
              <div className="bs-line total">
                <span>กำไร / (ขาดทุน) สุทธิ</span>
                <span className={`v ${rangeAgg.profit >= 0 ? 'pos' : 'neg'}`}>
                  {rangeAgg.profit >= 0 ? '+' : '−'} {formatBaht(Math.abs(rangeAgg.profit))}
                </span>
              </div>
              <div className="bs-line">
                <span>Margin (อัตรากำไรขั้นต้น)</span>
                <span className={`v ${rangeAgg.margin >= 0 ? 'pos' : 'neg'}`}>{rangeAgg.margin.toFixed(2)} %</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline view */}
        {viewMode === 'timeline' && timeline ? (
          <div className="bs-section">
            <h3>{period === 'day' ? 'รายงานรายวัน' : 'รายงานรายเดือน'} ({timeline.length} {period === 'day' ? 'วัน' : 'เดือน'})</h3>
            <div className="table-scroll">
              <table className="bs-time-table">
                <thead>
                  <tr>
                    <th>{period === 'day' ? 'วันที่' : 'เดือน'}</th>
                    <th>รายรับ</th>
                    <th>วัสดุ</th>
                    <th>แรงงาน</th>
                    <th>รับเหมาช่วง</th>
                    <th>เครื่องจักร</th>
                    <th>อื่นๆ</th>
                    <th style={{color:'var(--text-1)', borderColor:'var(--text-1)'}}>กำไร/ขาดทุน</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map(r => {
                    const exp = r.material + r.labor + r.subcontract + r.machine + r.other;
                    const profit = r.incomeNet - exp;
                    const lbl = period === 'day'
                      ? formatDate(r.key)
                      : (() => {
                          const [y, m] = r.key.split('-');
                          const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
                          return months[Number(m) - 1] + ' ' + (Number(y) + 543);
                        })();
                    return (
                      <tr key={r.key}>
                        <td>{lbl}</td>
                        <td className={r.income > 0 ? 'pos' : 'dim'}>{r.income > 0 ? formatBaht(r.income) : '—'}</td>
                        <td className={r.material > 0 ? '' : 'dim'}>{r.material > 0 ? formatBaht(r.material) : '—'}</td>
                        <td className={r.labor > 0 ? '' : 'dim'}>{r.labor > 0 ? formatBaht(r.labor) : '—'}</td>
                        <td className={r.subcontract > 0 ? '' : 'dim'}>{r.subcontract > 0 ? formatBaht(r.subcontract) : '—'}</td>
                        <td className={r.machine > 0 ? '' : 'dim'}>{r.machine > 0 ? formatBaht(r.machine) : '—'}</td>
                        <td className={r.other > 0 ? '' : 'dim'}>{r.other > 0 ? formatBaht(r.other) : '—'}</td>
                        <td className={profit >= 0 ? 'pos' : 'neg'} style={{fontWeight:600}}>
                          {profit >= 0 ? '+' : '−'}{formatBaht(Math.abs(profit))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="grand">
                    <td>รวมทั้งช่วงเวลา</td>
                    <td className="pos">{formatBaht(rangeAgg.income)}</td>
                    <td>{formatBaht(rangeAgg.byKind.material)}</td>
                    <td>{formatBaht(rangeAgg.byKind.labor)}</td>
                    <td>{formatBaht(rangeAgg.byKind.subcontract)}</td>
                    <td>{formatBaht(rangeAgg.byKind.machine)}</td>
                    <td>{formatBaht(rangeAgg.byKind.other)}</td>
                    <td className={rangeAgg.profit >= 0 ? 'pos' : 'neg'}>
                      {rangeAgg.profit >= 0 ? '+' : '−'}{formatBaht(Math.abs(rangeAgg.profit))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}

        {/* Category view */}
        {viewMode === 'category' ? (
          <div className="bs-section">
            <h3>รายงานแยกตามหมวดหมู่งาน</h3>

            {/* Income */}
            {Object.keys(rangeAgg.byCategory.income).length > 0 ? (
              <div className="bs-category-card income">
                <div className="head">
                  <div className="ic" style={{background:'var(--brand-soft)', color:'var(--brand-bright)'}}><Icon name="income" size={16}/></div>
                  <div className="title">รายรับ (จากเจ้าของงาน)</div>
                  <div className="total pos">+ {formatBaht(rangeAgg.income)} <span className="dim" style={{fontSize:'11px', fontWeight:400}}>บ.</span></div>
                </div>
                {Object.entries(rangeAgg.byCategory.income).sort((a,b)=>b[1]-a[1]).map(([cat, v]) => (
                  <div key={cat} className="bs-category-row">
                    <span>{cat}</span>
                    <span className="v">{formatBaht(v)}</span>
                  </div>
                ))}
                {rangeAgg.incomeDeduction > 0 ? (
                  <div className="bs-category-row" style={{borderTop:'1px dashed var(--border)', marginTop:'8px', paddingTop:'10px', color:'var(--text-2)'}}>
                    <span><Icon name="trend-down" size={11}/> หักออกจากรายรับ</span>
                    <span className="v" style={{color:'var(--danger-bright)'}}>− {formatBaht(rangeAgg.incomeDeduction)}</span>
                  </div>
                ) : null}
                {rangeAgg.incomeDeduction > 0 ? (
                  <div className="bs-category-row" style={{fontWeight:600, color:'var(--text-1)'}}>
                    <span>= รายรับสุทธิ (ต้นทุนจริง)</span>
                    <span className="v pos" style={{fontSize:'14px'}}>{formatBaht(rangeAgg.incomeNet)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Expenses by kind */}
            {EXPENSE_KINDS.map(k => {
              const cats = rangeAgg.byCategory[k];
              const total = rangeAgg.byKind[k];
              if (total === 0) return null;
              return (
                <div key={k} className={`bs-category-card ${k}`}>
                  <div className="head">
                    <div className="ic" style={{background: KINDS[k].color + '20', color: KINDS[k].color}}>
                      <KindIcon kind={k} size={16}/>
                    </div>
                    <div className="title">{KINDS[k].label}</div>
                    <div className="total neg">− {formatBaht(total)} <span className="dim" style={{fontSize:'11px', fontWeight:400}}>บ.</span></div>
                  </div>
                  {Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat, v]) => (
                    <div key={cat} className="bs-category-row">
                      <span>{cat} <span className="dim" style={{fontSize:'11px', marginLeft:'4px'}}>({(v/total*100).toFixed(1)}%)</span></span>
                      <span className="v">{formatBaht(v)}</span>
                    </div>
                  ))}
                </div>
              );
            })}

            {rangeAgg.income === 0 && rangeAgg.expense === 0 ? (
              <Empty
                title="ไม่มีข้อมูลในช่วงเวลานี้"
                hint="ลองขยายช่วงเวลาให้กว้างขึ้น หรือเลือก รวมทั้งหมด"
              />
            ) : null}
          </div>
        ) : null}

        {/* Budget vs actual */}
        <div className="bs-section">
          <h3>เปรียบเทียบงบประมาณ vs จ่ายจริง (สะสมทั้งโครงการ)</h3>
          <div className="breakdown">
            {EXPENSE_KINDS.map(k => {
              const b = project.budgets[k] || 0;
              const a = agg.byKind[k] || 0;
              const ratio = b > 0 ? a / b : 0;
              return (
                <div key={k} className="breakdown-row">
                  <div className="swatch" style={{background: KINDS[k].color}}></div>
                  <div className="lbl">
                    <div className="name">{KINDS[k].short}</div>
                    <Bar value={a} max={b} tone="auto" thin/>
                    <div className="sub"><span>{Math.round(ratio * 100)}%</span><span className="sep">·</span><span>คงเหลือ {formatBaht(b - a)} บาท</span></div>
                  </div>
                  <div className="num">{formatBaht(a)}</div>
                  <div className="num sec">/ {formatBaht(b)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', gap:'24px', marginTop:'40px', paddingTop:'24px', borderTop:'1px solid var(--border)'}}>
          <div style={{flex:1, textAlign:'center'}}>
            <div style={{borderTop:'1px solid var(--text-3)', paddingTop:'8px', maxWidth:'200px', margin:'40px auto 0'}}>
              <div className="dim" style={{fontSize:'12px'}}>ผู้จัดทำเอกสาร</div>
            </div>
          </div>
          <div style={{flex:1, textAlign:'center'}}>
            <div style={{borderTop:'1px solid var(--text-3)', paddingTop:'8px', maxWidth:'200px', margin:'40px auto 0'}}>
              <div className="dim" style={{fontSize:'12px'}}>ผู้บริหาร / ผู้ตรวจสอบ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ALL-PROJECTS BALANCE — daily/monthly across every project
   ============================================================ */
function AllBalance({ projects, onBack, currentRole }) {
  const role = ROLES[currentRole] || ROLES.staff;
  if (!role.canViewBalance) {
    return (
      <div>
        <div className="print-hide" style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
          <button className="btn ghost sm" onClick={onBack}>
            <Icon name="arrow-left" size={14}/> กลับแดชบอร์ด
          </button>
        </div>
        <div className="lock-screen">
          <div className="icon-circle"><Icon name="shield-check" size={28}/></div>
          <h2>หน้านี้สำหรับผู้บริหารเท่านั้น</h2>
          <p>งบดุลรวมทุกโครงการเปิดให้เฉพาะ <strong style={{color:'var(--brand-bright)'}}>ผู้บริหาร (Executive)</strong> เท่านั้น</p>
          <div className="row" style={{justifyContent:'center', gap:'8px'}}>
            <span className="dim" style={{fontSize:'12px'}}>สิทธิ์ปัจจุบัน:</span>
            <span className={`role-badge ${role.key}`}>{role.short} · {role.label}</span>
          </div>
        </div>
      </div>
    );
  }

  const [period, setPeriod] = useState('month'); // day | month
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [projectFilter, setProjectFilter] = useState('all');

  const inRange = useCallback((iso) => {
    if (!iso) return false;
    return iso >= from && iso <= to;
  }, [from, to]);

  // Build {periodKey: {projectId: {income, expense, byKind}}}
  const data = useMemo(() => {
    const map = new Map(); // period key → row
    const projList = projectFilter === 'all' ? projects : projects.filter(p => p.id === projectFilter);
    for (const p of projList) {
      for (const t of p.transactions) {
        const isIncome = t.kind === 'income';
        const status = isIncome ? null : getStatus(t);
        if (!isIncome && status !== 'paid') continue;
        const dateStr = isIncome ? t.date : (t.paidAt || t.date);
        if (!inRange(dateStr)) continue;
        const d = new Date(dateStr);
        const key = period === 'day' ? dateStr : (d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
        if (!map.has(key)) {
          map.set(key, { key, income: 0, incomeNet: 0, material: 0, labor: 0, subcontract: 0, machine: 0, other: 0, projects: new Set() });
        }
        const row = map.get(key);
        row.projects.add(p.id);
        if (isIncome) {
          row.income += t.amount;
          const ded = t.deductionPct > 0 ? t.amount * (t.deductionPct / 100) : 0;
          row.incomeNet += t.amount - ded;
        } else {
          row[t.kind] += t.amount;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [projects, period, inRange, projectFilter]);

  const totals = useMemo(() => {
    const t = { income: 0, incomeNet: 0, material: 0, labor: 0, subcontract: 0, machine: 0, other: 0 };
    for (const r of data) {
      for (const k of Object.keys(t)) t[k] += r[k];
    }
    t.expense = t.material + t.labor + t.subcontract + t.machine + t.other;
    t.profit = t.incomeNet - t.expense;
    return t;
  }, [data]);

  const print = () => window.print();
  const exportCSV = () => {
    const rows = [['ช่วงเวลา', 'รายรับ', 'รายรับสุทธิ', 'วัสดุ', 'แรงงาน', 'รับเหมาช่วง', 'เครื่องจักร', 'อื่นๆ', 'รวมจ่าย', 'กำไร', 'โครงการ']];
    for (const r of data) {
      const exp = r.material + r.labor + r.subcontract + r.machine + r.other;
      rows.push([r.key, r.income, r.incomeNet, r.material, r.labor, r.subcontract, r.machine, r.other, exp, r.incomeNet - exp, r.projects.size]);
    }
    downloadCSV(`AllProjects_balance_${period}_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const formatPeriodKey = (key) => {
    if (period === 'day') return formatDate(key);
    const [y, m] = key.split('-');
    const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return months[Number(m) - 1] + ' ' + (Number(y) + 543);
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
          <h1>งบดุลรวมทุกโครงการ</h1>
          <div className="sub">รายรับ-รายจ่ายแบบรายวัน / รายเดือน รวมทุกโครงการที่กำลังดำเนินงาน</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={exportCSV}><Icon name="download" size={14}/> ส่งออก CSV</button>
          <button className="btn primary" onClick={print}><Icon name="print" size={14}/> พิมพ์รายงาน</button>
        </div>
      </div>

      <div className="bs-controls print-hide">
        <span className="label-tag">รายงานแบบ:</span>
        <div className="role-switcher">
          <button className={period === 'day' ? 'on' : ''} onClick={() => setPeriod('day')}>วันต่อวัน</button>
          <button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>ราย เดือน</button>
        </div>
        <span className="dim" style={{marginLeft:'8px', fontSize:'12px'}}>ตั้งแต่</span>
        <input className="input-base" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{width:'auto'}}/>
        <span className="dim" style={{fontSize:'12px'}}>ถึง</span>
        <input className="input-base" type="date" value={to} onChange={e => setTo(e.target.value)} style={{width:'auto'}}/>
        <div style={{flex:1}}></div>
        <span className="label-tag">โครงการ:</span>
        <select className="input-base" value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={{width:'auto', minWidth:'200px'}}>
          <option value="all">ทุกโครงการ ({projects.length})</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Summary KPIs */}
      <div className="stat-grid">
        <Stat tone="income" icon="income" label="รายรับรวมในช่วงเวลานี้"
          value={formatBaht(totals.income)}
          delta={totals.incomeNet !== totals.income ? `รายรับสุทธิ ${formatBaht(totals.incomeNet, {compact:true})} บ.` : `จาก ${data.length} ${period === 'day' ? 'วัน' : 'เดือน'}`}/>
        <Stat tone="expense" icon="expense" label="รายจ่ายรวม"
          value={formatBaht(totals.expense)}
          delta={`${totals.income > 0 ? Math.round(totals.expense / totals.income * 100) : 0}% ของรายรับ`}/>
        <Stat tone="profit" icon="wallet" label="กำไรสุทธิ"
          value={formatBaht(totals.profit)}
          delta={totals.profit >= 0 ? 'กำไรในช่วงนี้' : 'ขาดทุนในช่วงนี้'}
          deltaTone={totals.profit >= 0 ? 'up' : 'down'}/>
        <Stat tone="margin" icon="pie" label="Margin เฉลี่ย" unit="%"
          value={totals.incomeNet > 0 ? (totals.profit / totals.incomeNet * 100).toFixed(1) : '0'}
          delta={`${data.reduce((s,r)=>s+r.projects.size,0) / Math.max(1,data.length)} โครงการ/${period === 'day' ? 'วัน' : 'เดือน'} เฉลี่ย`}/>
      </div>

      {/* Table */}
      <div className="card">
        <div className="uppercase muted mb-16">รายงานละเอียดตาม{period === 'day' ? 'วัน' : 'เดือน'}</div>
        <div className="table-scroll">
          <table className="bs-time-table">
            <thead>
              <tr>
                <th>{period === 'day' ? 'วันที่' : 'เดือน'}</th>
                <th>รายรับ</th>
                <th>วัสดุ</th>
                <th>แรงงาน</th>
                <th>รับเหมาช่วง</th>
                <th>เครื่องจักร</th>
                <th>อื่นๆ</th>
                <th>รวมจ่าย</th>
                <th style={{color:'var(--text-1)', borderColor:'var(--text-1)'}}>กำไร/ขาดทุน</th>
                <th style={{textAlign:'center'}}>โครงการ</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="10" style={{textAlign:'center', padding:'40px', color:'var(--text-3)'}}>
                  ไม่มีข้อมูลในช่วงเวลานี้ — ลองขยายช่วงเวลาดู
                </td></tr>
              ) : data.map(r => {
                const exp = r.material + r.labor + r.subcontract + r.machine + r.other;
                const profit = r.incomeNet - exp;
                return (
                  <tr key={r.key}>
                    <td>{formatPeriodKey(r.key)}</td>
                    <td className={r.income > 0 ? 'pos' : 'dim'}>{r.income > 0 ? formatBaht(r.income) : '—'}</td>
                    <td className={r.material > 0 ? '' : 'dim'}>{r.material > 0 ? formatBaht(r.material) : '—'}</td>
                    <td className={r.labor > 0 ? '' : 'dim'}>{r.labor > 0 ? formatBaht(r.labor) : '—'}</td>
                    <td className={r.subcontract > 0 ? '' : 'dim'}>{r.subcontract > 0 ? formatBaht(r.subcontract) : '—'}</td>
                    <td className={r.machine > 0 ? '' : 'dim'}>{r.machine > 0 ? formatBaht(r.machine) : '—'}</td>
                    <td className={r.other > 0 ? '' : 'dim'}>{r.other > 0 ? formatBaht(r.other) : '—'}</td>
                    <td className="neg">{formatBaht(exp)}</td>
                    <td className={profit >= 0 ? 'pos' : 'neg'} style={{fontWeight:600}}>
                      {profit >= 0 ? '+' : '−'}{formatBaht(Math.abs(profit))}
                    </td>
                    <td style={{textAlign:'center', fontFamily:'var(--mono)'}}>{r.projects.size}</td>
                  </tr>
                );
              })}
            </tbody>
            {data.length > 0 ? (
              <tfoot>
                <tr className="grand">
                  <td>รวมในช่วงเวลานี้</td>
                  <td className="pos">{formatBaht(totals.income)}</td>
                  <td>{formatBaht(totals.material)}</td>
                  <td>{formatBaht(totals.labor)}</td>
                  <td>{formatBaht(totals.subcontract)}</td>
                  <td>{formatBaht(totals.machine)}</td>
                  <td>{formatBaht(totals.other)}</td>
                  <td className="neg">{formatBaht(totals.expense)}</td>
                  <td className={totals.profit >= 0 ? 'pos' : 'neg'}>
                    {totals.profit >= 0 ? '+' : '−'}{formatBaht(Math.abs(totals.profit))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, ProjectView, BalanceSheet, AllBalance });
