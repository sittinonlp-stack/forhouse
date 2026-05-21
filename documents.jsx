/* FOR HOUSE — Document templates (50ทวิ / ใบสำคัญรับ-จ่าย)
   - All fields editable before printing (contentEditable)
   - Customizable letterhead (org settings, logo upload, template style)
   ============================================================ */

/* ============ Number to Thai words (บาท ถ้วน) ============ */
function bahtText(num) {
  if (num == null || isNaN(num)) return '';
  num = Math.abs(Math.round(num * 100) / 100);
  const txt = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const unit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  function readGroup(n) {
    if (n === 0) return '';
    let s = '';
    const str = String(n);
    for (let i = 0; i < str.length; i++) {
      const d = +str[i];
      const pos = str.length - i - 1;
      if (d === 0) continue;
      if (pos === 0 && d === 1 && str.length > 1) s += 'เอ็ด';
      else if (pos === 1 && d === 2) s += 'ยี่';
      else if (pos === 1 && d === 1) s += '';
      else s += txt[d];
      s += unit[pos];
    }
    return s;
  }
  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);
  let out = '';
  if (baht >= 1e6) {
    const million = Math.floor(baht / 1e6);
    out += readGroup(million) + 'ล้าน';
    const rest = baht % 1e6;
    if (rest > 0) out += readGroup(rest);
  } else if (baht > 0) {
    out += readGroup(baht);
  } else {
    out += 'ศูนย์';
  }
  out += 'บาท';
  if (satang > 0) out += readGroup(satang) + 'สตางค์';
  else out += 'ถ้วน';
  return out;
}

/* ============ Default Org config (editable via Settings) ============ */
const DEFAULT_ORG = {
  name: 'บริษัท ฟอร์ เฮาส์ บิวดิ้ง จำกัด',
  taxId: '0-1055-12345-67-8',
  address: '99/123 ซ.บางพลีใหญ่ 5 ถ.บางนา-ตราด ต.บางพลีใหญ่ อ.บางพลี จ.สมุทรปราการ 10540',
  phone: '02-123-4567',
  email: 'info@forhouse.co.th',
  branch: 'สำนักงานใหญ่',
  logo: null, // data URL
  template: 'classic', // classic | modern | minimal
  linkedFiles: {
    // For each doc type, optional: { name, url, type: 'upload'|'link', dataUrl?, addedAt }
    '50tawi': null,
    'receipt': null,
    'payment': null,
    'income-receipt': null,
    'income-taxinvoice': null
  }
};

// In-memory org config (shared across doc modal opens)
window.ORG_CONFIG = window.ORG_CONFIG || { ...DEFAULT_ORG };
// Migrate older config that doesn't have linkedFiles
if (!window.ORG_CONFIG.linkedFiles) {
  window.ORG_CONFIG.linkedFiles = { '50tawi': null, 'receipt': null, 'payment': null, 'income-receipt': null, 'income-taxinvoice': null };
} else {
  // Ensure new keys exist
  if (!('income-receipt' in window.ORG_CONFIG.linkedFiles)) window.ORG_CONFIG.linkedFiles['income-receipt'] = null;
  if (!('income-taxinvoice' in window.ORG_CONFIG.linkedFiles)) window.ORG_CONFIG.linkedFiles['income-taxinvoice'] = null;
}

/* ============ Public helper: check if a doc type is linked to an external file ============ */
window.getLinkedDocFile = function(kind) {
  return (window.ORG_CONFIG.linkedFiles || {})[kind] || null;
};
window.openLinkedDoc = function(kind) {
  const f = window.getLinkedDocFile(kind);
  if (!f) return false;
  const url = f.type === 'upload' ? f.dataUrl : f.url;
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
};

/* ============ Editable text helper ============ */
// Wraps a value in a contentEditable span with subtle styling
function Editable({ children, multiline, style }) {
  const props = {
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    className: 'doc-editable',
    style
  };
  if (multiline) props.style = { ...style, whiteSpace: 'pre-wrap' };
  return <span {...props}>{children}</span>;
}

/* ============ Document Modal ============ */
function DocumentModal({ project, po, kind, onClose }) {
  const items = getPOItems(po);
  const [showSettings, setShowSettings] = useState(false);
  const [orgConfig, setOrgConfig] = useState({ ...window.ORG_CONFIG });
  const [editHintShown, setEditHintShown] = useState(true);

  const docNo = useMemo(() => {
    const d = new Date(po.date);
    const yr = (d.getFullYear() + 543).toString().slice(-2);
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const prefix = kind === '50tawi' ? 'WT' : kind === 'receipt' ? 'RV' : kind === 'payment' ? 'PV' : kind === 'income-receipt' ? 'RC' : 'TX';
    return `${prefix}${yr}${mo}-${(po.code || po.id || 'XX').slice(-3)}`;
  }, [po, kind]);

  const today = formatDateLong(new Date().toISOString().slice(0, 10));

  const titles = {
    '50tawi': 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ)',
    'receipt': 'ใบสำคัญรับเงิน (Receipt Voucher)',
    'payment': 'ใบสำคัญจ่ายเงิน (Payment Voucher)',
    'income-receipt': 'ใบเสร็จรับเงิน (Official Receipt)',
    'income-taxinvoice': 'ใบกำกับภาษี (Tax Invoice)'
  };

  const saveOrgConfig = (next) => {
    window.ORG_CONFIG = { ...next };
    setOrgConfig({ ...next });
  };

  const printDoc = () => {
    document.body.classList.add('printing-doc');
    const cleanup = () => {
      document.body.classList.remove('printing-doc');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const dlPDF = () => printDoc();

  if (showSettings) {
    return (
      <DocSettingsModal
        config={orgConfig}
        onSave={(c) => { saveOrgConfig(c); setShowSettings(false); }}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <Modal open={true} onClose={onClose} wide
      title={<span className="row gap-12"><Icon name="document" size={16}/> {titles[kind]} <span className="mono dim" style={{fontSize:'12px'}}>{docNo}</span></span>}
      footer={<>
        <button className="btn ghost" onClick={onClose}>ปิด</button>
        <button className="btn" onClick={() => setShowSettings(true)}>
          <Icon name="edit" size={13}/> ตั้งค่าหัวกระดาษ / โลโก้
        </button>
        <div style={{flex:1}}></div>
        <button className="btn primary" onClick={printDoc}><Icon name="print" size={14}/> พิมพ์เอกสาร</button>
      </>}>

      {editHintShown ? (
        <div className="doc-edit-hint print-hide">
          <Icon name="edit" size={13}/>
          <strong>คลิกที่ข้อความใดก็ได้ในเอกสารเพื่อแก้ไขก่อนพิมพ์</strong>
          <span className="dim">— ระบบจะคงค่าที่แก้ไว้จนกว่าจะปิดหน้าต่างนี้</span>
          <button className="icon-btn" onClick={() => setEditHintShown(false)} style={{marginLeft:'auto'}}>
            <Icon name="close" size={12}/>
          </button>
        </div>
      ) : null}

      <div className={`doc-print-area doc-template-${orgConfig.template}`}>
        {kind === '50tawi' ? <Doc50Tawi org={orgConfig} project={project} po={po} docNo={docNo} today={today}/> : null}
        {kind === 'receipt' ? <DocReceipt org={orgConfig} project={project} po={po} items={items} docNo={docNo} today={today}/> : null}
        {kind === 'payment' ? <DocPayment org={orgConfig} project={project} po={po} items={items} docNo={docNo} today={today}/> : null}
        {kind === 'income-receipt' ? <DocIncomeReceipt org={orgConfig} project={project} tx={po} docNo={docNo} today={today}/> : null}
        {kind === 'income-taxinvoice' ? <DocIncomeTaxInvoice org={orgConfig} project={project} tx={po} docNo={docNo} today={today}/> : null}
      </div>
    </Modal>
  );
}

/* ============ Org settings modal (head letter / logo / linked files / template) ============ */
function DocSettingsModal({ config, onSave, onClose }) {
  const [c, setC] = useState(() => ({
    ...config,
    linkedFiles: config.linkedFiles || { '50tawi': null, 'receipt': null, 'payment': null }
  }));
  const fileRef = useRef(null);

  const upload = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setC(prev => ({ ...prev, logo: ev.target.result }));
    reader.readAsDataURL(f);
  };

  const setLinkedFile = (kind, value) => {
    setC(prev => ({
      ...prev,
      linkedFiles: { ...(prev.linkedFiles || {}), [kind]: value }
    }));
  };

  const templates = [
    { key: 'classic', label: 'คลาสสิก', desc: 'แบบราชการ ขาว-ดำ เส้นชัดเจน' },
    { key: 'modern', label: 'โมเดิร์น', desc: 'แถบสีบนหัว ตัวอักษรใหญ่ ทันสมัย' },
    { key: 'minimal', label: 'มินิมัล', desc: 'เรียบง่าย ตัวอักษรบาง ขอบขาว' }
  ];

  const reset = () => setC({ ...DEFAULT_ORG });

  return (
    <Modal open={true} onClose={onClose} wide
      title={<span className="row gap-8"><Icon name="edit" size={15}/> ตั้งค่าฟอร์มเอกสาร / หัวกระดาษ / ไฟล์ที่เชื่อมโยง</span>}
      footer={<>
        <button className="btn ghost" onClick={reset}>คืนค่าเริ่มต้น</button>
        <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" onClick={() => onSave(c)}><Icon name="check" size={14}/> บันทึกการตั้งค่า</button>
      </>}>

      {/* ============ Linked external files section ============ */}
      <div className="settings-section">
        <div className="settings-section-head">
          <div className="ic-tag info"><Icon name="paperclip" size={16}/></div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:'14px', fontWeight:600}}>เชื่อมโยงไฟล์เอกสารภายนอก</div>
            <div className="dim" style={{fontSize:'12px', marginTop:'2px'}}>
              อัปโหลดไฟล์เทมเพลตเอกสารของบริษัท (.docx, .xlsx, .pdf, .png) หรือใส่ลิงก์ Google Drive / OneDrive — เมื่อกด "พิมพ์เอกสาร" ระบบจะเปิดไฟล์นี้แทนเทมเพลตในระบบ
            </div>
          </div>
        </div>
        {[
          { key: '50tawi', label: 'ใบ 50 ทวิ', icon: 'shield-check', desc: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย' },
          { key: 'receipt', label: 'ใบสำคัญรับเงิน', icon: 'receipt', desc: 'Receipt Voucher' },
          { key: 'payment', label: 'ใบสำคัญจ่ายเงิน', icon: 'wallet', desc: 'Payment Voucher' },
          { key: 'income-receipt', label: 'ใบเสร็จรับเงิน', icon: 'receipt', desc: 'Official Receipt — ออกให้เจ้าของงาน (รายรับ)' },
          { key: 'income-taxinvoice', label: 'ใบกำกับภาษี', icon: 'document', desc: 'Tax Invoice — เรียกเก็บ VAT 7% จากเจ้าของงาน' }
        ].map(d => (
          <LinkedFileRow key={d.key}
            kind={d.key}
            label={d.label}
            icon={d.icon}
            desc={d.desc}
            value={c.linkedFiles && c.linkedFiles[d.key]}
            onChange={(v) => setLinkedFile(d.key, v)}
          />
        ))}
      </div>

      <div className="settings-section">
        <div className="settings-section-head">
          <div className="ic-tag purple"><Icon name="building" size={16}/></div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:'14px', fontWeight:600}}>เทมเพลตในระบบ — ใช้เมื่อไม่ได้เชื่อมโยงไฟล์</div>
            <div className="dim" style={{fontSize:'12px', marginTop:'2px'}}>ตั้งค่าหัวกระดาษ โลโก้ และสไตล์ฟอร์มของระบบ</div>
          </div>
        </div>

        <div className="form-grid">
          <div className="field full">
            <label>โลโก้บริษัท</label>
            <div className="logo-upload">
              <div className="logo-preview">
                {c.logo ? (
                  <img src={c.logo} alt="logo"/>
                ) : (
                  <div className="logo-placeholder">
                    <Icon name="building" size={28}/>
                    <span>ยังไม่มีโลโก้</span>
                  </div>
                )}
              </div>
              <div className="logo-actions">
                <input type="file" ref={fileRef} accept="image/*" style={{display:'none'}} onChange={upload}/>
                <button className="btn" onClick={() => fileRef.current?.click()}>
                  <Icon name="upload" size={13}/> อัปโหลดโลโก้
                </button>
                {c.logo ? (
                  <button className="btn ghost danger" onClick={() => setC({...c, logo: null})}>
                    <Icon name="trash" size={13}/> ลบโลโก้
                  </button>
                ) : null}
                <div className="dim" style={{fontSize:'12px', marginTop:'4px'}}>
                  แนะนำขนาด 200×200px ขึ้นไป · พื้นหลังโปร่งใส (.png) ดีที่สุด
                </div>
              </div>
            </div>
          </div>

          <div className="field full">
            <label>สไตล์ฟอร์มเอกสาร</label>
            <div className="template-choices">
              {templates.map(t => (
                <button key={t.key} type="button"
                  className={`template-card ${c.template === t.key ? 'on' : ''}`}
                  onClick={() => setC({...c, template: t.key})}>
                  <div className={`template-preview template-preview-${t.key}`}>
                    <div className="tp-band"></div>
                    <div className="tp-lines"><div></div><div></div><div></div></div>
                    <div className="tp-table"><div></div><div></div><div></div></div>
                  </div>
                  <div className="template-info">
                    <strong>{t.label}</strong>
                    <span className="dim" style={{fontSize:'11.5px'}}>{t.desc}</span>
                  </div>
                  {c.template === t.key ? <Icon name="check" size={14} className="template-check"/> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="field full">
            <label>ชื่อบริษัท</label>
            <input className="input-base" value={c.name} onChange={e => setC({...c, name: e.target.value})}/>
          </div>
          <div className="field">
            <label>เลขประจำตัวผู้เสียภาษี</label>
            <input className="input-base mono" placeholder="0-1234-56789-01-2"
              value={c.taxId} onChange={e => setC({...c, taxId: e.target.value})}/>
          </div>
          <div className="field">
            <label>สาขา</label>
            <input className="input-base" value={c.branch} onChange={e => setC({...c, branch: e.target.value})}/>
          </div>
          <div className="field full">
            <label>ที่อยู่</label>
            <textarea className="input-base" rows="2"
              value={c.address} onChange={e => setC({...c, address: e.target.value})}/>
          </div>
          <div className="field">
            <label>โทรศัพท์</label>
            <input className="input-base" value={c.phone} onChange={e => setC({...c, phone: e.target.value})}/>
          </div>
          <div className="field">
            <label>อีเมล</label>
            <input className="input-base" value={c.email} onChange={e => setC({...c, email: e.target.value})}/>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Linked File Row — per-doc-type upload + URL ============ */
function LinkedFileRow({ kind, label, icon, desc, value, onChange }) {
  const fileRef = useRef(null);
  const [mode, setMode] = useState(value ? value.type : 'none'); // none | upload | link
  const [url, setUrl] = useState(value && value.type === 'link' ? value.url : '');

  // sync mode when value changes externally
  useEffect(() => {
    if (value) setMode(value.type);
  }, [value]);

  const upload = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange({
        type: 'upload',
        name: f.name,
        size: f.size,
        mime: f.type,
        dataUrl: ev.target.result,
        addedAt: new Date().toISOString().slice(0, 10)
      });
      setMode('upload');
    };
    reader.readAsDataURL(f);
  };

  const saveUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onChange({
      type: 'link',
      name: trimmed.split('/').pop() || 'ลิงก์ภายนอก',
      url: trimmed,
      addedAt: new Date().toISOString().slice(0, 10)
    });
    setMode('link');
  };

  const clear = () => {
    onChange(null);
    setMode('none');
    setUrl('');
  };

  const isLinked = value && (value.type === 'upload' || value.type === 'link');

  return (
    <div className={`linked-file-row ${isLinked ? 'on' : ''}`}>
      <div className="lfr-head">
        <div className="ic-tag info" style={{width:'32px', height:'32px'}}>
          <Icon name={icon} size={15}/>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontWeight:600, fontSize:'13.5px'}}>{label}</div>
          <div className="dim" style={{fontSize:'11.5px'}}>{desc}</div>
        </div>
        {isLinked ? (
          <Badge tone="brand" dot>เชื่อมโยงแล้ว</Badge>
        ) : (
          <Badge>ยังไม่ได้เชื่อมโยง</Badge>
        )}
      </div>

      {isLinked ? (
        <div className="lfr-linked">
          <Icon name="paperclip" size={14} style={{color:'var(--brand-bright)'}}/>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
              {value.type === 'upload' ? <strong>{value.name}</strong> : <a href={value.url} target="_blank" rel="noopener noreferrer">{value.name}</a>}
            </div>
            <div className="dim" style={{fontSize:'11px'}}>
              {value.type === 'upload' ? `ไฟล์ที่อัปโหลด · ${(value.size/1024).toFixed(1)} KB` : 'ลิงก์ภายนอก'}
              {' · เพิ่มเมื่อ ' + formatDate(value.addedAt)}
            </div>
          </div>
          {value.type === 'link' ? (
            <a className="btn sm" href={value.url} target="_blank" rel="noopener noreferrer">
              <Icon name="arrow-right" size={12}/> เปิด
            </a>
          ) : (
            <a className="btn sm" href={value.dataUrl} download={value.name}>
              <Icon name="download" size={12}/> ดาวน์โหลด
            </a>
          )}
          <button className="icon-btn danger" onClick={clear} title="ลบการเชื่อมโยง">
            <Icon name="trash" size={13}/>
          </button>
        </div>
      ) : (
        <div className="lfr-options">
          <input type="file" ref={fileRef} style={{display:'none'}}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={upload}/>
          <button className="btn sm" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={12}/> อัปโหลดไฟล์
          </button>
          <span className="dim" style={{fontSize:'12px'}}>หรือ</span>
          <div className="lfr-url-row">
            <input className="input-base" placeholder="วางลิงก์ Google Drive / OneDrive / Dropbox..."
              value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveUrl(); }}
              style={{fontSize:'12.5px'}}/>
            <button className="btn sm primary" disabled={!url.trim()} onClick={saveUrl}>
              <Icon name="check" size={12}/> ใช้ลิงก์นี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ 50 ทวิ — Withholding Tax Certificate ============ */
function Doc50Tawi({ org, project, po, docNo, today }) {
  const subtotal = po.subtotal || (po.items || []).reduce((s, it) => s + it.amount, 0);
  const whtRate = po.withholding || 3;
  const whtAmount = po.whtAmount || (subtotal * whtRate / 100);

  // Choose income category text based on kind
  const incomeTypeText = (() => {
    if (po.kind === 'labor' || po.kind === 'subcontract') return 'ค่าจ้างทำของ / ค่าบริการ (3%)';
    if (po.kind === 'machine') return 'ค่าเช่าทรัพย์สิน — เครื่องจักร (5%)';
    if (po.kind === 'material') return 'ค่าวัสดุ / ค่าซื้อขายสินค้า (1%)';
    return 'ค่าจ้าง / บริการ';
  })();

  return (
    <div className="doc-page">
      <DocLetterhead org={org} corner={`เล่มที่ ........ / เลขที่ ${docNo}`}/>

      <h2 className="doc-title"><Editable>หนังสือรับรองการหักภาษี ณ ที่จ่าย</Editable></h2>
      <div className="doc-subtitle"><Editable>ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</Editable></div>

      {/* Payer (us) */}
      <div className="doc-grid-2 doc-section">
        <div>
          <div className="doc-label">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</div>
          <div className="doc-value"><strong><Editable>{org.name}</Editable></strong></div>
          <div className="doc-fine">ที่อยู่: <Editable>{org.address}</Editable></div>
        </div>
        <div>
          <div className="doc-label">เลขประจำตัวผู้เสียภาษี</div>
          <div className="doc-tax-boxes">
            {(org.taxId || '').replace(/-/g, '').padEnd(13, ' ').split('').slice(0, 13).map((c, i) => (
              <span key={i} className="doc-tax-box">{c.trim()}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Payee (vendor) */}
      <div className="doc-grid-2 doc-section">
        <div>
          <div className="doc-label">ผู้ถูกหักภาษี ณ ที่จ่าย</div>
          <div className="doc-value"><strong><Editable>{po.vendor}</Editable></strong></div>
          <div className="doc-fine">ที่อยู่: <Editable>........................................................................</Editable></div>
        </div>
        <div>
          <div className="doc-label">เลขประจำตัวผู้เสียภาษี</div>
          <div className="doc-tax-boxes">
            {Array.from({length: 13}).map((_, i) => (<span key={i} className="doc-tax-box" contentEditable suppressContentEditableWarning></span>))}
          </div>
        </div>
      </div>

      <div className="doc-section">
        <div className="doc-label">ลำดับที่ในแบบยื่นรายการ</div>
        <div className="doc-fine">
          ☐ (1) ภ.ง.ด.1ก &nbsp;
          ☐ (2) ภ.ง.ด.1ก พิเศษ &nbsp;
          ☐ (3) ภ.ง.ด.2 &nbsp;
          <span style={{padding:'1px 4px', border:'1.5px solid #000'}}>✓</span> (4) ภ.ง.ด.3 &nbsp;
          ☐ (5) ภ.ง.ด.53
        </div>
      </div>

      {/* Income table */}
      <table className="doc-table">
        <thead>
          <tr>
            <th style={{width:'48%'}}>ประเภทเงินได้พึงประเมินที่จ่าย</th>
            <th style={{width:'18%'}}>วัน เดือน หรือปีภาษี ที่จ่าย</th>
            <th style={{width:'17%', textAlign:'right'}}>จำนวนเงินที่จ่าย</th>
            <th style={{width:'17%', textAlign:'right'}}>ภาษีที่หักและนำส่งไว้</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div>1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40(1)</div>
              <div>2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40(2)</div>
              <div>3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40(3)</div>
              <div>4. (ก) ค่าดอกเบี้ย ฯลฯ ตามมาตรา 40(4)(ก)</div>
              <div>(ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40(4)(ข)</div>
              <div style={{marginTop:'4px', paddingTop:'4px', borderTop:'1px dashed #666'}}>
                <strong>5. การจ่ายเงินตามคำสั่ง/มาตรา 3 เตรส</strong>
                <div style={{marginLeft:'12px'}}>
                  <span style={{padding:'1px 4px', border:'1.5px solid #000'}}>✓</span> <Editable>{incomeTypeText}</Editable>
                </div>
                <div className="doc-fine" style={{marginLeft:'12px', marginTop:'2px'}}>
                  รายละเอียดงาน: <Editable>{(po.items || []).map(it => it.description).join(', ')}</Editable>
                </div>
              </div>
              <div style={{marginTop:'6px'}}>6. อื่นๆ (ระบุ) <Editable>............................</Editable></div>
            </td>
            <td style={{textAlign:'center', verticalAlign:'top'}}>
              <div style={{marginTop:'120px'}}><Editable>{formatDateLong(po.date)}</Editable></div>
            </td>
            <td className="num" style={{verticalAlign:'top'}}>
              <div style={{marginTop:'120px'}}><Editable>{formatBaht(subtotal)}</Editable> บ.</div>
            </td>
            <td className="num" style={{verticalAlign:'top'}}>
              <div style={{marginTop:'120px'}}><strong><Editable>{formatBaht(whtAmount)}</Editable></strong> บ.</div>
            </td>
          </tr>
          <tr>
            <td colSpan="2" style={{textAlign:'right'}}><strong>รวมเงินที่จ่าย และภาษีหักนำส่ง</strong></td>
            <td className="num"><strong><Editable>{formatBaht(subtotal)}</Editable> บ.</strong></td>
            <td className="num"><strong><Editable>{formatBaht(whtAmount)}</Editable> บ.</strong></td>
          </tr>
          <tr>
            <td colSpan="4">
              รวมเงินภาษีที่หักนำส่ง (ตัวอักษร) &nbsp; <strong><Editable>{bahtText(whtAmount)}</Editable></strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="doc-fine doc-section" style={{padding:'10px', border:'1px solid #999'}}>
        <strong>ผู้จ่ายเงิน</strong> &nbsp;
        <span style={{padding:'1px 4px', border:'1.5px solid #000'}}>✓</span> (1) หัก ณ ที่จ่าย &nbsp;
        ☐ (2) ออกให้ตลอดไป &nbsp;
        ☐ (3) ออกให้ครั้งเดียว &nbsp;
        ☐ (4) อื่นๆ <Editable>........................</Editable>
      </div>

      <div className="doc-warning">
        <strong>คำเตือน:</strong> ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ
        แห่งประมวลรัษฎากร ต้องระวางโทษปรับไม่เกิน 2,000 บาท ตามมาตรา 35 แห่งประมวลรัษฎากร
      </div>

      <div className="doc-grid-2 doc-section" style={{marginTop:'40px'}}>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ลงชื่อ <Editable>.................................</Editable> ผู้จ่ายเงิน</div>
          <div className="doc-fine" style={{marginTop:'4px'}}>วันที่ <Editable>{today}</Editable></div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ประทับตรา (ถ้ามี)</div>
        </div>
      </div>
    </div>
  );
}

/* ============ Letterhead helper ============ */
function DocLetterhead({ org, corner }) {
  return (
    <div className="doc-head-row">
      <div className="doc-letterhead">
        {org.logo ? (
          <img src={org.logo} alt="logo" className="doc-logo"/>
        ) : null}
        <div>
          <div className="doc-org-name"><Editable>{org.name}</Editable></div>
          <div className="doc-fine"><Editable>{org.address}</Editable></div>
          <div className="doc-fine">
            โทร. <Editable>{org.phone}</Editable> ·&nbsp;
            เลขประจำตัวผู้เสียภาษี <Editable>{org.taxId}</Editable>
            {org.email ? <> · อีเมล <Editable>{org.email}</Editable></> : null}
          </div>
        </div>
      </div>
      {corner ? <div className="doc-corner"><Editable>{corner}</Editable></div> : null}
    </div>
  );
}

/* ============ ใบสำคัญรับเงิน — Receipt Voucher ============ */
function DocReceipt({ org, project, po, items, docNo, today }) {
  const subtotal = po.subtotal || items.reduce((s, it) => s + it.amount, 0);
  return (
    <div className="doc-page">
      <div className="doc-head-row">
        <div className="doc-letterhead">
          {org.logo ? <img src={org.logo} alt="logo" className="doc-logo"/> : null}
          <div>
            <div className="doc-org-name"><Editable>{org.name}</Editable></div>
            <div className="doc-fine"><Editable>{org.address}</Editable></div>
            <div className="doc-fine">โทร. <Editable>{org.phone}</Editable> · เลขประจำตัวผู้เสียภาษี <Editable>{org.taxId}</Editable></div>
          </div>
        </div>
        <div className="doc-corner">
          <div>เลขที่ <strong><Editable>{docNo}</Editable></strong></div>
          <div>วันที่ <Editable>{today}</Editable></div>
        </div>
      </div>

      <h2 className="doc-title" style={{marginBottom:'6px'}}><Editable>ใบสำคัญรับเงิน</Editable></h2>
      <div className="doc-subtitle" style={{marginBottom:'16px'}}><Editable>Receipt Voucher</Editable></div>

      <div className="doc-info-row">
        <div><span className="doc-label">ได้รับเงินจาก:</span> <strong><Editable>{po.vendor || project.client}</Editable></strong></div>
        <div><span className="doc-label">โครงการ:</span> <Editable>{project.name}</Editable> <span className="mono dim">(<Editable>{project.code}</Editable>)</span></div>
        <div><span className="doc-label">อ้างอิงใบสั่งซื้อ:</span> <span className="mono"><Editable>{po.code}</Editable></span></div>
      </div>

      <table className="doc-table mt-16">
        <thead>
          <tr>
            <th style={{width:'40px'}}>#</th>
            <th>รายละเอียดรายการ</th>
            <th style={{width:'90px', textAlign:'right'}}>จำนวน</th>
            <th style={{width:'90px'}}>หน่วย</th>
            <th style={{width:'130px', textAlign:'right'}}>จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="num">{i + 1}</td>
              <td>
                <div><Editable>{it.description}</Editable></div>
                <div className="doc-fine">หมวด: <Editable>{it.category}</Editable></div>
              </td>
              <td className="num"><Editable>{it.qty}</Editable></td>
              <td><Editable>{it.unit}</Editable></td>
              <td className="num"><strong><Editable>{formatBaht(it.amount)}</Editable></strong></td>
            </tr>
          ))}
          {Array.from({length: Math.max(0, 5 - items.length)}).map((_, i) => (
            <tr key={'e' + i}><td colSpan="5">&nbsp;</td></tr>
          ))}
          <tr>
            <td colSpan="4" style={{textAlign:'right'}}><strong>รวมเป็นเงินทั้งสิ้น</strong></td>
            <td className="num"><strong><Editable>{formatBaht(subtotal)}</Editable> บ.</strong></td>
          </tr>
          {po.vat ? (
            <tr><td colSpan="4" style={{textAlign:'right'}}>+ ภาษีมูลค่าเพิ่ม 7%</td>
              <td className="num"><Editable>{formatBaht(po.vatAmount || subtotal*0.07)}</Editable> บ.</td></tr>
          ) : null}
          <tr style={{background:'#f4f4f4'}}>
            <td colSpan="4" style={{textAlign:'right'}}><strong>ยอดสุทธิที่รับเงิน</strong></td>
            <td className="num"><strong style={{fontSize:'14px'}}><Editable>{formatBaht(po.amount)}</Editable> บ.</strong></td>
          </tr>
          <tr>
            <td colSpan="5">
              <strong>(ตัวอักษร)</strong> &nbsp; <Editable>{bahtText(po.amount)}</Editable>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="doc-section">
        <div className="doc-label">การรับชำระเงิน</div>
        <div className="doc-fine">
          ☐ เงินสด &nbsp;
          <span style={{padding:'1px 4px', border:'1.5px solid #000'}}>✓</span> โอนผ่านธนาคาร &nbsp;
          ☐ เช็คเลขที่ <Editable>............................</Editable> ธนาคาร <Editable>...........................</Editable>
        </div>
      </div>

      <div className="doc-grid-3" style={{marginTop:'40px'}}>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้รับเงิน</div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้ตรวจสอบ</div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้อนุมัติ</div>
          <div className="doc-fine"><Editable>{po.approvedBy || ''}</Editable></div>
        </div>
      </div>
    </div>
  );
}

/* ============ ใบสำคัญจ่ายเงิน — Payment Voucher ============ */
function DocPayment({ org, project, po, items, docNo, today }) {
  const subtotal = po.subtotal || items.reduce((s, it) => s + it.amount, 0);
  return (
    <div className="doc-page">
      <div className="doc-head-row">
        <div className="doc-letterhead">
          {org.logo ? <img src={org.logo} alt="logo" className="doc-logo"/> : null}
          <div>
            <div className="doc-org-name"><Editable>{org.name}</Editable></div>
            <div className="doc-fine"><Editable>{org.address}</Editable></div>
            <div className="doc-fine">โทร. <Editable>{org.phone}</Editable> · เลขประจำตัวผู้เสียภาษี <Editable>{org.taxId}</Editable></div>
          </div>
        </div>
        <div className="doc-corner">
          <div>เลขที่ <strong><Editable>{docNo}</Editable></strong></div>
          <div>วันที่ <Editable>{today}</Editable></div>
        </div>
      </div>

      <h2 className="doc-title" style={{marginBottom:'6px'}}><Editable>ใบสำคัญจ่ายเงิน</Editable></h2>
      <div className="doc-subtitle" style={{marginBottom:'16px'}}><Editable>Payment Voucher</Editable></div>

      <div className="doc-info-row">
        <div><span className="doc-label">จ่ายให้:</span> <strong><Editable>{po.vendor}</Editable></strong></div>
        <div><span className="doc-label">สำหรับโครงการ:</span> <Editable>{project.name}</Editable> <span className="mono dim">(<Editable>{project.code}</Editable>)</span></div>
        <div><span className="doc-label">อ้างอิงใบสั่งซื้อ:</span> <span className="mono"><Editable>{po.code}</Editable></span> · วันที่จ่าย: <Editable>{formatDateLong(po.paidAt || po.date)}</Editable></div>
      </div>

      <table className="doc-table mt-16">
        <thead>
          <tr>
            <th style={{width:'40px'}}>#</th>
            <th>รายละเอียดรายการ</th>
            <th style={{width:'90px', textAlign:'right'}}>จำนวน</th>
            <th style={{width:'90px'}}>หน่วย</th>
            <th style={{width:'110px', textAlign:'right'}}>ราคา/หน่วย</th>
            <th style={{width:'130px', textAlign:'right'}}>จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="num">{i + 1}</td>
              <td>
                <div><Editable>{it.description}</Editable></div>
                <div className="doc-fine">หมวด: <Editable>{it.category}</Editable></div>
              </td>
              <td className="num"><Editable>{it.qty}</Editable></td>
              <td><Editable>{it.unit}</Editable></td>
              <td className="num"><Editable>{formatBaht(it.unitPrice)}</Editable></td>
              <td className="num"><strong><Editable>{formatBaht(it.amount)}</Editable></strong></td>
            </tr>
          ))}
          {Array.from({length: Math.max(0, 4 - items.length)}).map((_, i) => (
            <tr key={'e' + i}><td colSpan="6">&nbsp;</td></tr>
          ))}
          <tr>
            <td colSpan="5" style={{textAlign:'right'}}>ยอดรวมก่อนภาษี</td>
            <td className="num"><Editable>{formatBaht(subtotal)}</Editable> บ.</td>
          </tr>
          {po.vat ? (
            <tr><td colSpan="5" style={{textAlign:'right'}}>+ ภาษีมูลค่าเพิ่ม 7%</td>
              <td className="num"><Editable>{formatBaht(po.vatAmount || 0)}</Editable> บ.</td></tr>
          ) : null}
          {po.withholding > 0 ? (
            <tr><td colSpan="5" style={{textAlign:'right'}}>− หักภาษี ณ ที่จ่าย {po.withholding}%</td>
              <td className="num">−<Editable>{formatBaht(po.whtAmount || 0)}</Editable> บ.</td></tr>
          ) : null}
          {po.retentionAmount > 0 ? (
            <tr><td colSpan="5" style={{textAlign:'right'}}>− หักเงินประกันผลงาน</td>
              <td className="num">−<Editable>{formatBaht(po.retentionAmount)}</Editable> บ.</td></tr>
          ) : null}
          {po.advanceDeduct > 0 ? (
            <tr><td colSpan="5" style={{textAlign:'right'}}>− หักเงินเบิกล่วงหน้า</td>
              <td className="num">−<Editable>{formatBaht(po.advanceDeduct)}</Editable> บ.</td></tr>
          ) : null}
          <tr style={{background:'#f4f4f4'}}>
            <td colSpan="5" style={{textAlign:'right'}}><strong>ยอดสุทธิที่จ่าย</strong></td>
            <td className="num"><strong style={{fontSize:'14px'}}><Editable>{formatBaht(po.amount)}</Editable> บ.</strong></td>
          </tr>
          <tr>
            <td colSpan="6">
              <strong>(ตัวอักษร)</strong> &nbsp; <Editable>{bahtText(po.amount)}</Editable>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="doc-section">
        <div className="doc-label">วิธีการชำระเงิน</div>
        <div className="doc-fine">
          ☐ เงินสด &nbsp;
          <span style={{padding:'1px 4px', border:'1.5px solid #000'}}>✓</span> โอนเข้าบัญชี &nbsp;
          ☐ เช็คเลขที่ <Editable>............................</Editable> ธนาคาร <Editable>...........................</Editable>
          {po.paymentSlip ? <div style={{marginTop:'4px'}}>หลักฐาน: <strong><Editable>{po.paymentSlip}</Editable></strong></div> : null}
        </div>
      </div>

      <div className="doc-grid-4" style={{marginTop:'40px'}}>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้จัดทำ</div>
          <div className="doc-fine"><Editable>{po.createdBy || ''}</Editable></div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้ตรวจสอบ</div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้อนุมัติ</div>
          <div className="doc-fine"><Editable>{po.approvedBy || ''}</Editable></div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้รับเงิน</div>
        </div>
      </div>
    </div>
  );
}

/* ============ ใบเสร็จรับเงิน — Income Official Receipt ============ */
function DocIncomeReceipt({ org, project, tx, docNo, today }) {
  const amt = tx.amount || 0;
  const ded = tx.deductionPct > 0 ? amt * (tx.deductionPct / 100) : 0;
  const net = amt - ded;
  return (
    <div className="doc-page">
      <div className="doc-head-row">
        <div className="doc-letterhead">
          {org.logo ? <img src={org.logo} alt="logo" className="doc-logo"/> : null}
          <div>
            <div className="doc-org-name"><Editable>{org.name}</Editable></div>
            <div className="doc-fine"><Editable>{org.address}</Editable></div>
            <div className="doc-fine">โทร. <Editable>{org.phone}</Editable> · เลขประจำตัวผู้เสียภาษี <Editable>{org.taxId}</Editable></div>
          </div>
        </div>
        <div className="doc-corner">
          <div>เลขที่ <strong><Editable>{docNo}</Editable></strong></div>
          <div>วันที่ <Editable>{today}</Editable></div>
        </div>
      </div>

      <h2 className="doc-title" style={{marginBottom:'6px'}}><Editable>ใบเสร็จรับเงิน</Editable></h2>
      <div className="doc-subtitle" style={{marginBottom:'16px'}}><Editable>RECEIPT / OFFICIAL RECEIPT</Editable></div>

      <div className="doc-info-row">
        <div><span className="doc-label">ได้รับเงินจาก:</span> <strong><Editable>{project.client}</Editable></strong></div>
        <div><span className="doc-label">สำหรับโครงการ:</span> <Editable>{project.name}</Editable> <span className="mono dim">(<Editable>{project.code}</Editable>)</span></div>
        <div><span className="doc-label">วันที่รับเงิน:</span> <Editable>{formatDateLong(tx.date)}</Editable></div>
      </div>

      <table className="doc-table mt-16">
        <thead>
          <tr>
            <th style={{width:'60px'}}>ลำดับ</th>
            <th>รายการ</th>
            <th style={{width:'160px', textAlign:'right'}}>จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="num">1</td>
            <td>
              <div><strong><Editable>{tx.category}</Editable></strong></div>
              <div className="doc-fine"><Editable>{tx.description}</Editable></div>
            </td>
            <td className="num"><strong><Editable>{formatBaht(amt)}</Editable></strong></td>
          </tr>
          {Array.from({length: 4}).map((_, i) => (
            <tr key={'e' + i}><td colSpan="3">&nbsp;</td></tr>
          ))}
          <tr>
            <td colSpan="2" style={{textAlign:'right'}}><strong>ยอดรวม</strong></td>
            <td className="num"><strong><Editable>{formatBaht(amt)}</Editable> บ.</strong></td>
          </tr>
          {ded > 0 ? (
            <tr>
              <td colSpan="2" style={{textAlign:'right'}}>− หักออก {tx.deductionPct}%{tx.deductionNote ? ' (' + tx.deductionNote + ')' : ''}</td>
              <td className="num">−<Editable>{formatBaht(ded)}</Editable> บ.</td>
            </tr>
          ) : null}
          <tr style={{background:'#f4f4f4'}}>
            <td colSpan="2" style={{textAlign:'right'}}><strong>ยอดสุทธิที่ได้รับ</strong></td>
            <td className="num"><strong style={{fontSize:'14px'}}><Editable>{formatBaht(net)}</Editable> บ.</strong></td>
          </tr>
          <tr>
            <td colSpan="3"><strong>(ตัวอักษร)</strong> &nbsp; <Editable>{bahtText(net)}</Editable></td>
          </tr>
        </tbody>
      </table>

      <div className="doc-section">
        <div className="doc-label">วิธีการรับชำระ</div>
        <div className="doc-fine">
          ☐ เงินสด &nbsp;
          <span style={{padding:'1px 4px', border:'1.5px solid #000'}}>✓</span> โอนผ่านธนาคาร &nbsp;
          ☐ เช็คเลขที่ <Editable>............................</Editable> ธนาคาร <Editable>...........................</Editable>
        </div>
      </div>

      <div className="doc-grid-3" style={{marginTop:'40px'}}>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้รับเงิน</div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้ตรวจสอบ</div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้อนุมัติ</div>
        </div>
      </div>
      <div className="doc-warning" style={{marginTop:'20px'}}>
        เอกสารฉบับนี้ถือเป็นหลักฐานการได้รับเงินอย่างเป็นทางการ — โปรดเก็บรักษาเพื่อใช้อ้างอิงทางบัญชี
      </div>
    </div>
  );
}

/* ============ ใบกำกับภาษี — Income Tax Invoice ============ */
function DocIncomeTaxInvoice({ org, project, tx, docNo, today }) {
  const amt = tx.amount || 0;
  // Tax invoice: assume the amount is VAT-inclusive; show VAT extracted (7/107)
  const vatBase = amt / 1.07;
  const vat = amt - vatBase;
  return (
    <div className="doc-page">
      <div className="doc-head-row">
        <div className="doc-letterhead">
          {org.logo ? <img src={org.logo} alt="logo" className="doc-logo"/> : null}
          <div>
            <div className="doc-org-name"><Editable>{org.name}</Editable></div>
            <div className="doc-fine"><Editable>{org.address}</Editable></div>
            <div className="doc-fine">โทร. <Editable>{org.phone}</Editable> · เลขประจำตัวผู้เสียภาษี <Editable>{org.taxId}</Editable> · สาขา <Editable>{org.branch}</Editable></div>
          </div>
        </div>
        <div className="doc-corner">
          <div>เลขที่ <strong><Editable>{docNo}</Editable></strong></div>
          <div>วันที่ <Editable>{today}</Editable></div>
        </div>
      </div>

      <h2 className="doc-title" style={{marginBottom:'6px'}}><Editable>ใบกำกับภาษี / ใบแจ้งหนี้</Editable></h2>
      <div className="doc-subtitle" style={{marginBottom:'16px'}}><Editable>TAX INVOICE / INVOICE</Editable></div>

      <div className="doc-grid-2 doc-section">
        <div>
          <div className="doc-label">ลูกค้า / ผู้ซื้อสินค้า/บริการ</div>
          <div className="doc-value"><strong><Editable>{project.client}</Editable></strong></div>
          <div className="doc-fine">ที่อยู่: <Editable>........................................................................</Editable></div>
        </div>
        <div>
          <div className="doc-label">เลขประจำตัวผู้เสียภาษี (ลูกค้า)</div>
          <div className="doc-tax-boxes">
            {Array.from({length: 13}).map((_, i) => (<span key={i} className="doc-tax-box" contentEditable suppressContentEditableWarning></span>))}
          </div>
          <div className="doc-fine" style={{marginTop:'6px'}}>โครงการ: <Editable>{project.name}</Editable></div>
        </div>
      </div>

      <table className="doc-table mt-16">
        <thead>
          <tr>
            <th style={{width:'50px'}}>ลำดับ</th>
            <th>รายการ</th>
            <th style={{width:'90px', textAlign:'right'}}>จำนวน</th>
            <th style={{width:'90px'}}>หน่วย</th>
            <th style={{width:'130px', textAlign:'right'}}>จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="num">1</td>
            <td>
              <div><strong><Editable>{tx.category}</Editable></strong></div>
              <div className="doc-fine"><Editable>{tx.description}</Editable></div>
            </td>
            <td className="num"><Editable>1</Editable></td>
            <td><Editable>งวด</Editable></td>
            <td className="num"><strong><Editable>{formatBaht(vatBase)}</Editable></strong></td>
          </tr>
          {Array.from({length: 3}).map((_, i) => (
            <tr key={'e' + i}><td colSpan="5">&nbsp;</td></tr>
          ))}
          <tr>
            <td colSpan="4" style={{textAlign:'right'}}>มูลค่าสินค้า / บริการ</td>
            <td className="num"><Editable>{formatBaht(vatBase)}</Editable> บ.</td>
          </tr>
          <tr>
            <td colSpan="4" style={{textAlign:'right'}}>ภาษีมูลค่าเพิ่ม 7%</td>
            <td className="num"><Editable>{formatBaht(vat)}</Editable> บ.</td>
          </tr>
          <tr style={{background:'#f4f4f4'}}>
            <td colSpan="4" style={{textAlign:'right'}}><strong>ยอดรวมที่ต้องชำระ</strong></td>
            <td className="num"><strong style={{fontSize:'14px'}}><Editable>{formatBaht(amt)}</Editable> บ.</strong></td>
          </tr>
          <tr>
            <td colSpan="5"><strong>(ตัวอักษร)</strong> &nbsp; <Editable>{bahtText(amt)}</Editable></td>
          </tr>
        </tbody>
      </table>

      <div className="doc-section">
        <div className="doc-label">เงื่อนไขการชำระ</div>
        <div className="doc-fine">
          <Editable>กำหนดชำระภายใน 30 วัน นับจากวันที่ออกเอกสาร</Editable>
        </div>
        <div className="doc-label" style={{marginTop:'8px'}}>โอนเงินเข้าบัญชี</div>
        <div className="doc-fine">
          ธนาคาร <Editable>...........................</Editable> สาขา <Editable>...........................</Editable>
          เลขที่บัญชี <Editable>...........................</Editable> ชื่อบัญชี <Editable>{org.name}</Editable>
        </div>
      </div>

      <div className="doc-grid-2" style={{marginTop:'40px'}}>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้รับเงิน / ผู้มีอำนาจลงนาม</div>
          <div className="doc-fine">ประทับตราบริษัท (ถ้ามี)</div>
        </div>
        <div className="doc-sign-box">
          <div className="doc-sign-line"></div>
          <div>ผู้รับวางบิล / ลูกค้า</div>
          <div className="doc-fine">วันที่ <Editable>...................</Editable></div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DocumentModal, DocSettingsModal, bahtText });
