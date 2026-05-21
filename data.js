/* FOR HOUSE — Sample data
   Window globals exposed for shared use across babel scripts
   ============================================================ */
(function () {
  'use strict';

  // ---------- Formatters ----------
  function formatBaht(n, opts) {
    opts = opts || {};
    if (n === null || n === undefined || isNaN(n)) return '—';
    var abs = Math.abs(n);
    var sign = n < 0 ? '-' : '';
    if (opts.compact && abs >= 1e6) {
      return sign + (abs / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    }
    if (opts.compact && abs >= 1e3) {
      return sign + (abs / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    var s = Math.round(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + s;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    var m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + (d.getFullYear() + 543).toString().slice(-2);
  }

  function formatDateLong(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    var m = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + (d.getFullYear() + 543);
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  }

  // ---------- Number input formatters (for money/cost inputs) ----------
  // Live-format numeric input: adds thousand separators, supports one decimal point.
  // Example: "1234567"     → "1,234,567"
  //          "1234.56"     → "1,234.56"
  //          "1,000.5"     → "1,000.5"
  function formatNumberInput(raw) {
    if (raw == null || raw === '') return '';
    // Strip all chars except digits and dot
    var s = String(raw).replace(/[^\d.]/g, '');
    // Allow only one decimal point — keep the first, drop the rest
    var firstDot = s.indexOf('.');
    if (firstDot !== -1) {
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    }
    var parts = s.split('.');
    var intPart = parts[0];
    if (intPart) {
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    if (parts.length === 1) return intPart;
    return intPart + '.' + parts[1];
  }

  // Parse a formatted number string back into a Number.
  function parseNumberInput(s) {
    if (s == null || s === '') return 0;
    return parseFloat(String(s).replace(/,/g, '')) || 0;
  }

  // UUID v4 — used for all IDs that are stored in Supabase (PO, income, items)
  function genId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ---------- Expense category meta ----------
  // Each "kind" has its own subcategory list (editable by user in app).
  var KINDS = {
    income:      { key: 'income',      label: 'รายรับ (งวดงาน)',     short: 'รายรับ',     color: '#22c55e', icon: 'income' },
    material:    { key: 'material',    label: 'รายจ่ายค่าวัสดุ',       short: 'วัสดุ',       color: '#60a5fa', icon: 'box' },
    labor:       { key: 'labor',       label: 'รายจ่ายค่าแรงงาน',     short: 'แรงงาน',     color: '#fbbf24', icon: 'users' },
    subcontract: { key: 'subcontract', label: 'รายจ่ายค่าแรงรับเหมาช่วง', short: 'รับเหมาช่วง', color: '#c084fc', icon: 'handshake' },
    machine:     { key: 'machine',     label: 'รายจ่ายค่าเครื่องจักร',    short: 'เครื่องจักร', color: '#f97316', icon: 'truck' },
    other:       { key: 'other',       label: 'รายจ่ายต้นทุนอื่นๆ',       short: 'อื่นๆ',       color: '#94a3b8', icon: 'dots' }
  };
  var EXPENSE_KINDS = ['material','labor','subcontract','machine','other'];
  var ALL_KINDS = ['income'].concat(EXPENSE_KINDS);

  // ---------- Default subcategories per kind ----------
  var DEFAULT_CATS = {
    income:      ['งวดที่ 1 - เริ่มงาน', 'งวดที่ 2 - งานโครงสร้าง', 'งวดที่ 3 - งานสถาปัตย์', 'งวดที่ 4 - งานระบบ', 'งวดสุดท้าย - ส่งมอบงาน', 'ค่ามัดจำ'],
    material:    ['ปูน-ทราย-หิน', 'เหล็กเส้น/เหล็กรูปพรรณ', 'อิฐ/บล็อก', 'ไม้แบบ/นั่งร้าน', 'กระเบื้อง/สุขภัณฑ์', 'สีและอุปกรณ์ทาสี', 'หลังคา', 'ระบบไฟฟ้า', 'ระบบประปา', 'อุปกรณ์เบ็ดเตล็ด'],
    labor:       ['หัวหน้างาน', 'ช่างไม้', 'ช่างเหล็ก', 'ช่างปูน', 'ช่างไฟ', 'ช่างประปา', 'ช่างทาสี', 'กรรมกรทั่วไป', 'OT - ทำงานล่วงเวลา'],
    subcontract: ['งานเสาเข็ม', 'งานโครงสร้าง', 'งานหลังคา', 'งานฉาบ-ทาสี', 'งานกระเบื้อง', 'งานสุขภัณฑ์', 'งานระบบไฟฟ้า', 'งานระบบประปา', 'งานติดตั้งประตูหน้าต่าง'],
    machine:     ['ค่าเช่ารถผสมปูน', 'ค่าเช่าเครน', 'ค่าเช่ารถบรรทุก', 'ค่าน้ำมัน-เชื้อเพลิง', 'ค่าซ่อมบำรุง', 'ค่าเช่าเครื่องตบดิน', 'ค่าเช่านั่งร้าน'],
    other:       ['ค่าขออนุญาตก่อสร้าง', 'ค่าทำแบบ-วิศวกร', 'ค่าน้ำ-ไฟไซต์งาน', 'ค่าขนส่ง', 'ค่าทำความสะอาด', 'ประกันภัยงาน', 'เบ็ดเตล็ดอื่นๆ']
  };

  // expose early
  window.KINDS = KINDS;
  window.EXPENSE_KINDS = EXPENSE_KINDS;
  window.ALL_KINDS = ALL_KINDS;
  window.DEFAULT_CATS = DEFAULT_CATS;
  window.formatBaht = formatBaht;
  window.formatDate = formatDate;
  window.formatDateLong = formatDateLong;
  window.uid = uid;
  window.genId = genId;
  window.formatNumberInput = formatNumberInput;
  window.parseNumberInput = parseNumberInput;

  // Category helpers: support both legacy string[] and {name, costPrice}[] formats
  function catName(c)  { return typeof c === 'string' ? c : (c && c.name) || ''; }
  function catCost(c)  { return typeof c === 'string' ? 0  : Number((c && c.costPrice) || 0); }
  function catNames(list) { return (list || []).map(catName); }
  function findCat(list, name) {
    return (list || []).find(function(c) { return catName(c) === name; });
  }
  window.catName = catName;
  window.catCost = catCost;
  window.catNames = catNames;
  window.findCat = findCat;
})();
