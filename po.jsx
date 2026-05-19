/* FOR HOUSE — Purchase Order (PO) module
   Workflow: ร่าง → รออนุมัติ → อนุมัติ → จ่ายแล้ว(+สลิป)
   ============================================================ */

// CURRENT_USER is set dynamically by app.jsx after Supabase login.
// Falls back to a safe default so the module loads in demo/offline mode.
const CURRENT_USER = new Proxy(
  { name: 'ผู้ใช้', role: 'staff', canApprove: false },
  { get(fallback, key) { return (window.CURRENT_USER || fallback)[key]; } }
);

/* ============ ROLE / PERMISSIONS ============ */
const ROLES = {
  staff:      { key: 'staff',     label: 'เจ้าหน้าที่',  short: 'STAFF',    color: '#94a3b8', canViewBalance: false, canApprove: false, canEditPlan: false, canManageCategories: false, canManageTeam: false },
  manager:    { key: 'manager',   label: 'ผู้จัดการ',    short: 'MANAGER',  color: '#60a5fa', canViewBalance: false, canApprove: true,  canEditPlan: false, canManageCategories: true,  canManageTeam: false },
  executive:  { key: 'executive', label: 'ผู้บริหาร',    short: 'EXEC',     color: '#22c55e', canViewBalance: true,  canApprove: true,  canEditPlan: true,  canManageCategories: true,  canManageTeam: true  }
};

/* ============ PO Status Badge ============ */
function POStatusBadge({ status, large }) {
  const s = PO_STATUS[status] || PO_STATUS.draft;
  return (
    <Badge tone={s.tone} dot lg={large}>
      <Icon name={s.icon} size={11}/> {s.label}
    </Badge>
  );
}

/* ============ Status Stepper ============ */
function POStepper({ status }) {
  const cur = PO_STATUS[status];
  const isRejected = status === 'rejected';
  const steps = [
    { key: 'draft', label: 'สร้างใบสั่งซื้อ', sub: 'ร่างรายการ' },
    { key: 'pending', label: 'รออนุมัติ', sub: 'ส่งให้ผู้มีอำนาจ' },
    { key: 'approved', label: 'อนุมัติจ่าย', sub: 'พร้อมชำระเงิน' },
    { key: 'paid', label: 'ชำระเสร็จ', sub: 'แนบสลิปโอน' }
  ];
  return (
    <div className="po-stepper">
      {steps.map((st, idx) => {
        const stOrder = PO_STATUS[st.key].order;
        const curOrder = cur ? cur.order : 0;
        const done = !isRejected && stOrder < curOrder;
        const active = !isRejected && stOrder === curOrder;
        const cls = done ? 'done' : active ? 'active' : '';
        return (
          <div key={st.key} className={`po-step ${cls}`}>
            <div className="po-step-dot">
              {done ? <Icon name="check" size={12}/> : <span>{idx + 1}</span>}
            </div>
            <div className="po-step-body">
              <div className="po-step-label">{st.label}</div>
              <div className="po-step-sub">{st.sub}</div>
            </div>
            {idx < steps.length - 1 ? <div className={`po-step-line ${done ? 'done' : ''}`}></div> : null}
          </div>
        );
      })}
      {isRejected ? (
        <div className="po-step rejected">
          <div className="po-step-dot"><Icon name="close" size={12}/></div>
          <div className="po-step-body">
            <div className="po-step-label">ถูกปฏิเสธ</div>
            <div className="po-step-sub">ย้อนกลับเป็นร่าง</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ============ PO EDITOR MODAL — create/edit PO with multiple line items ============ */
function POEditorModal({ project, initial, defaultKind, onClose, onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = !!initial;
  const [kind, setKind] = useState(initial ? initial.kind : (defaultKind || 'material'));
  const [date, setDate] = useState(initial ? initial.date : today);
  const [code, setCode] = useState(initial ? initial.code : ('PO-' + String(Date.now()).slice(-6)));
  const [vendor, setVendor] = useState(initial ? initial.vendor || '' : '');
  const [notes, setNotes] = useState(initial ? initial.description || '' : '');
  const [images, setImages] = useState(initial && Array.isArray(initial.images) ? initial.images.slice() : []);
  const [uploading, setUploading] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const handleImageSelect = (fileList) => {
    const remaining = 10 - images.length;
    if (remaining <= 0) { alert('แนบรูปได้สูงสุด 10 รูป'); return; }
    const files = Array.from(fileList).slice(0, remaining)
      .filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const isLive = window.db && window.db.isReady();
    if (!isLive) {
      // Demo mode: store as data URL
      Promise.all(files.map(f => new Promise(resolve => {
        const r = new FileReader();
        r.onload = () => resolve({ url: r.result, name: f.name, size: f.size, mime: f.type });
        r.readAsDataURL(f);
      }))).then(arr => setImages(imgs => [...imgs, ...arr]));
      return;
    }
    setUploading(true);
    Promise.all(files.map(f => {
      const path = (project.id || 'demo') + '/' + genId() + '-' + f.name.replace(/[^\w.-]/g, '_');
      return window.db.files.uploadFile('po-images', path, f)
        .then(url => ({ url: url, name: f.name, size: f.size, mime: f.type }));
    })).then(arr => {
      setImages(imgs => [...imgs, ...arr]);
      setUploading(false);
    }).catch(err => {
      alert('อัปโหลดรูปไม่สำเร็จ: ' + (err.message || err));
      setUploading(false);
    });
  };

  const removeImage = (idx) => setImages(imgs => imgs.filter((_, i) => i !== idx));
  const [vat, setVat] = useState(initial ? !!initial.vat : false);
  const [vatIncluded, setVatIncluded] = useState(initial ? !!initial.vatIncluded : false);
  const [wht, setWht] = useState(initial ? initial.withholding || 0 : 0);
  const [taxInvoiceUrl, setTaxInvoiceUrl] = useState(initial ? (initial.taxInvoiceUrl || '') : '');
  const [items, setItems] = useState(() => {
    if (initial) return getPOItems(initial).map(it => ({ ...it }));
    return [{ id: genId(), category: (project.categories[defaultKind || 'material'] || [])[0] || '', description: '', qty: 1, unit: 'ชิ้น', unitPrice: 0, amount: 0 }];
  });

  // Material/Machine: เงินประกันสินค้า/เครื่องจักร
  const [deposit, setDeposit] = useState(initial && initial.deposit ? { ...initial.deposit } : { amount: 0, note: '', status: 'pending' });
  // Labor/Subcontract: หักประกันผลงาน + หักเบิกล่วงหน้า
  const [retentionAmount, setRetentionAmount] = useState(initial ? (initial.retentionAmount || 0) : 0);
  const [advanceDeduct, setAdvanceDeduct] = useState(initial ? (initial.advanceDeduct || 0) : 0);
  const [showHistory, setShowHistory] = useState(false);

  const isMaterialOrMachine = kind === 'material' || kind === 'machine';
  const isLaborOrSub = kind === 'labor' || kind === 'subcontract';
  // ใหม่: ใช้ workflow PO + อนุมัติเฉพาะแรงงาน/รับเหมาช่วง ส่วนอื่นบันทึกเป็นรายจ่ายตรง
  const needsApproval = isLaborOrSub;

  // when kind changes, validate item categories + reset kind-specific fields
  useEffect(() => {
    const list = project.categories[kind] || [];
    setItems(its => its.map(it => list.includes(it.category) ? it : { ...it, category: list[0] || '' }));
    if (!isMaterialOrMachine) setDeposit({ amount: 0, note: '', status: 'pending' });
    if (!isLaborOrSub) { setRetentionAmount(0); setAdvanceDeduct(0); }
  }, [kind]);

  // Vendor history (สำหรับ labor/subcontract)
  const vendorHistory = useMemo(() => {
    if (!isLaborOrSub) return [];
    return getVendorHistory(project, kind, vendor, isEdit ? initial.id : null);
  }, [project, kind, vendor, isLaborOrSub, isEdit, initial]);

  const updItem = (id, field, raw) => {
    setItems(its => its.map(it => {
      if (it.id !== id) return it;
      let v = raw;
      if (field === 'qty' || field === 'unitPrice') {
        v = parseFloat(String(raw).replace(/,/g, '')) || 0;
      }
      const next = { ...it, [field]: v };
      next.amount = (next.qty || 0) * (next.unitPrice || 0);
      return next;
    }));
  };

  const addItem = () => {
    const list = project.categories[kind] || [];
    setItems(its => [...its, { id: genId(), category: list[0] || '', description: '', qty: 1, unit: 'ชิ้น', unitPrice: 0, amount: 0 }]);
  };
  const removeItem = (id) => setItems(its => its.length > 1 ? its.filter(it => it.id !== id) : its);

  const itemsTotal = items.reduce((s, it) => s + (it.amount || 0), 0);
  // VAT calculation: vatIncluded → ราคารวม VAT แล้ว, แยก VAT ออก  /  !vatIncluded → ราคาไม่รวม VAT, คำนวณ VAT เพิ่ม
  let subtotal, vatAmt;
  if (vat) {
    if (vatIncluded) {
      vatAmt   = itemsTotal * 7 / 107;
      subtotal = itemsTotal - vatAmt;
    } else {
      subtotal = itemsTotal;
      vatAmt   = itemsTotal * 0.07;
    }
  } else {
    subtotal = itemsTotal;
    vatAmt   = 0;
  }
  // หัก ณ ที่จ่ายคิดจาก subtotal (ฐานก่อน VAT)
  const whtAmt = wht > 0 ? subtotal * (wht / 100) : 0;
  const retAmt = isLaborOrSub ? (parseFloat(String(retentionAmount).replace(/,/g,'')) || 0) : 0;
  const advAmt = isLaborOrSub ? (parseFloat(String(advanceDeduct).replace(/,/g,'')) || 0) : 0;
  const depositAmt = isMaterialOrMachine ? (parseFloat(String(deposit.amount).replace(/,/g,'')) || 0) : 0;
  const grandTotal = subtotal + vatAmt - whtAmt - retAmt - advAmt;

  const valid = items.length > 0 && items.every(it => it.category && it.description.trim() && it.qty > 0 && it.unitPrice > 0) && vendor.trim();

  const buildPO = (status) => ({
    id: initial ? initial.id : genId(),
    kind,
    code,
    date,
    vendor: vendor.trim(),
    description: notes.trim() || items[0].description, // legacy field for compatibility
    category: items[0].category, // legacy field
    items: items.map(it => ({
      id: it.id,
      category: it.category,
      description: it.description.trim(),
      qty: Number(it.qty),
      unit: it.unit || 'ชิ้น',
      unitPrice: Number(it.unitPrice),
      amount: Number(it.amount)
    })),
    amount: grandTotal,
    subtotal,
    vat, vatIncluded, vatAmount: vatAmt,
    withholding: wht, whtAmount: whtAmt,
    taxInvoiceUrl: taxInvoiceUrl.trim(),
    // labor/subcontract
    retentionAmount: retAmt,
    advanceDeduct: advAmt,
    // material/machine
    deposit: isMaterialOrMachine && depositAmt > 0 ? {
      amount: depositAmt,
      note: deposit.note || '',
      status: (initial && initial.deposit) ? initial.deposit.status : 'pending',
      returnedDate: (initial && initial.deposit) ? initial.deposit.returnedDate : null,
      returnSlip: (initial && initial.deposit) ? initial.deposit.returnSlip : null
    } : null,
    status,
    createdBy: initial ? (initial.createdBy || CURRENT_USER.name) : CURRENT_USER.name,
    createdAt: initial ? (initial.createdAt || today) : today,
    approvedBy: initial ? initial.approvedBy : null,
    approvedAt: initial ? initial.approvedAt : null,
    paidAt: initial ? initial.paidAt : null,
    paymentSlip: initial ? initial.paymentSlip : null,
    rejectReason: initial ? initial.rejectReason : null,
    notes: notes.trim(),
    images: images
  });

  const saveDraft = () => onSubmit(buildPO(initial ? initial.status : 'draft'));
  const submitForApproval = () => onSubmit(buildPO('pending'));
  const saveAsPaid = () => onSubmit(buildPO('paid'));

  const titlePrefix = needsApproval
    ? (isEdit ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อใหม่')
    : (isEdit ? 'แก้ไขรายจ่าย' : 'บันทึกรายจ่ายใหม่');

  return (
    <Modal open={true} onClose={onClose}
      title={titlePrefix + ' · ' + KINDS[kind].label}
      wide
      footer={<>
        <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
        {needsApproval ? (
          <>
            {!isEdit || initial.status === 'draft' || initial.status === 'rejected' ? (
              <button className="btn" disabled={!valid} onClick={saveDraft}>
                <Icon name="document" size={14}/> บันทึกเป็นร่าง
              </button>
            ) : null}
            <button className="btn primary" disabled={!valid} onClick={submitForApproval}>
              <Icon name="send" size={14}/> {isEdit && initial.status !== 'draft' && initial.status !== 'rejected' ? 'บันทึก' : 'ส่งขออนุมัติ'}
            </button>
          </>
        ) : (
          <button className="btn primary" disabled={!valid} onClick={saveAsPaid}>
            <Icon name="check" size={14}/> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกรายจ่าย'}
          </button>
        )}
      </>}>

      {/* PO header */}
      <div className="po-head-grid mb-16">
        <div className="field">
          <label>ประเภทรายจ่าย <span className="req">*</span></label>
          <div className="kind-chips">
            {window.EXPENSE_KINDS.map(x => (
              <button key={x} className={`chip ${kind === x ? 'on' : ''}`} onClick={() => setKind(x)} type="button">
                <KindIcon kind={x} size={13}/> {KINDS[x].short}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>วันที่</label>
          <input className="input-base" type="date" value={date} onChange={e => setDate(e.target.value)}/>
        </div>
        <div className="field">
          <label>เลขที่ใบสั่งซื้อ</label>
          <input className="input-base mono" value={code} onChange={e => setCode(e.target.value)}/>
        </div>
        <div className="field full">
          <label>คู่ค้า / ผู้รับเงิน <span className="req">*</span> {isLaborOrSub && vendorHistory.length > 0 ? <Badge tone="info">มีประวัติ {vendorHistory.length} รายการ</Badge> : null}</label>
          <input className="input-base" placeholder="ชื่อร้าน / ผู้รับเหมา / ทีมงาน" value={vendor} onChange={e => setVendor(e.target.value)}/>
        </div>
      </div>

      {/* Vendor withdrawal history (labor/subcontract) */}
      {isLaborOrSub && vendor.trim() && vendorHistory.length > 0 ? (
        <div className="vendor-history mb-16">
          <button type="button" className="vendor-history-toggle" onClick={() => setShowHistory(v => !v)}>
            <Icon name="document" size={14}/>
            <span>ประวัติการเบิกของ <strong>{vendor.trim()}</strong> ในหมวด {KINDS[kind].short}</span>
            <Badge>{vendorHistory.length} รายการ</Badge>
            <span className="dim vh-stats">
              สะสมจ่ายแล้ว <strong className="mono">{formatBaht(vendorHistory.filter(t => getStatus(t) === 'paid').reduce((s,t)=>s+t.amount,0))}</strong> บ.
              {vendorHistory.some(t => t.advanceDeduct > 0) ? <> · เคยหักเบิกล่วงหน้า <strong className="mono">{formatBaht(vendorHistory.reduce((s,t)=>s+(t.advanceDeduct||0),0))}</strong> บ.</> : null}
            </span>
            <Icon name="chevron-down" size={14} style={{transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s'}}/>
          </button>
          {showHistory ? (
            <div className="vendor-history-body">
              <div className="table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th style={{width:'90px'}}>วันที่</th>
                      <th style={{width:'120px'}}>เลขที่</th>
                      <th>รายการ</th>
                      <th className="num">หักผลงาน</th>
                      <th className="num">หักเบิก</th>
                      <th className="num">ยอดสุทธิ</th>
                      <th style={{width:'90px'}}>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorHistory.slice(0, 6).map(po => {
                      const its = getPOItems(po);
                      return (
                        <tr key={po.id}>
                          <td className="date">{formatDate(po.date)}</td>
                          <td className="mono" style={{fontSize:'12px'}}>{po.code}</td>
                          <td className="desc"><span className="muted">{its[0]?.description}{its.length > 1 ? ` +${its.length-1}` : ''}</span></td>
                          <td className="num">{po.retentionAmount > 0 ? <span className="dim">−{formatBaht(po.retentionAmount)}</span> : '—'}</td>
                          <td className="num">{po.advanceDeduct > 0 ? <span className="dim">−{formatBaht(po.advanceDeduct)}</span> : '—'}</td>
                          <td className="num">{formatBaht(po.amount)}</td>
                          <td><POStatusBadge status={getStatus(po)}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {vendorHistory.length > 6 ? <div className="dim" style={{textAlign:'center', padding:'8px', fontSize:'12px'}}>และอีก {vendorHistory.length - 6} รายการก่อนหน้า...</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Items table */}
      <div className="po-items-section">
        <div className="between mb-12">
          <div>
            <div className="uppercase muted">รายการสินค้า/งาน</div>
            <div style={{fontSize:'13.5px', color:'var(--text-2)', marginTop:'2px'}}>แยกตามหมวดหมู่งาน ระบุปริมาณและราคาให้ชัดเจน</div>
          </div>
          <button className="btn sm primary" onClick={addItem} type="button">
            <Icon name="plus" size={13}/> เพิ่มรายการ
          </button>
        </div>

        <datalist id="unit-options">
          <option value="ชิ้น"/><option value="ถุง"/><option value="ตัน"/><option value="คิว"/>
          <option value="ก้อน"/><option value="แผ่น"/><option value="เมตร"/><option value="ตร.ม."/>
          <option value="งาน"/><option value="วัน"/><option value="เดือน"/><option value="คน"/>
          <option value="ชุด"/><option value="กล่อง"/><option value="ลิตร"/><option value="ถัง"/>
        </datalist>

        <div className="po-items-list">
          {items.map((it, idx) => (
            <div key={it.id} className="po-item-card">
              <div className="po-item-card-num">{idx + 1}</div>
              <div className="po-item-card-body">
                <div className="po-item-row-top">
                  <div className="field" style={{flex:'0 0 200px'}}>
                    <label>หมวดหมู่งาน <span className="req">*</span></label>
                    <select className="input-base" value={it.category} onChange={e => updItem(it.id, 'category', e.target.value)}>
                      {(project.categories[kind] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="field" style={{flex:1, minWidth:0}}>
                    <label>รายละเอียดสินค้า/งาน <span className="req">*</span></label>
                    <input className="input-base" placeholder="ระบุชื่อสินค้า/ยี่ห้อ/รุ่น เช่น ปูน TPI สีแดง 50กก., เหล็กข้ออ้อย DB12 SR24"
                      value={it.description} onChange={e => updItem(it.id, 'description', e.target.value)}/>
                  </div>
                  <button className="icon-btn danger" onClick={() => removeItem(it.id)} disabled={items.length === 1} title="ลบรายการ" type="button" style={{alignSelf:'flex-end', marginBottom:'2px'}}>
                    <Icon name="trash" size={14}/>
                  </button>
                </div>
                <div className="po-item-row-bot">
                  <div className="field" style={{flex:'0 0 110px'}}>
                    <label>จำนวน</label>
                    <input className="input-base num-input" inputMode="decimal" placeholder="1"
                      value={it.qty} onChange={e => updItem(it.id, 'qty', e.target.value)} style={{textAlign:'right'}}/>
                  </div>
                  <div className="field" style={{flex:'0 0 110px'}}>
                    <label>หน่วย</label>
                    <input className="input-base" placeholder="ชิ้น"
                      value={it.unit} onChange={e => updItem(it.id, 'unit', e.target.value)} list="unit-options"/>
                  </div>
                  <div className="field" style={{flex:'0 0 150px'}}>
                    <label>ราคา/หน่วย (บ.)</label>
                    <input className="input-base num-input" inputMode="decimal" placeholder="0"
                      value={it.unitPrice} onChange={e => updItem(it.id, 'unitPrice', e.target.value)} style={{textAlign:'right'}}/>
                  </div>
                  <div className="field" style={{flex:1, minWidth:'120px'}}>
                    <label>ยอดรวม</label>
                    <div className="po-item-amount-display">{formatBaht(it.amount)} <span className="dim" style={{fontSize:'12px'}}>บ.</span></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax row */}
      <div className="field mt-16">
        <label>ภาษีและการหัก ณ ที่จ่าย</label>
        <div className="tax-row">
          <label>
            <input type="checkbox" checked={vat} onChange={e => setVat(e.target.checked)}/>
            ใบกำกับภาษี (VAT 7%)
          </label>
          {vat ? (
            <>
              <span className="dim">|</span>
              <label style={{gap:'6px'}}>
                <select className="input-base" value={vatIncluded ? 'inc' : 'exc'}
                  onChange={e => setVatIncluded(e.target.value === 'inc')}
                  style={{padding:'4px 8px', width:'auto'}}>
                  <option value="exc">ยอดยังไม่รวม VAT</option>
                  <option value="inc">ยอดรวม VAT แล้ว</option>
                </select>
              </label>
            </>
          ) : null}
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

      {/* Tax invoice external link */}
      <div className="field mt-12">
        <label>ลิงก์ใบกำกับภาษี (ไฟล์ภายนอก — ถ้ามี)</label>
        <input className="input-base" type="url" placeholder="https://drive.google.com/... หรือ URL อื่นๆ"
          value={taxInvoiceUrl} onChange={e => setTaxInvoiceUrl(e.target.value)}/>
        <span className="hint">วาง URL ของไฟล์ใบกำกับภาษีจาก Google Drive, OneDrive หรือระบบอื่นๆ</span>
      </div>

      {/* Material/Machine: เงินประกัน */}
      {isMaterialOrMachine ? (
        <div className="special-section mt-16">
          <div className="row gap-8 mb-8">
            <div className="ic-tag info"><Icon name="shield-check" size={16}/></div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:'13.5px', fontWeight:600}}>เงินประกัน{kind === 'material' ? 'สินค้า' : 'เครื่องจักร'} (ถ้ามี)</div>
              <div className="dim" style={{fontSize:'12px'}}>เงินประกันจะบันทึกเป็น <strong style={{color:'var(--info)'}}>"เงินค้างรับ"</strong> ของโครงการ — ไม่นับเป็นรายจ่าย และเมื่อได้คืนจะไม่ถูกนับเป็นรายรับ</div>
            </div>
          </div>
          <div className="deposit-grid">
            <div className="field">
              <label>จำนวนเงินประกัน</label>
              <div className="with-suffix">
                <input className="input-base num-input" inputMode="decimal" placeholder="0"
                  value={deposit.amount || ''}
                  onChange={e => setDeposit({...deposit, amount: e.target.value.replace(/[^\d.,]/g,'')})}
                  style={{textAlign:'right'}}/>
                <span className="suffix">บาท</span>
              </div>
            </div>
            <div className="field">
              <label>หมายเหตุ / เงื่อนไขรับคืน</label>
              <input className="input-base" placeholder="เช่น คืนเมื่อส่งคืนเครื่องจักรสภาพปกติ, รับคืนภายใน 7 วันหลังเลิกเช่า"
                value={deposit.note || ''} onChange={e => setDeposit({...deposit, note: e.target.value})}/>
            </div>
          </div>
        </div>
      ) : null}

      {/* Labor/Subcontract: หักเงินประกันผลงาน + เบิกล่วงหน้า */}
      {isLaborOrSub ? (
        <div className="special-section mt-16">
          <div className="row gap-8 mb-8">
            <div className="ic-tag purple"><Icon name="wallet" size={16}/></div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:'13.5px', fontWeight:600}}>การหักเงินจากใบเบิกนี้</div>
              <div className="dim" style={{fontSize:'12px'}}>เงินที่หักจะลดยอดสุทธิที่จ่ายช่าง — ดูประวัติเบิกของช่างชุดนี้ในกล่องด้านบนเพื่อพิจารณา</div>
            </div>
          </div>
          <div className="deposit-grid">
            <div className="field">
              <label>หักเงินประกันผลงาน <span className="dim sublabel">(เก็บไว้คืนช่างหลังหมดประกัน)</span></label>
              <div className="with-suffix">
                <input className="input-base num-input" inputMode="decimal" placeholder="0"
                  value={retentionAmount || ''}
                  onChange={e => setRetentionAmount(e.target.value.replace(/[^\d.,]/g,''))}
                  style={{textAlign:'right'}}/>
                <span className="suffix">บาท</span>
              </div>
              {subtotal > 0 && retAmt > 0 ? <span className="hint">≈ {(retAmt / subtotal * 100).toFixed(1)}% ของยอดงาน</span> : null}
            </div>
            <div className="field">
              <label>หักเงินเบิกล่วงหน้า <span className="dim sublabel">(หักจากเงินที่เคยให้ช่างไปก่อน)</span></label>
              <div className="with-suffix">
                <input className="input-base num-input" inputMode="decimal" placeholder="0"
                  value={advanceDeduct || ''}
                  onChange={e => setAdvanceDeduct(e.target.value.replace(/[^\d.,]/g,''))}
                  style={{textAlign:'right'}}/>
                <span className="suffix">บาท</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Notes */}
      <div className="field mt-16">
        <label>หมายเหตุ / เงื่อนไขการชำระ</label>
        <textarea className="input-base" placeholder="เช่น ชำระ 30 วันนับจากวันส่งของ, รวมค่าขนส่งแล้ว"
          value={notes} onChange={e => setNotes(e.target.value)}/>
      </div>

      {/* Image attachments */}
      <div className="field mt-16">
        <label>
          แนบรูปภาพ <span className="dim" style={{fontWeight:400}}>(สูงสุด 10 รูป — ใบเสนอราคา, ใบเสร็จ, รูปงาน ฯลฯ)</span>
          <span style={{marginLeft:'auto', float:'right'}} className="dim">{images.length}/10</span>
        </label>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(96px, 1fr))', gap:'8px', marginTop:'4px'}}>
          {images.map((img, i) => (
            <div key={i} style={{position:'relative', aspectRatio:'1/1', borderRadius:'var(--r-sm)', overflow:'hidden', background:'var(--bg-2)', border:'1px solid var(--border)'}}>
              <img src={img.url} alt={img.name} onClick={() => setPreviewImg(img)}
                style={{width:'100%', height:'100%', objectFit:'cover', cursor:'zoom-in'}}/>
              <button type="button" onClick={() => removeImage(i)}
                style={{position:'absolute', top:'4px', right:'4px', background:'rgba(0,0,0,.7)', border:'none', color:'#fff', width:'22px', height:'22px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}
                title="ลบรูปนี้">
                <Icon name="close" size={11}/>
              </button>
            </div>
          ))}
          {images.length < 10 ? (
            <label style={{
              aspectRatio:'1/1', borderRadius:'var(--r-sm)', border:'1.5px dashed var(--border-strong)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              cursor: uploading ? 'wait' : 'pointer', gap:'6px', color:'var(--text-3)',
              background: uploading ? 'var(--bg-2)' : 'transparent'
            }}>
              <Icon name={uploading ? 'clock' : 'plus'} size={18}/>
              <span style={{fontSize:'11px'}}>{uploading ? 'กำลังอัปโหลด...' : 'เพิ่มรูป'}</span>
              <input type="file" accept="image/*" multiple disabled={uploading}
                onChange={e => { handleImageSelect(e.target.files); e.target.value = ''; }}
                style={{display:'none'}}/>
            </label>
          ) : null}
        </div>
      </div>

      {/* Lightbox preview */}
      {previewImg ? (
        <div onClick={() => setPreviewImg(null)}
          style={{position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', cursor:'zoom-out'}}>
          <img src={previewImg.url} alt={previewImg.name}
            style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:'8px'}}/>
        </div>
      ) : null}

      {/* Total summary */}
      <div className="calc-box mt-16" style={{padding:'16px'}}>
        <div className="row" style={{justifyContent:'space-between', gap:0}}>
          <span className="muted">ยอดรวมสินค้า ({items.length} รายการ)</span>
          <span className="v mono">{formatBaht(subtotal)} บ.</span>
        </div>
        {vat ? (
          <div className="row" style={{justifyContent:'space-between', gap:0}}>
            <span className="muted">+ VAT 7%</span>
            <span className="v mono">{formatBaht(vatAmt)} บ.</span>
          </div>
        ) : null}
        {wht > 0 ? (
          <div className="row" style={{justifyContent:'space-between', gap:0}}>
            <span className="muted">− หัก ณ ที่จ่าย {wht}%</span>
            <span className="v mono">−{formatBaht(whtAmt)} บ.</span>
          </div>
        ) : null}
        {retAmt > 0 ? (
          <div className="row" style={{justifyContent:'space-between', gap:0}}>
            <span className="muted">− หักเงินประกันผลงาน</span>
            <span className="v mono">−{formatBaht(retAmt)} บ.</span>
          </div>
        ) : null}
        {advAmt > 0 ? (
          <div className="row" style={{justifyContent:'space-between', gap:0}}>
            <span className="muted">− หักเงินเบิกล่วงหน้า</span>
            <span className="v mono">−{formatBaht(advAmt)} บ.</span>
          </div>
        ) : null}
        <div className="row total" style={{justifyContent:'space-between', borderTop:'1px solid var(--border-strong)', paddingTop:'10px', marginTop:'6px', fontSize:'14px'}}>
          <span style={{fontWeight:600}}>ยอดสุทธิที่ต้องชำระ (ค่าใช้จ่าย)</span>
          <span className="v mono pos" style={{fontSize:'18px', fontWeight:600}}>{formatBaht(grandTotal)} บาท</span>
        </div>
        {depositAmt > 0 ? (<>
          <div className="row" style={{justifyContent:'space-between', gap:0, paddingTop:'8px', marginTop:'4px', borderTop:'1px dashed var(--border)'}}>
            <span style={{color:'var(--info)', display:'flex', alignItems:'center', gap:'6px'}}>
              <Icon name="shield-check" size={12}/> + เงินประกัน{kind === 'material' ? 'สินค้า' : 'เครื่องจักร'} (จ่ายแต่ได้คืน — เงินค้างรับ)
            </span>
            <span className="v mono" style={{color:'var(--info)'}}>+{formatBaht(depositAmt)} บ.</span>
          </div>
          <div className="row" style={{justifyContent:'space-between', gap:0, paddingTop:'8px', marginTop:'4px', borderTop:'1px solid var(--border-strong)', fontSize:'13px'}}>
            <span className="dim">ยอดเงินสดที่ต้องเตรียมจ่ายจริง</span>
            <span className="v mono dim">{formatBaht(grandTotal + depositAmt)} บ.</span>
          </div>
        </>) : null}
      </div>
    </Modal>
  );
}

/* ============ PO DETAIL MODAL — view + workflow actions ============ */
function PODetailModal({ project, po, onClose, onEdit, onAction, onDelete }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [slipName, setSlipName] = useState(po.paymentSlip || null);
  const [returnSlip, setReturnSlip] = useState(po.deposit?.returnSlip || null);
  const [showReturnUI, setShowReturnUI] = useState(false);
  const [docKind, setDocKind] = useState(null); // '50tawi' | 'receipt' | 'payment'
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const docMenuRef = useRef(null);
  const poImages = Array.isArray(po.images) ? po.images : [];

  useEffect(() => {
    if (!showDocMenu) return;
    const close = (e) => { if (docMenuRef.current && !docMenuRef.current.contains(e.target)) setShowDocMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showDocMenu]);

  const canPrintDocs = (po.kind === 'labor' || po.kind === 'subcontract' || po.kind === 'machine' || po.kind === 'material') && (getStatus(po) === 'paid' || getStatus(po) === 'approved');

  // Handler: if a linked file is set for this kind, open it; else show internal editable preview
  const onPickDoc = (kind) => {
    setShowDocMenu(false);
    if (window.openLinkedDoc && window.openLinkedDoc(kind)) {
      // External file opened in new tab — no preview modal needed
      return;
    }
    setDocKind(kind);
  };

  const status = getStatus(po);
  const items = getPOItems(po);
  const meta = PO_STATUS[status];

  const doApprove = () => onAction({ ...po, status: 'approved', approvedBy: CURRENT_USER.name, approvedAt: new Date().toISOString().slice(0,10) });
  const doReject = () => {
    onAction({ ...po, status: 'rejected', rejectReason: rejectReason || 'ขอข้อมูลเพิ่มเติม' });
    setShowRejectInput(false);
    setRejectReason('');
  };
  const doSubmit = () => onAction({ ...po, status: 'pending' });
  const doMarkPaid = () => {
    if (!slipName) return;
    onAction({
      ...po, status: 'paid',
      paymentSlip: slipName,
      paidAt: new Date().toISOString().slice(0,10),
      paidBy: CURRENT_USER.name
    });
  };
  const doRevert = () => onAction({ ...po, status: 'draft', rejectReason: null });

  const doReturnDeposit = () => {
    if (!returnSlip) return;
    onAction({
      ...po,
      deposit: {
        ...po.deposit,
        status: 'returned',
        returnedDate: new Date().toISOString().slice(0,10),
        returnSlip
      }
    });
    setShowReturnUI(false);
  };

  const showApprove = status === 'pending' && CURRENT_USER.canApprove;
  const showSubmit = status === 'draft' || status === 'rejected';
  const showPayment = status === 'approved';
  const editable = status === 'draft' || status === 'rejected' || status === 'pending';
  const deletable = status === 'draft' || status === 'rejected' || status === 'pending';
  const isLaborOrSub = po.kind === 'labor' || po.kind === 'subcontract';
  const vendorHistory = useMemo(() => {
    if (!isLaborOrSub || !po.vendor) return [];
    return getVendorHistory(project, po.kind, po.vendor, po.id);
  }, [project, po.kind, po.vendor, po.id, isLaborOrSub]);

  return (
    <Modal open={true} onClose={onClose} wide
      title={
        <span className="row gap-12" style={{fontSize:'15px'}}>
          <KindIcon kind={po.kind} size={16}/>
          ใบสั่งซื้อ <span className="mono dim">{po.code}</span>
          <POStatusBadge status={status} large/>
        </span>
      }
      footer={<>
        <button className="btn ghost" onClick={onClose}>ปิด</button>
        {canPrintDocs ? (
          <div ref={docMenuRef} style={{position:'relative'}}>
            <button className="btn" onClick={() => setShowDocMenu(v => !v)}>
              <Icon name="document" size={13}/> พิมพ์เอกสาร <Icon name="chevron-down" size={11}/>
            </button>
            {showDocMenu ? (
              <div className="doc-menu-popover">
                {[
                  { key: '50tawi',  icon: 'shield-check', title: 'ใบ 50 ทวิ',         sub: 'หนังสือรับรองหักภาษี ณ ที่จ่าย' },
                  { key: 'receipt', icon: 'receipt',      title: 'ใบสำคัญรับเงิน',     sub: 'Receipt Voucher — สำหรับผู้รับเซ็น' },
                  { key: 'payment', icon: 'wallet',       title: 'ใบสำคัญจ่ายเงิน',    sub: 'Payment Voucher — สำหรับเก็บไว้เป็นหลักฐาน' }
                ].map(d => {
                  const linked = window.getLinkedDocFile ? window.getLinkedDocFile(d.key) : null;
                  return (
                    <button key={d.key} className="doc-menu-item" onClick={() => onPickDoc(d.key)}>
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
                      <Icon name={linked ? 'arrow-right' : 'document'} size={11} style={{color:'var(--text-3)', marginLeft:'auto', alignSelf:'center'}}/>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
        <div style={{flex:1}}></div>
        {deletable ? <button className="btn danger" onClick={() => setConfirmAction('delete')}><Icon name="trash" size={13}/> ลบ</button> : null}
        {editable ? <button className="btn" onClick={() => onEdit(po)}><Icon name="edit" size={13}/> แก้ไข</button> : null}
        {showSubmit ? <button className="btn primary" onClick={doSubmit}><Icon name="send" size={13}/> ส่งขออนุมัติ</button> : null}
        {status === 'pending' ? <button className="btn danger" onClick={() => setShowRejectInput(true)}><Icon name="close" size={13}/> ปฏิเสธ</button> : null}
        {showApprove ? <button className="btn primary" onClick={doApprove}><Icon name="shield-check" size={14}/> อนุมัติจ่าย</button> : null}
        {showPayment && slipName ? <button className="btn primary" onClick={doMarkPaid}><Icon name="check" size={14}/> ยืนยันชำระเงิน</button> : null}
      </>}>

      {/* Status stepper */}
      <div className="card tight mb-16" style={{padding:'18px 20px'}}>
        <POStepper status={status}/>
        {po.rejectReason ? (
          <Alert tone="danger" icon="warn">
            <strong>ถูกปฏิเสธ:</strong> {po.rejectReason}
            <p>คุณสามารถแก้ไขรายการแล้วส่งขออนุมัติใหม่ได้</p>
          </Alert>
        ) : null}
      </div>

      {/* Vendor history (labor/subcontract) — shown at all statuses for approver context */}
      {isLaborOrSub && vendorHistory.length > 0 ? (
        <div className="vendor-history mb-16">
          <div className="vendor-history-toggle" style={{cursor:'default'}}>
            <Icon name="clock" size={14}/>
            <span>ประวัติการเบิกของ <strong>{po.vendor}</strong> ในหมวด {KINDS[po.kind].short}</span>
            <Badge>{vendorHistory.length} รายการ</Badge>
            <span className="dim" style={{marginLeft:'auto', fontSize:'12px'}}>
              สะสมจ่ายแล้ว <strong className="mono">{formatBaht(vendorHistory.filter(t => getStatus(t) === 'paid').reduce((s,t)=>s+t.amount,0))}</strong> บ.
              {vendorHistory.some(t => t.advanceDeduct > 0) ? <> · เคยหักเบิกล่วงหน้า <strong className="mono">{formatBaht(vendorHistory.reduce((s,t)=>s+(t.advanceDeduct||0),0))}</strong> บ.</> : null}
            </span>
          </div>
          <div className="vendor-history-body">
            <div className="table-scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th style={{width:'90px'}}>วันที่</th>
                    <th style={{width:'120px'}}>เลขที่</th>
                    <th>รายการ</th>
                    <th className="num">หักผลงาน</th>
                    <th className="num">หักเบิก</th>
                    <th className="num">ยอดสุทธิ</th>
                    <th style={{width:'90px'}}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorHistory.slice(0, 6).map(p => {
                    const its = getPOItems(p);
                    return (
                      <tr key={p.id}>
                        <td className="date">{formatDate(p.date)}</td>
                        <td className="mono" style={{fontSize:'12px'}}>{p.code}</td>
                        <td className="desc"><span className="muted">{its[0]?.description}{its.length > 1 ? ` +${its.length-1}` : ''}</span></td>
                        <td className="num">{p.retentionAmount > 0 ? <span className="dim">−{formatBaht(p.retentionAmount)}</span> : '—'}</td>
                        <td className="num">{p.advanceDeduct > 0 ? <span className="dim">−{formatBaht(p.advanceDeduct)}</span> : '—'}</td>
                        <td className="num">{formatBaht(p.amount)}</td>
                        <td><POStatusBadge status={getStatus(p)}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {vendorHistory.length > 6 ? <div className="dim" style={{textAlign:'center', padding:'8px', fontSize:'12px'}}>และอีก {vendorHistory.length - 6} รายการก่อนหน้า...</div> : null}
          </div>
        </div>
      ) : null}

      {/* PO header */}
      <div className="po-summary-grid">
        <div>
          <div className="uppercase muted">ประเภท</div>
          <div className="row gap-8" style={{marginTop:'6px', fontSize:'14px', fontWeight:500}}>
            <KindIcon kind={po.kind} size={14}/> {KINDS[po.kind].label}
          </div>
        </div>
        <div>
          <div className="uppercase muted">วันที่</div>
          <div style={{marginTop:'6px', fontSize:'14px', fontWeight:500}} className="mono">{formatDateLong(po.date)}</div>
        </div>
        <div>
          <div className="uppercase muted">คู่ค้า / ผู้รับเงิน</div>
          <div style={{marginTop:'6px', fontSize:'14px', fontWeight:500}}>{po.vendor || '—'}</div>
        </div>
        <div>
          <div className="uppercase muted">ผู้สร้างใบสั่งซื้อ</div>
          <div style={{marginTop:'6px', fontSize:'14px', fontWeight:500}}>{po.createdBy || CURRENT_USER.name}</div>
        </div>
        {po.approvedBy ? (
          <div>
            <div className="uppercase muted">ผู้อนุมัติ</div>
            <div style={{marginTop:'6px', fontSize:'14px', fontWeight:500, color:'var(--info)'}}>
              <Icon name="shield-check" size={13}/> {po.approvedBy}
            </div>
            <div className="dim" style={{fontSize:'11.5px'}}>เมื่อ {formatDateLong(po.approvedAt)}</div>
          </div>
        ) : null}
        {po.paidAt ? (
          <div>
            <div className="uppercase muted">วันที่ชำระ</div>
            <div style={{marginTop:'6px', fontSize:'14px', fontWeight:500}} className="pos mono">
              <Icon name="check" size={13}/> {formatDateLong(po.paidAt)}
            </div>
          </div>
        ) : null}
      </div>

      {/* Items table */}
      <div className="mt-16 mb-16">
        <div className="uppercase muted mb-8">รายการสินค้า/งาน ({items.length} รายการ)</div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{width:'40px'}}>#</th>
                <th style={{width:'160px'}}>หมวดหมู่งาน</th>
                <th>รายละเอียด</th>
                <th className="num">จำนวน</th>
                <th>หน่วย</th>
                <th className="num">ราคา/หน่วย</th>
                <th className="num">รวม</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id}>
                  <td className="mono dim">{i + 1}</td>
                  <td><Badge>{it.category}</Badge></td>
                  <td className="desc"><div className="title">{it.description}</div></td>
                  <td className="num">{it.qty}</td>
                  <td className="muted">{it.unit}</td>
                  <td className="num">{formatBaht(it.unitPrice)}</td>
                  <td className="num"><strong>{formatBaht(it.amount)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="calc-box" style={{padding:'16px'}}>
        <div className="row" style={{justifyContent:'space-between', gap:0}}>
          <span className="muted">ยอดรวมสินค้า</span>
          <span className="v mono">{formatBaht(po.subtotal || items.reduce((s,it)=>s+it.amount,0))} บ.</span>
        </div>
        {po.vat ? (
          <div className="row" style={{justifyContent:'space-between', gap:0}}>
            <span className="muted">+ VAT 7%</span>
            <span className="v mono">{formatBaht(po.vatAmount || 0)} บ.</span>
          </div>
        ) : null}
        {po.withholding > 0 ? (
          <div className="row" style={{justifyContent:'space-between', gap:0}}>
            <span className="muted">− หัก ณ ที่จ่าย {po.withholding}%</span>
            <span className="v mono">−{formatBaht(po.whtAmount || 0)} บ.</span>
          </div>
        ) : null}
        {po.retentionAmount > 0 ? (
          <div className="row" style={{justifyContent:'space-between', gap:0}}>
            <span className="muted">− หักเงินประกันผลงาน</span>
            <span className="v mono">−{formatBaht(po.retentionAmount)} บ.</span>
          </div>
        ) : null}
        {po.advanceDeduct > 0 ? (
          <div className="row" style={{justifyContent:'space-between', gap:0}}>
            <span className="muted">− หักเงินเบิกล่วงหน้า</span>
            <span className="v mono">−{formatBaht(po.advanceDeduct)} บ.</span>
          </div>
        ) : null}
        <div className="row total" style={{justifyContent:'space-between', borderTop:'1px solid var(--border-strong)', paddingTop:'10px', marginTop:'6px', fontSize:'14px'}}>
          <span style={{fontWeight:600}}>ยอดสุทธิที่ต้องชำระ (ค่าใช้จ่าย)</span>
          <span className="v mono" style={{fontSize:'20px', fontWeight:600, color: status === 'paid' ? 'var(--brand-bright)' : 'var(--text-1)'}}>
            {formatBaht(po.amount)} บาท
          </span>
        </div>
      </div>

      {/* Deposit section (เงินประกัน / เงินค้างรับ) */}
      {po.deposit && po.deposit.amount > 0 ? (
        <div className="deposit-card mt-16">
          <div className="deposit-card-head">
            <div className="ic-tag info"><Icon name="shield-check" size={18}/></div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:'13.5px', fontWeight:600, display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'}}>
                เงินประกัน{po.kind === 'material' ? 'สินค้า' : 'เครื่องจักร'}
                {po.deposit.status === 'returned'
                  ? <Badge tone="brand" dot>ได้รับคืนแล้ว</Badge>
                  : <Badge tone="info" dot>เงินค้างรับ</Badge>
                }
              </div>
              {po.deposit.note ? <div className="dim" style={{fontSize:'12px', marginTop:'2px'}}>{po.deposit.note}</div> : null}
            </div>
            <div style={{textAlign:'right'}}>
              <div className="v mono" style={{fontSize:'18px', fontWeight:600, color: po.deposit.status === 'returned' ? 'var(--text-3)' : 'var(--info)', textDecoration: po.deposit.status === 'returned' ? 'line-through' : 'none'}}>
                {formatBaht(po.deposit.amount)} บ.
              </div>
              <div className="dim" style={{fontSize:'11px', marginTop:'2px'}}>
                {po.deposit.status === 'returned' ? `รับคืนเมื่อ ${formatDate(po.deposit.returnedDate)}` : 'ไม่นับเป็นรายจ่าย · รอรับคืน'}
              </div>
            </div>
          </div>

          {/* Action for paid + deposit pending */}
          {status === 'paid' && po.deposit.status !== 'returned' && !showReturnUI ? (
            <div className="row mt-8" style={{justifyContent:'flex-end'}}>
              <button className="btn primary sm" onClick={() => setShowReturnUI(true)}>
                <Icon name="download" size={13}/> บันทึกรับคืนเงินประกัน
              </button>
            </div>
          ) : null}

          {showReturnUI ? (
            <div className="mt-12" style={{padding:'12px', background:'var(--bg-2)', borderRadius:'var(--r)', border:'1px solid var(--border)'}}>
              <Alert tone="info" icon="info">
                <strong>แนบสลิปหลักฐานการรับคืนเงินประกัน</strong>
                <p>ระบบจะปิดรายการเงินค้างรับตัวนี้ เงินจะไม่ถูกบันทึกเป็นรายรับของโครงการ</p>
              </Alert>
              <div className="mt-8">
                <FileField value={returnSlip} onChange={setReturnSlip}/>
              </div>
              <div className="row mt-8" style={{justifyContent:'flex-end'}}>
                <button className="btn ghost sm" onClick={() => setShowReturnUI(false)}>ยกเลิก</button>
                <button className="btn primary sm" disabled={!returnSlip} onClick={doReturnDeposit}>
                  <Icon name="check" size={13}/> ยืนยันรับคืนแล้ว
                </button>
              </div>
            </div>
          ) : null}

          {/* Show return slip if returned */}
          {po.deposit.status === 'returned' && po.deposit.returnSlip ? (
            <div className="mt-8">
              <div className="uppercase muted mb-8" style={{fontSize:'10.5px'}}>หลักฐานการรับคืน</div>
              <span className="file-pill" style={{padding:'8px 12px"'}}>
                <Icon name="paperclip" size={13}/>
                <span style={{flex:1}}>{po.deposit.returnSlip}</span>
                <Icon name="check" size={13} style={{color:'var(--brand-bright)'}}/>
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Notes */}
      {po.notes ? (
        <div className="mt-16">
          <div className="uppercase muted mb-8">หมายเหตุ</div>
          <div style={{padding:'12px 14px', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:'13px'}}>
            {po.notes}
          </div>
        </div>
      ) : null}

      {/* Image attachments */}
      {poImages.length > 0 ? (
        <div className="mt-16">
          <div className="uppercase muted mb-8">รูปภาพแนบ <Badge>{poImages.length}</Badge></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:'8px'}}>
            {poImages.map((img, i) => (
              <div key={i} onClick={() => setPreviewImg(img)}
                style={{aspectRatio:'1/1', borderRadius:'var(--r-sm)', overflow:'hidden', background:'var(--bg-2)', border:'1px solid var(--border)', cursor:'zoom-in'}}>
                <img src={img.url} alt={img.name || ''} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {previewImg ? (
        <div onClick={() => setPreviewImg(null)}
          style={{position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', cursor:'zoom-out'}}>
          <img src={previewImg.url} alt={previewImg.name || ''} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:'8px'}}/>
        </div>
      ) : null}

      {/* Payment slip section */}
      {showPayment ? (
        <div className="mt-16">
          <Alert tone="info" icon="info">
            <strong>ขั้นตอนสุดท้าย — แนบสลิปการโอนเงิน</strong>
            <p>กรุณาแนบหลักฐานการชำระเงินก่อนกด "ยืนยันชำระเงิน" เพื่อสิ้นสุดขั้นตอน</p>
          </Alert>
          <div className="mt-8">
            <FileField value={slipName} onChange={setSlipName}/>
          </div>
        </div>
      ) : status === 'paid' && po.paymentSlip ? (
        <div className="mt-16">
          <div className="uppercase muted mb-8">หลักฐานการโอนเงิน</div>
          <span className="file-pill" style={{padding:'10px 14px'}}>
            <Icon name="paperclip" size={14}/>
            <span style={{flex:1}}>{po.paymentSlip}</span>
            <Icon name="check" size={14} style={{color:'var(--brand-bright)'}}/>
          </span>
        </div>
      ) : null}

      {/* Reject reason input */}
      {showRejectInput ? (
        <div className="mt-16">
          <div className="card tight" style={{background: 'var(--danger-soft)', borderColor: 'rgba(248,113,113,0.25)'}}>
            <div className="field">
              <label>เหตุผลที่ปฏิเสธ</label>
              <textarea className="input-base" autoFocus placeholder="เช่น ขอเอกสารใบเสนอราคาเพิ่ม, ราคาสูงกว่าตลาด"
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}/>
              <div className="row mt-8" style={{justifyContent:'flex-end', gap:'8px'}}>
                <button className="btn ghost sm" onClick={() => setShowRejectInput(false)}>ยกเลิก</button>
                <button className="btn danger sm" onClick={doReject}><Icon name="close" size={12}/> ยืนยันปฏิเสธ</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Confirm
        open={confirmAction === 'delete'}
        title="ยืนยันการลบใบสั่งซื้อ"
        message={`ลบใบสั่งซื้อ ${po.code} ออกจากระบบ การกระทำนี้ไม่สามารถย้อนกลับได้`}
        danger
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { onDelete(po.id); onClose(); }}
      />
      {docKind ? (
        <DocumentModal project={project} po={po} kind={docKind} onClose={() => setDocKind(null)}/>
      ) : null}
    </Modal>
  );
}

/* ============ PURCHASE ORDERS TAB — list view for expense kinds ============ */
function PurchaseOrdersTab({ kind, project, agg, onAdd, onOpen }) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const needsApproval = kind === 'labor' || kind === 'subcontract';

  const allKindPOs = useMemo(() =>
    project.transactions.filter(t => t.kind === kind),
    [project, kind]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return allKindPOs
      .filter(po => statusFilter === 'all' || getStatus(po) === statusFilter)
      .filter(po => {
        if (catFilter === 'all') return true;
        const items = getPOItems(po);
        return items.some(it => it.category === catFilter);
      })
      .filter(po => !from || po.date >= from)
      .filter(po => !to || po.date <= to)
      .filter(po => {
        if (!ql) return true;
        if ((po.code || '').toLowerCase().includes(ql)) return true;
        if ((po.vendor || '').toLowerCase().includes(ql)) return true;
        if ((po.description || '').toLowerCase().includes(ql)) return true;
        const items = getPOItems(po);
        return items.some(it => it.description.toLowerCase().includes(ql) || it.category.toLowerCase().includes(ql));
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allKindPOs, q, statusFilter, catFilter, from, to]);

  const counts = agg.statusCountByKind[kind] || { draft:0, pending:0, approved:0, paid:0, rejected:0 };
  const budget = project.budgets[kind] || 0;
  const paidAmt = agg.byKind[kind] || 0;
  const pendingAmt = agg.pendingByKind[kind] || 0;

  const onExport = () => {
    const rows = [['เลขที่ PO', 'วันที่', 'สถานะ', 'คู่ค้า', 'หมวดหมู่งาน', 'รายการ', 'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวมรายการ', 'ยอด PO รวม']];
    for (const po of filtered) {
      const items = getPOItems(po);
      const stLabel = PO_STATUS[getStatus(po)].label;
      items.forEach((it, idx) => {
        rows.push([
          idx === 0 ? po.code : '', idx === 0 ? po.date : '', idx === 0 ? stLabel : '',
          idx === 0 ? po.vendor : '',
          it.category, it.description, it.qty, it.unit, it.unitPrice, it.amount,
          idx === 0 ? po.amount : ''
        ]);
      });
    }
    downloadCSV(`${project.code}_${kind}_PO_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div>
      {/* Summary banner */}
      <div className="card tight mb-16">
        <div className="between" style={{flexWrap:'wrap', gap:'16px'}}>
          <div className="row gap-16" style={{flexWrap:'wrap'}}>
            <div className="value-with-icon">
              <div className="ic" style={{background: KINDS[kind].color + '20', color: KINDS[kind].color}}>
                <KindIcon kind={kind} size={20}/>
              </div>
              <div>
                <div className="uppercase muted">ใช้จริงแล้ว (จ่ายเสร็จ)</div>
                <div className="num pos" style={{fontSize:'22px', fontWeight:500, marginTop:'2px'}}>{formatBaht(paidAmt)} <span className="dim" style={{fontSize:'13px'}}>บ.</span></div>
              </div>
            </div>
            {pendingAmt > 0 ? (
              <>
                <div style={{height:'40px', width:'1px', background:'var(--border)'}}></div>
                <div>
                  <div className="uppercase muted">รอชำระ (ผูกแล้ว)</div>
                  <div className="num" style={{fontSize:'18px', fontWeight:500, marginTop:'2px', color:'var(--warn-bright)'}}>+{formatBaht(pendingAmt)} <span className="dim" style={{fontSize:'12px'}}>บ.</span></div>
                </div>
              </>
            ) : null}
            {budget > 0 ? (
              <>
                <div style={{height:'40px', width:'1px', background:'var(--border)'}}></div>
                <div>
                  <div className="uppercase muted">งบประมาณตั้งไว้</div>
                  <div className="num" style={{fontSize:'18px', fontWeight:500, marginTop:'2px'}}>{formatBaht(budget)} <span className="dim" style={{fontSize:'12px'}}>บ.</span></div>
                  <div style={{marginTop:'6px', width:'220px'}}>
                    <Bar value={paidAmt + pendingAmt} max={budget} tone="auto" thin/>
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <button className="btn primary" onClick={onAdd}>
            <Icon name="plus" size={14}/> {needsApproval ? 'สร้างใบสั่งซื้อใหม่' : 'บันทึกรายจ่ายใหม่'}
          </button>
        </div>
      </div>

      {/* Status filter chips — โชว์เฉพาะหมวดที่ต้องอนุมัติ */}
      {needsApproval ? (
        <div className="row mb-16" style={{gap:'6px', flexWrap:'wrap'}}>
          {[
            ['all', `ทั้งหมด (${allKindPOs.length})`],
            ['draft', `ร่าง (${counts.draft})`],
            ['pending', `รออนุมัติ (${counts.pending})`],
            ['approved', `อนุมัติแล้ว (${counts.approved})`],
            ['paid', `จ่ายแล้ว (${counts.paid})`],
            ['rejected', `ถูกปฏิเสธ (${counts.rejected})`]
          ].map(([key, label]) => (
            <button key={key}
              className={`chip ${statusFilter === key ? 'on' : ''}`}
              onClick={() => setStatusFilter(key)}>
              {key !== 'all' ? <span className="chip-dot" style={{background: PO_STATUS[key]?.color || 'var(--text-3)'}}></span> : null}
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Filter row */}
      <div className="filter-row">
        <div className="input-with-icon" style={{flex:1, maxWidth:'360px'}}>
          <Icon name="search" size={14}/>
          <input className="input-base" placeholder="ค้นหาเลข PO / คู่ค้า / รายการ..." value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <select className="input-base" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">หมวดหมู่ทั้งหมด</option>
          {(project.categories[kind] || []).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input-base" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{width:'auto'}}/>
        <span className="muted">—</span>
        <input className="input-base" type="date" value={to} onChange={e => setTo(e.target.value)} style={{width:'auto'}}/>
        <button className="btn ghost sm" onClick={onExport} title="ดาวน์โหลด CSV">
          <Icon name="download" size={14}/> CSV
        </button>
      </div>

      {/* PO list table */}
      <div className="table-wrap">
        {filtered.length === 0 ? (
          <Empty
            title={q || statusFilter !== 'all' || catFilter !== 'all' || from || to
              ? (needsApproval ? 'ไม่พบใบสั่งซื้อตามเงื่อนไข' : 'ไม่พบรายจ่ายตามเงื่อนไข')
              : (needsApproval ? `ยังไม่มีใบสั่งซื้อในหมวด ${KINDS[kind].short}` : `ยังไม่มีรายจ่ายในหมวด ${KINDS[kind].short}`)}
            hint={q || statusFilter !== 'all' || catFilter !== 'all' || from || to
              ? 'ลองล้างตัวกรองหรือปรับช่วงวันที่'
              : (needsApproval ? 'เริ่มสร้างใบสั่งซื้อใหม่เพื่อจัดการรายจ่ายอย่างเป็นระบบ' : 'บันทึกรายจ่ายเพื่อเริ่มต้นบัญชี')}
            action={!(q || statusFilter !== 'all' || catFilter !== 'all' || from || to)
              ? <button className="btn primary sm" onClick={onAdd}><Icon name="plus" size={14}/> {needsApproval ? 'สร้างใบสั่งซื้อแรก' : 'บันทึกรายจ่ายแรก'}</button>
              : null}
          />
        ) : (
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th style={{width:'110px'}}>วันที่</th>
                <th style={{width:'130px'}}>เลขที่ PO</th>
                <th>คู่ค้า / รายการ</th>
                <th style={{width:'60px'}} className="num">รายการ</th>
                <th className="num" style={{width:'140px'}}>ยอดสุทธิ</th>
                <th style={{width:'130px'}}>สถานะ</th>
                <th style={{width:'40px'}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => {
                const status = getStatus(po);
                const items = getPOItems(po);
                const firstCat = items[0]?.category;
                const multiCat = items.some(it => it.category !== firstCat);
                return (
                  <tr key={po.id} onClick={() => onOpen(po)} style={{cursor:'pointer'}}>
                    <td className="date">{formatDate(po.date)}</td>
                    <td className="mono" style={{fontSize:'12.5px', color:'var(--text-1)'}}>{po.code}</td>
                    <td className="desc">
                      <div className="title">{po.vendor || '—'}</div>
                      <div className="sub row gap-4" style={{marginTop:'3px'}}>
                        <Badge>{multiCat ? `${items.length} หมวด` : firstCat}</Badge>
                        <span style={{color:'var(--text-3)'}}>·</span>
                        <span style={{color:'var(--text-3)'}}>{items[0]?.description}{items.length > 1 ? ` +${items.length - 1} รายการ` : ''}</span>
                        {po.paymentSlip ? <Icon name="paperclip" size={11} className="attach-icon"/> : null}
                      </div>
                    </td>
                    <td className="num dim">{items.length}</td>
                    <td className="num"><strong>{formatBaht(po.amount)}</strong></td>
                    <td><POStatusBadge status={status}/></td>
                    <td className="dim"><Icon name="arrow-right" size={14}/></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="muted">รวม {filtered.length} ใบสั่งซื้อที่กรองอยู่</td>
                <td className="num"><strong>{formatBaht(filtered.reduce((s, po) => s + po.amount, 0))}</strong></td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  POEditorModal, PODetailModal, PurchaseOrdersTab, POStatusBadge, POStepper, CURRENT_USER, ROLES
});
