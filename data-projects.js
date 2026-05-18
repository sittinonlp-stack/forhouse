/* FOR HOUSE — Sample projects + transactions
   ============================================================ */
(function () {
  'use strict';

  var KINDS = window.KINDS;
  var DEFAULT_CATS = window.DEFAULT_CATS;
  var uid = window.uid;

  // Helper to build a transaction
  function tx(kind, date, cat, desc, amount, opts) {
    opts = opts || {};
    return {
      id: uid('tx'),
      kind: kind,
      date: date,
      category: cat,
      description: desc,
      amount: amount,
      vat: opts.vat === undefined ? false : !!opts.vat,
      withholding: opts.withholding === undefined ? 0 : opts.withholding,
      attachment: opts.attachment || null,
      vendor: opts.vendor || ''
    };
  }

  // ============== PROJECT 1: บ้านพักอาศัย 2 ชั้น คุณสมชาย ==============
  var P1 = {
    id: 'p1',
    code: 'FH-2025-001',
    name: 'บ้านพักอาศัย 2 ชั้น คุณสมชาย',
    location: 'ต.บางพลีใหญ่ จ.สมุทรปราการ',
    client: 'คุณสมชาย ธนกุลวงศ์',
    contractValue: 4500000,
    startDate: '2025-08-15',
    endDate: '2026-04-30',
    status: 'progress',
    progress: 0.62,
    budgets: {
      material: 1800000, labor: 720000, subcontract: 950000,
      machine: 220000, other: 180000
    },
    categories: JSON.parse(JSON.stringify(DEFAULT_CATS)),
    transactions: [
      // รายรับ
      tx('income', '2025-08-20', 'ค่ามัดจำ', 'รับค่ามัดจำ 10% ตามสัญญา', 450000, {vendor: 'คุณสมชาย ธนกุลวงศ์', attachment: 'invoice-001.pdf'}),
      tx('income', '2025-09-30', 'งวดที่ 1 - เริ่มงาน', 'งวดที่ 1: ตอกเสาเข็ม + ฐานราก', 675000, {vendor: 'คุณสมชาย ธนกุลวงศ์', attachment: 'invoice-002.pdf'}),
      tx('income', '2025-11-15', 'งวดที่ 2 - งานโครงสร้าง', 'งวดที่ 2: เทคาน-เสา ชั้น 1', 900000, {vendor: 'คุณสมชาย ธนกุลวงศ์', attachment: 'invoice-003.pdf'}),
      tx('income', '2026-01-10', 'งวดที่ 3 - งานสถาปัตย์', 'งวดที่ 3: ผนัง-หลังคา', 1125000, {vendor: 'คุณสมชาย ธนกุลวงศ์', attachment: 'invoice-004.pdf'}),
      tx('income', '2026-03-05', 'งวดที่ 4 - งานระบบ', 'งวดที่ 4: ระบบไฟฟ้า-ประปา + ฉาบ', 675000, {vendor: 'คุณสมชาย ธนกุลวงศ์'}),

      // วัสดุ
      tx('material', '2025-08-25', 'ปูน-ทราย-หิน', 'ปูน TPI 50ถุง + ทรายหยาบ 4คิว', 18500, {vat: true, vendor: 'ร้านวัสดุก่อสร้างศรีสยาม', attachment: 'r-1023.jpg'}),
      tx('material', '2025-09-02', 'เหล็กเส้น/เหล็กรูปพรรณ', 'เหล็ก DB12 2.5ตัน + RB9 0.8ตัน', 158000, {vat: true, vendor: 'บ.เหล็กไทยรุ่งเรือง'}),
      tx('material', '2025-09-10', 'ไม้แบบ/นั่งร้าน', 'ไม้แบบ 30 แผ่น + ตะปู', 24500, {vendor: 'ร้านวัสดุก่อสร้างศรีสยาม', attachment: 'r-1041.jpg'}),
      tx('material', '2025-09-22', 'ปูน-ทราย-หิน', 'ปูน TPI 80ถุง + หิน1 6คิว', 32200, {vat: true, vendor: 'ร้านวัสดุก่อสร้างศรีสยาม'}),
      tx('material', '2025-10-15', 'เหล็กเส้น/เหล็กรูปพรรณ', 'เหล็กกล่อง+เหล็กฉาก งานหลังคา', 89200, {vat: true, vendor: 'บ.เหล็กไทยรุ่งเรือง', attachment: 'r-2031.pdf'}),
      tx('material', '2025-11-02', 'อิฐ/บล็อก', 'อิฐมอญ 12,000 ก้อน + อิฐมวลเบา 800 ก้อน', 62400, {vat: true, vendor: 'ร้านวัสดุดีเด็ด'}),
      tx('material', '2025-12-08', 'หลังคา', 'กระเบื้อง CPAC โมเนีย + อุปกรณ์ครอบ', 142800, {vat: true, vendor: 'CPAC Roof Center', attachment: 'r-3021.pdf'}),
      tx('material', '2026-01-20', 'ระบบไฟฟ้า', 'สายไฟ NYY + เบรกเกอร์ Schneider', 76500, {vat: true, vendor: 'ไฟฟ้ารุ่งเจริญ'}),
      tx('material', '2026-02-04', 'ระบบประปา', 'ท่อ PVC + ฟิตติ้ง + แท็งก์น้ำ 1,000L', 52300, {vat: true, vendor: 'ไทยพีพี'}),
      tx('material', '2026-02-18', 'สีและอุปกรณ์ทาสี', 'สี TOA SuperShield 80ลิตร + แปรง-ลูกกลิ้ง', 36800, {vat: true, vendor: 'ร้านสีอุดมโชค', attachment: 'r-4012.jpg'}),
      tx('material', '2026-03-02', 'กระเบื้อง/สุขภัณฑ์', 'กระเบื้องห้องน้ำ + สุขภัณฑ์ COTTO', 184500, {vat: true, vendor: 'Boonthavorn', attachment: 'r-5001.pdf'}),

      // แรงงาน
      tx('labor', '2025-08-31', 'หัวหน้างาน', 'ค่าแรงหัวหน้าทีม สิงหาคม', 22000, {vendor: 'ช่างสมพร'}),
      tx('labor', '2025-09-30', 'ช่างปูน', 'ค่าแรงทีมปูน-โครงสร้าง กันยายน', 68000, {vendor: 'ทีมช่างสมพร'}),
      tx('labor', '2025-09-30', 'กรรมกรทั่วไป', 'ค่าแรงกรรมกร 4 คน กันยายน', 32000, {vendor: 'ทีมช่างสมพร'}),
      tx('labor', '2025-10-31', 'ช่างปูน', 'ค่าแรงทีมปูน ตุลาคม', 72000, {vendor: 'ทีมช่างสมพร'}),
      tx('labor', '2025-11-30', 'ช่างปูน', 'ค่าแรงทีมปูน พฤศจิกายน', 65000, {vendor: 'ทีมช่างสมพร'}),
      tx('labor', '2025-11-30', 'หัวหน้างาน', 'ค่าแรงหัวหน้าทีม พฤศจิกายน', 22000, {vendor: 'ช่างสมพร'}),
      tx('labor', '2025-12-31', 'ช่างปูน', 'ค่าแรงทีมปูน-ฉาบ ธันวาคม', 78000, {vendor: 'ทีมช่างสมพร'}),
      tx('labor', '2026-01-31', 'ช่างไฟ', 'ค่าแรงช่างไฟ มกราคม', 38000, {vendor: 'ทีมช่างไฟ บุญมี'}),
      tx('labor', '2026-01-31', 'ช่างประปา', 'ค่าแรงช่างประปา มกราคม', 32000, {vendor: 'ทีมช่างประปา'}),
      tx('labor', '2026-02-28', 'OT - ทำงานล่วงเวลา', 'OT เร่งงานสถาปัตย์ กุมภา', 18000, {vendor: 'ทีมช่างสมพร'}),
      tx('labor', '2026-02-28', 'ช่างทาสี', 'ค่าแรงทีมสี กุมภา', 42000, {vendor: 'ทีมช่างสี ประยูร'}),

      // รับเหมาช่วง
      tx('subcontract', '2025-08-22', 'งานเสาเข็ม', 'ตอกเสาเข็มไอ 22x22 จำนวน 28ต้น', 168000, {vat: true, withholding: 3, vendor: 'หจก.เสาเข็มไทย', attachment: 'sub-001.pdf'}),
      tx('subcontract', '2025-12-15', 'งานหลังคา', 'มุงหลังคา 280 ตร.ม. (เฉพาะค่าแรง)', 84000, {withholding: 3, vendor: 'ทีมช่างหลังคา ประเสริฐ'}),
      tx('subcontract', '2026-02-10', 'งานฉาบ-ทาสี', 'ฉาบผนังภายใน-ภายนอก 480 ตร.ม.', 96000, {withholding: 3, vendor: 'ทีมช่างสี ประยูร'}),
      tx('subcontract', '2026-03-08', 'งานติดตั้งประตูหน้าต่าง', 'ติดตั้งประตู+หน้าต่างอลูมิเนียม', 145000, {vat: true, withholding: 3, vendor: 'หจก.อลูมิเนียมไทย', attachment: 'sub-008.pdf'}),

      // เครื่องจักร
      tx('machine', '2025-08-22', 'ค่าเช่ารถบรรทุก', 'รถบรรทุกขนวัสดุ 3 วัน', 9000, {vendor: 'รถบรรทุกบุญมา'}),
      tx('machine', '2025-09-08', 'ค่าเช่ารถผสมปูน', 'เช่ารถผสมปูน 5 วัน', 12500, {vendor: 'รถผสมศรีไทย'}),
      tx('machine', '2025-11-12', 'ค่าน้ำมัน-เชื้อเพลิง', 'น้ำมันเครื่องจักรไซต์ พ.ย.', 6800, {vendor: 'ปั๊ม ปตท.'}),
      tx('machine', '2026-01-15', 'ค่าเช่านั่งร้าน', 'นั่งร้านงานหลังคา 2 เดือน', 24000, {vendor: 'นั่งร้านเช่าเจริญ'}),

      // อื่นๆ
      tx('other', '2025-08-12', 'ค่าขออนุญาตก่อสร้าง', 'ค่าขออนุญาตก่อสร้าง + แบบ', 28000, {vendor: 'อบต.บางพลีใหญ่'}),
      tx('other', '2025-08-18', 'ค่าน้ำ-ไฟไซต์งาน', 'ติดตั้งมิเตอร์ไฟชั่วคราว', 8500, {vendor: 'การไฟฟ้าฯ'}),
      tx('other', '2025-10-05', 'ค่าทำแบบ-วิศวกร', 'ค่าวิศวกรเซ็นแบบ', 25000, {withholding: 3, vendor: 'วศก.อภิชาติ'}),
      tx('other', '2026-02-20', 'ค่าทำความสะอาด', 'ค่าเก็บขยะก่อสร้างรอบที่ 2', 4500, {vendor: 'จ้างเหมาทั่วไป'})
    ]
  };

  // ============== PROJECT 2: ทาวน์โฮม โครงการสวนหลวง 8 ยูนิต ==============
  var P2 = {
    id: 'p2',
    code: 'FH-2025-002',
    name: 'ทาวน์โฮม โครงการสวนหลวง 8 ยูนิต',
    location: 'ถ.พระราม 9 กรุงเทพฯ',
    client: 'บจก. สวนหลวง พร็อพเพอร์ตี้',
    contractValue: 18000000,
    startDate: '2025-06-01',
    endDate: '2026-08-31',
    status: 'progress',
    progress: 0.48,
    budgets: {
      material: 7500000, labor: 2800000, subcontract: 4200000,
      machine: 950000, other: 650000
    },
    categories: JSON.parse(JSON.stringify(DEFAULT_CATS)),
    transactions: [
      // รายรับ
      tx('income', '2025-06-10', 'ค่ามัดจำ', 'มัดจำ 10% ตามสัญญา', 1800000, {vendor: 'บจก. สวนหลวง พร็อพเพอร์ตี้', attachment: 'inv-2-001.pdf'}),
      tx('income', '2025-07-30', 'งวดที่ 1 - เริ่มงาน', 'งวด 1: ปรับพื้นที่+เสาเข็ม 8 ยูนิต', 2700000, {vendor: 'บจก. สวนหลวง พร็อพเพอร์ตี้'}),
      tx('income', '2025-10-15', 'งวดที่ 2 - งานโครงสร้าง', 'งวด 2: โครงสร้างชั้น 1 ครบ 8 ยูนิต', 3600000, {vendor: 'บจก. สวนหลวง พร็อพเพอร์ตี้'}),
      tx('income', '2026-01-25', 'งวดที่ 3 - งานสถาปัตย์', 'งวด 3: โครงสร้าง+ผนัง', 2700000, {vendor: 'บจก. สวนหลวง พร็อพเพอร์ตี้', attachment: 'inv-2-004.pdf'}),

      // วัสดุ
      tx('material', '2025-06-15', 'ปูน-ทราย-หิน', 'ปูนผสมเสร็จ 120 คิว งวดแรก', 384000, {vat: true, vendor: 'CPAC คอนกรีต', attachment: 'cpac-001.pdf'}),
      tx('material', '2025-07-08', 'เหล็กเส้น/เหล็กรูปพรรณ', 'เหล็ก DB16 12ตัน + RB ครบเซต', 612000, {vat: true, vendor: 'บ.เหล็กไทยรุ่งเรือง'}),
      tx('material', '2025-08-20', 'อิฐ/บล็อก', 'อิฐมวลเบา 8ยูนิต 12,000 ก้อน', 168000, {vat: true, vendor: 'Q-CON'}),
      tx('material', '2025-09-15', 'ปูน-ทราย-หิน', 'ปูนผสมเสร็จ งวด 2', 412000, {vat: true, vendor: 'CPAC คอนกรีต'}),
      tx('material', '2025-10-22', 'หลังคา', 'กระเบื้องลอนคู่ + อุปกรณ์ 8ยูนิต', 285000, {vat: true, vendor: 'CPAC Roof Center'}),
      tx('material', '2025-11-30', 'ระบบไฟฟ้า', 'สายไฟ+อุปกรณ์ไฟฟ้า 8 ยูนิต', 312000, {vat: true, vendor: 'ไฟฟ้ารุ่งเจริญ'}),
      tx('material', '2025-12-15', 'ระบบประปา', 'ท่อ PVC + แท็งก์น้ำ + อุปกรณ์', 198000, {vat: true, vendor: 'ไทยพีพี'}),
      tx('material', '2026-01-10', 'กระเบื้อง/สุขภัณฑ์', 'กระเบื้อง 8 ยูนิต + สุขภัณฑ์', 458000, {vat: true, vendor: 'Boonthavorn'}),
      tx('material', '2026-02-05', 'สีและอุปกรณ์ทาสี', 'สี TOA งวดแรก 8 ยูนิต', 124000, {vat: true, vendor: 'ร้านสีอุดมโชค'}),

      // แรงงาน
      tx('labor', '2025-06-30', 'หัวหน้างาน', 'หัวหน้าโครงการ + โฟร์แมน มิ.ย.', 65000, {vendor: 'ทีมหัวหน้างาน'}),
      tx('labor', '2025-07-31', 'ช่างปูน', 'ทีมปูน 8 คน ก.ค.', 168000, {vendor: 'ทีมช่างปูน'}),
      tx('labor', '2025-08-31', 'ช่างปูน', 'ทีมปูน ส.ค.', 172000, {vendor: 'ทีมช่างปูน'}),
      tx('labor', '2025-09-30', 'ช่างปูน', 'ทีมปูน ก.ย.', 168000, {vendor: 'ทีมช่างปูน'}),
      tx('labor', '2025-09-30', 'กรรมกรทั่วไป', 'กรรมกร 10 คน ก.ย.', 95000, {vendor: 'ทีมกรรมกร'}),
      tx('labor', '2025-10-31', 'ช่างปูน', 'ทีมปูน ต.ค.', 175000, {vendor: 'ทีมช่างปูน'}),
      tx('labor', '2025-11-30', 'ช่างปูน', 'ทีมปูน-ฉาบ พ.ย.', 168000, {vendor: 'ทีมช่างปูน'}),
      tx('labor', '2025-12-31', 'หัวหน้างาน', 'หัวหน้าโครงการ ธ.ค.', 65000, {vendor: 'ทีมหัวหน้างาน'}),
      tx('labor', '2026-01-31', 'ช่างไฟ', 'ทีมช่างไฟ ม.ค.', 112000, {vendor: 'ทีมช่างไฟ'}),
      tx('labor', '2026-02-28', 'ช่างประปา', 'ทีมประปา ก.พ.', 95000, {vendor: 'ทีมช่างประปา'}),

      // รับเหมาช่วง
      tx('subcontract', '2025-06-20', 'งานเสาเข็ม', 'เสาเข็มเจาะ 56 ต้น 8 ยูนิต', 642000, {vat: true, withholding: 3, vendor: 'หจก.เสาเข็มไทย'}),
      tx('subcontract', '2025-10-25', 'งานหลังคา', 'มุงหลังคา 8 ยูนิต', 384000, {withholding: 3, vendor: 'ทีมหลังคาสุพรรณ'}),
      tx('subcontract', '2025-11-15', 'งานฉาบ-ทาสี', 'ฉาบ 8 ยูนิต ภายนอก', 432000, {withholding: 3, vendor: 'ทีมช่างสีสมเกียรติ'}),
      tx('subcontract', '2026-01-08', 'งานระบบไฟฟ้า', 'เดินระบบไฟฟ้า 8 ยูนิต (ค่าแรง)', 296000, {withholding: 3, vendor: 'หจก.ไฟฟ้ารุ่งโรจน์', attachment: 'sub2-008.pdf'}),
      tx('subcontract', '2026-02-15', 'งานติดตั้งประตูหน้าต่าง', 'ติดตั้งอลูมิเนียม 8 ยูนิต', 412000, {vat: true, withholding: 3, vendor: 'หจก.อลูมิเนียมไทย'}),

      // เครื่องจักร
      tx('machine', '2025-06-22', 'ค่าเช่าเครน', 'เครนเสาเข็ม 5 วัน', 75000, {vendor: 'เครนเจริญ'}),
      tx('machine', '2025-07-15', 'ค่าเช่ารถบรรทุก', 'ขนวัสดุ ก.ค.', 28000, {vendor: 'รถบรรทุกบุญมา'}),
      tx('machine', '2025-09-20', 'ค่าเช่ารถผสมปูน', 'รถผสมปูน 18 วัน', 54000, {vendor: 'รถผสมศรีไทย'}),
      tx('machine', '2025-11-10', 'ค่าน้ำมัน-เชื้อเพลิง', 'น้ำมันเครื่องจักร พ.ย.', 18000, {vendor: 'ปั๊ม ปตท.'}),
      tx('machine', '2026-01-12', 'ค่าเช่านั่งร้าน', 'นั่งร้านงานสี-ฉาบ 3 เดือน', 96000, {vendor: 'นั่งร้านเช่าเจริญ'}),

      // อื่นๆ
      tx('other', '2025-05-25', 'ค่าขออนุญาตก่อสร้าง', 'ขออนุญาต+แบบ 8 ยูนิต', 65000, {vendor: 'เขตสวนหลวง'}),
      tx('other', '2025-05-30', 'ค่าทำแบบ-วิศวกร', 'ค่าวิศวกรเซ็นแบบโครงสร้าง', 85000, {withholding: 3, vendor: 'วศก.พิชัย'}),
      tx('other', '2025-06-15', 'ค่าน้ำ-ไฟไซต์งาน', 'ติดตั้งระบบไซต์งาน', 24000, {vendor: 'การไฟฟ้าฯ'}),
      tx('other', '2025-09-30', 'ค่าขนส่ง', 'ค่าขนส่งวัสดุงวด 1-2', 18500, {vendor: 'ขนส่งทั่วไป'}),
      tx('other', '2025-12-15', 'ประกันภัยงาน', 'ประกันงานก่อสร้าง 12 เดือน', 48000, {vat: true, vendor: 'AIG ประเทศไทย'})
    ]
  };

  // ============== PROJECT 3: ต่อเติม-ปรับปรุง ร้านอาหาร The Garden ==============
  var P3 = {
    id: 'p3',
    code: 'FH-2025-003',
    name: 'ต่อเติม-ปรับปรุง ร้านอาหาร The Garden',
    location: 'อ.หัวหิน จ.ประจวบฯ',
    client: 'หจก. เดอะ การ์เด้น เรสเตอรองท์',
    contractValue: 850000,
    startDate: '2025-12-01',
    endDate: '2026-03-15',
    status: 'progress',
    progress: 0.92,
    budgets: {
      material: 320000, labor: 145000, subcontract: 220000,
      machine: 35000, other: 45000
    },
    categories: JSON.parse(JSON.stringify(DEFAULT_CATS)),
    transactions: [
      tx('income', '2025-12-05', 'ค่ามัดจำ', 'รับมัดจำ 30% ตามสัญญา', 255000, {vendor: 'หจก. เดอะ การ์เด้น'}),
      tx('income', '2026-01-20', 'งวดที่ 1 - เริ่มงาน', 'งวด 1: รื้อ-เทพื้น-โครงสร้าง', 297500, {vendor: 'หจก. เดอะ การ์เด้น'}),
      tx('income', '2026-02-25', 'งวดที่ 2 - งานโครงสร้าง', 'งวด 2: หลังคา-ผนัง', 212500, {vendor: 'หจก. เดอะ การ์เด้น'}),

      tx('material', '2025-12-08', 'ปูน-ทราย-หิน', 'ปูนสำเร็จ + หิน-ทราย', 48000, {vat: true, vendor: 'CPAC คอนกรีต'}),
      tx('material', '2025-12-20', 'เหล็กเส้น/เหล็กรูปพรรณ', 'เหล็กกล่อง-เหล็กฉาก', 62500, {vat: true, vendor: 'บ.เหล็กไทยรุ่งเรือง'}),
      tx('material', '2026-01-10', 'หลังคา', 'หลังคาเมทัลชีท + อุปกรณ์', 84000, {vat: true, vendor: 'BlueScope', attachment: 'r-3-101.pdf'}),
      tx('material', '2026-01-25', 'อิฐ/บล็อก', 'อิฐมวลเบา + ปูนก่อ', 28500, {vat: true, vendor: 'ร้านวัสดุดีเด็ด'}),
      tx('material', '2026-02-08', 'สีและอุปกรณ์ทาสี', 'สี Beger + อุปกรณ์', 32500, {vat: true, vendor: 'ร้านสีอุดมโชค'}),
      tx('material', '2026-02-22', 'กระเบื้อง/สุขภัณฑ์', 'กระเบื้อง+สุขภัณฑ์ห้องน้ำ', 58200, {vat: true, vendor: 'Boonthavorn'}),
      tx('material', '2026-03-02', 'ระบบไฟฟ้า', 'โคมไฟ+สายไฟร้านอาหาร', 42800, {vat: true, vendor: 'ไฟฟ้ารุ่งเจริญ'}),

      tx('labor', '2025-12-31', 'หัวหน้างาน', 'หัวหน้าทีม ธ.ค.', 18000, {vendor: 'ช่างวิชัย'}),
      tx('labor', '2026-01-31', 'ช่างปูน', 'ทีมปูน ม.ค.', 38000, {vendor: 'ทีมช่างวิชัย'}),
      tx('labor', '2026-01-31', 'กรรมกรทั่วไป', 'กรรมกร 3 คน ม.ค.', 21000, {vendor: 'ทีมช่างวิชัย'}),
      tx('labor', '2026-02-28', 'ช่างปูน', 'ทีมปูน ก.พ.', 35000, {vendor: 'ทีมช่างวิชัย'}),
      tx('labor', '2026-02-28', 'ช่างทาสี', 'ทีมสี ก.พ.', 24000, {vendor: 'ทีมช่างสี'}),

      tx('subcontract', '2026-01-15', 'งานหลังคา', 'งานติดตั้งหลังคาเมทัลชีท', 65000, {withholding: 3, vendor: 'ทีมช่างหลังคา'}),
      tx('subcontract', '2026-02-12', 'งานฉาบ-ทาสี', 'ฉาบ-ทาสีภายใน-นอก', 78000, {withholding: 3, vendor: 'ทีมช่างสี'}),

      tx('machine', '2025-12-10', 'ค่าเช่ารถบรรทุก', 'ขนวัสดุ ธ.ค.', 6500, {vendor: 'รถบรรทุกในพื้นที่'}),
      tx('machine', '2026-01-18', 'ค่าน้ำมัน-เชื้อเพลิง', 'น้ำมันเครื่องจักร', 3200, {vendor: 'ปั๊ม PT'}),

      tx('other', '2025-11-28', 'ค่าขออนุญาตก่อสร้าง', 'ขออนุญาตต่อเติม', 8500, {vendor: 'เทศบาลหัวหิน'}),
      tx('other', '2025-12-02', 'ค่าน้ำ-ไฟไซต์งาน', 'มิเตอร์ไฟชั่วคราว', 4200, {vendor: 'การไฟฟ้าฯ'}),
      tx('other', '2026-02-18', 'ค่าทำความสะอาด', 'เก็บขยะ-ทำความสะอาด', 6800, {vendor: 'จ้างเหมาท้องถิ่น'})
    ]
  };

  window.SAMPLE_PROJECTS = [P1, P2, P3];

  // ============== Decorate some expense rows with PO workflow + multi-line items ==============
  // This converts existing flat expenses into structured PO records (status='paid' by default unless overridden)
  function makePOItems(t, partsCount) {
    // For demos: split larger expenses into 2-3 line items
    if (partsCount === 1 || t.amount < 30000) {
      return [{
        id: t.id + '_it1',
        category: t.category,
        description: t.description,
        qty: 1,
        unit: t.kind === 'labor' || t.kind === 'subcontract' ? 'งาน' : (t.kind === 'machine' ? 'งาน' : 'รายการ'),
        unitPrice: t.amount,
        amount: t.amount
      }];
    }
    // Two-line split, weighted 60/40
    const a = Math.round(t.amount * 0.62);
    const b = t.amount - a;
    const unitMap = {
      material: ['ถุง', 'ม.', 'แผ่น', 'คิว', 'ก้อน', 'ตัน'],
      labor: ['คน-เดือน', 'วัน', 'งาน'],
      subcontract: ['งาน', 'ตร.ม.', 'จุด'],
      machine: ['วัน', 'เที่ยว', 'งาน'],
      other: ['งาน', 'รายการ']
    };
    const units = unitMap[t.kind] || ['รายการ'];
    return [
      { id: t.id + '_it1', category: t.category, description: t.description, qty: 1, unit: units[0], unitPrice: a, amount: a },
      { id: t.id + '_it2', category: t.category, description: t.description + ' (เพิ่มเติม)', qty: 1, unit: units[1] || units[0], unitPrice: b, amount: b }
    ];
  }

  // Convert all expense transactions to PO-style records
  for (const p of window.SAMPLE_PROJECTS) {
    p.transactions = p.transactions.map((t, i) => {
      if (t.kind === 'income') return t;
      const items = makePOItems(t, t.amount < 30000 ? 1 : 2);
      const subtotal = items.reduce((s, it) => s + it.amount, 0);
      const vatAmount = t.vat ? subtotal * 0.07 : 0;
      const whtAmount = t.withholding > 0 ? subtotal * (t.withholding / 100) : 0;
      return {
        ...t,
        code: 'PO-' + p.code.slice(-3) + '-' + String(i).padStart(3, '0'),
        items,
        subtotal,
        vatAmount,
        whtAmount,
        status: 'paid',
        approvedBy: 'คุณวิชัย รัตนกุล',
        approvedAt: t.date,
        paidAt: t.date,
        paidBy: 'คุณวิชัย รัตนกุล',
        paymentSlip: t.attachment || ('slip-' + t.date.replace(/-/g, '') + '.jpg'),
        createdBy: 'คุณสมชาย ผู้ช่วย',
        createdAt: t.date,
        notes: ''
      };
    });
  }

  // ============== Add a few in-flight POs to each project for workflow demo ==============
  function buildPO(p, opts) {
    const items = opts.items.map((it, i) => ({
      id: uid('it'),
      category: it.category,
      description: it.description,
      qty: it.qty,
      unit: it.unit,
      unitPrice: it.unitPrice,
      amount: it.qty * it.unitPrice
    }));
    const subtotal = items.reduce((s, it) => s + it.amount, 0);
    const vatAmount = opts.vat ? subtotal * 0.07 : 0;
    const whtAmount = opts.withholding > 0 ? subtotal * (opts.withholding / 100) : 0;
    const retentionAmount = opts.retentionAmount || 0;
    const advanceDeduct = opts.advanceDeduct || 0;
    const amount = subtotal + vatAmount - whtAmount - retentionAmount - advanceDeduct;
    return {
      id: uid('po'),
      kind: opts.kind,
      code: opts.code,
      date: opts.date,
      vendor: opts.vendor,
      description: items[0].description,
      category: items[0].category,
      items,
      amount, subtotal,
      vat: !!opts.vat, vatAmount,
      withholding: opts.withholding || 0, whtAmount,
      retentionAmount, advanceDeduct,
      deposit: opts.deposit ? {
        amount: opts.deposit.amount,
        note: opts.deposit.note || '',
        status: opts.deposit.status || 'pending',
        returnedDate: opts.deposit.returnedDate || null,
        returnSlip: opts.deposit.returnSlip || null
      } : null,
      status: opts.status,
      createdBy: 'คุณสมชาย ผู้ช่วย',
      createdAt: opts.date,
      approvedBy: (opts.status === 'approved' || opts.status === 'paid') ? 'คุณวิชัย รัตนกุล' : null,
      approvedAt: (opts.status === 'approved' || opts.status === 'paid') ? opts.date : null,
      paidAt: opts.status === 'paid' ? opts.date : null,
      paymentSlip: opts.status === 'paid' ? 'slip-' + opts.date.replace(/-/g,'') + '.jpg' : null,
      rejectReason: opts.status === 'rejected' ? (opts.rejectReason || 'ขอใบเสนอราคาเพิ่ม') : null,
      notes: opts.notes || ''
    };
  }

  // P1 — บ้านพักอาศัย: workflow demo
  P1.transactions.unshift(
    // PO with deposit (machine rental)
    buildPO(P1, {
      kind: 'machine', code: 'PO-001-095', date: '2026-02-15',
      vendor: 'นั่งร้านเช่าเจริญ', status: 'paid', vat: true,
      notes: 'เช่านั่งร้านงานทาสีภายนอก พร้อมเงินประกัน',
      items: [
        { category: 'ค่าเช่านั่งร้าน', description: 'นั่งร้านเหล็ก H-Frame 1.7ม. สำหรับงานทาสีภายนอก', qty: 30, unit: 'ชุด', unitPrice: 280 }
      ],
      deposit: { amount: 15000, note: 'คืนเมื่อส่งคืนนั่งร้านครบและสภาพปกติ' }
    }),
    // PO with labor retention + advance deduction
    buildPO(P1, {
      kind: 'subcontract', code: 'PO-001-102', date: '2026-03-15',
      vendor: 'ทีมช่างสี ประยูร', status: 'approved', withholding: 3,
      retentionAmount: 9600, advanceDeduct: 20000,
      notes: 'งานสีภายในและภายนอกบ้าน — หักประกันผลงาน 10% + หักเงินเบิกล่วงหน้าที่เคยให้',
      items: [
        { category: 'งานฉาบ-ทาสี', description: 'ทาสีภายในบ้าน 380 ตร.ม.', qty: 380, unit: 'ตร.ม.', unitPrice: 180 },
        { category: 'งานฉาบ-ทาสี', description: 'ทาสีภายนอก 280 ตร.ม.', qty: 280, unit: 'ตร.ม.', unitPrice: 220 }
      ]
    }),
    // Past PO with advance (เพื่อ history)
    buildPO(P1, {
      kind: 'subcontract', code: 'PO-001-088', date: '2026-02-20',
      vendor: 'ทีมช่างสี ประยูร', status: 'paid',
      notes: 'เบิกล่วงหน้าสำหรับซื้อสีและอุปกรณ์',
      items: [
        { category: 'งานฉาบ-ทาสี', description: 'เบิกล่วงหน้า — ซื้อสีและอุปกรณ์เตรียมงาน', qty: 1, unit: 'งาน', unitPrice: 20000 }
      ]
    }),
    buildPO(P1, {
      kind: 'material', code: 'PO-001-101', date: '2026-03-12',
      vendor: 'Boonthavorn สาขาบางพลี', status: 'pending', vat: true,
      notes: 'งานตกแต่งภายในชั้น 2 — ขอเร่งภายในสัปดาห์',
      items: [
        { category: 'กระเบื้อง/สุขภัณฑ์', description: 'กระเบื้องห้องน้ำ Master 30x60 ลาย Carrara White', qty: 28, unit: 'ตร.ม.', unitPrice: 850 },
        { category: 'กระเบื้อง/สุขภัณฑ์', description: 'สุขภัณฑ์ห้องน้ำ COTTO C13070 + อ่างล้างหน้า + ก๊อกผสมน้ำ', qty: 2, unit: 'ชุด', unitPrice: 18500 },
        { category: 'สีและอุปกรณ์ทาสี', description: 'สี TOA SuperShield ภายนอก สีครีม 18 ลิตร', qty: 4, unit: 'ถัง', unitPrice: 4250 }
      ]
    }),
    buildPO(P1, {
      kind: 'material', code: 'PO-001-103', date: '2026-03-18',
      vendor: 'ร้านวัสดุก่อสร้างศรีสยาม', status: 'draft', vat: true,
      notes: 'รออัปเดตจำนวนจากหน้างาน',
      items: [
        { category: 'อุปกรณ์เบ็ดเตล็ด', description: 'อุปกรณ์ติดตั้งเบ็ดเตล็ด งานเก็บงานสุดท้าย', qty: 1, unit: 'งาน', unitPrice: 24500 }
      ]
    }),
    buildPO(P1, {
      kind: 'machine', code: 'PO-001-099', date: '2026-02-25',
      vendor: 'นั่งร้านเช่าเจริญ', status: 'rejected',
      rejectReason: 'ราคาสูงกว่าตลาด ขอเทียบราคาอย่างน้อย 3 ราย',
      notes: 'ขอเช่าต่อ 1 เดือน',
      items: [
        { category: 'ค่าเช่านั่งร้าน', description: 'นั่งร้านงานสี 1 เดือน (ต่ออายุ)', qty: 1, unit: 'เดือน', unitPrice: 16000 }
      ]
    })
  );

  // P2 — ทาวน์โฮม: workflow demo
  P2.transactions.unshift(
    // Material PO with deposit (returned)
    buildPO(P2, {
      kind: 'material', code: 'PO-002-180', date: '2025-09-05',
      vendor: 'CPAC คอนกรีต — สาขาบางนา', status: 'paid', vat: true,
      notes: 'สั่งซื้อรถผสมปูนเฉพาะกิจ + เงินมัดจำคืนแล้ว',
      items: [
        { category: 'ปูน-ทราย-หิน', description: 'ปูนผสมเสร็จ Strength 240 เทคาน ชั้น 2', qty: 28, unit: 'คิว', unitPrice: 3200 }
      ],
      deposit: {
        amount: 25000, note: 'มัดจำเครื่องผสม — คืนเมื่อจบงาน',
        status: 'returned',
        returnedDate: '2025-11-12',
        returnSlip: 'deposit-return-20251112.jpg'
      }
    }),
    // Material PO with deposit (still pending — เงินค้างรับ)
    buildPO(P2, {
      kind: 'machine', code: 'PO-002-195', date: '2026-01-08',
      vendor: 'เครนเจริญ', status: 'paid', vat: true,
      notes: 'เช่าเครน 1 เดือนสำหรับงานหลังคา',
      items: [
        { category: 'ค่าเช่าเครน', description: 'เครน 25 ตัน เช่ารายเดือน', qty: 1, unit: 'เดือน', unitPrice: 95000 }
      ],
      deposit: { amount: 50000, note: 'เงินประกันความเสียหาย — คืนเมื่อส่งคืนเครนสภาพปกติ' }
    }),
    buildPO(P2, {
      kind: 'material', code: 'PO-002-201', date: '2026-03-10',
      vendor: 'Boonthavorn สาขาเมกาบางนา', status: 'pending', vat: true,
      notes: 'งวด 4 — งานตกแต่ง 8 ยูนิต',
      items: [
        { category: 'กระเบื้อง/สุขภัณฑ์', description: 'กระเบื้องห้องน้ำ 8 ยูนิต', qty: 168, unit: 'ตร.ม.', unitPrice: 720 },
        { category: 'กระเบื้อง/สุขภัณฑ์', description: 'สุขภัณฑ์ COTTO ยูนิตละ 2 ห้อง', qty: 16, unit: 'ชุด', unitPrice: 12500 },
        { category: 'สีและอุปกรณ์ทาสี', description: 'สี TOA งวดสอง 8 ยูนิต', qty: 32, unit: 'ถัง 18L', unitPrice: 4250 },
        { category: 'ระบบประปา', description: 'อ่างล้างหน้า + ก๊อก ครบเซต', qty: 16, unit: 'ชุด', unitPrice: 3800 }
      ]
    }),
    buildPO(P2, {
      kind: 'subcontract', code: 'PO-002-202', date: '2026-03-08',
      vendor: 'หจก. ตกแต่งภายในกรุงเทพ', status: 'approved', vat: true, withholding: 3,
      notes: 'งานบิวท์อิน 8 ยูนิต',
      items: [
        { category: 'งานติดตั้งประตูหน้าต่าง', description: 'ติดตั้งประตู-หน้าต่างไม้ 8 ยูนิต', qty: 8, unit: 'ยูนิต', unitPrice: 38000 },
        { category: 'งานติดตั้งประตูหน้าต่าง', description: 'ครัวบิวท์อินสำเร็จรูป 8 ยูนิต', qty: 8, unit: 'ชุด', unitPrice: 45000 }
      ]
    }),
    buildPO(P2, {
      kind: 'labor', code: 'PO-002-203', date: '2026-03-20',
      vendor: 'ทีมช่างสี สมเกียรติ', status: 'draft',
      notes: 'รอตรวจหน้างานก่อนสรุปจำนวน',
      items: [
        { category: 'ช่างทาสี', description: 'ค่าแรงทีมสี งวด มี.ค.', qty: 6, unit: 'คน-เดือน', unitPrice: 14000 },
        { category: 'OT - ทำงานล่วงเวลา', description: 'OT เร่งงานส่งมอบ', qty: 1, unit: 'งาน', unitPrice: 25000 }
      ]
    })
  );

  // P3 — ร้านอาหาร: workflow demo
  P3.transactions.unshift(
    buildPO(P3, {
      kind: 'material', code: 'PO-003-301', date: '2026-03-08',
      vendor: 'ร้านสีอุดมโชค', status: 'pending', vat: true,
      notes: 'งานสีเพิ่มเติมส่งมอบ',
      items: [
        { category: 'สีและอุปกรณ์ทาสี', description: 'สี Beger Top Coat สีพิเศษ', qty: 4, unit: 'ถัง', unitPrice: 3200 },
        { category: 'สีและอุปกรณ์ทาสี', description: 'อุปกรณ์ทาสี + ลูกกลิ้ง', qty: 1, unit: 'งาน', unitPrice: 4500 }
      ]
    }),
    buildPO(P3, {
      kind: 'other', code: 'PO-003-302', date: '2026-03-10',
      vendor: 'บริษัท คลีนนิ่ง โปร', status: 'approved', vat: true,
      notes: 'ทำความสะอาดก่อนส่งมอบงาน',
      items: [
        { category: 'ค่าทำความสะอาด', description: 'Big Cleaning ก่อนเปิดร้าน', qty: 1, unit: 'งาน', unitPrice: 12500 }
      ]
    })
  );

  // ============== Per-project team members + roles ==============
  P1.members = [
    { id: 'u1', name: 'คุณวิชัย รัตนกุล',    role: 'executive', addedAt: '2025-08-15', note: 'ผู้บริหาร — ดูงบดุลโครงการได้' },
    { id: 'u2', name: 'คุณสมชาย ผู้ช่วย',   role: 'manager',   addedAt: '2025-08-15', note: 'ผู้จัดการโครงการ — อนุมัติใบ PO' },
    { id: 'u3', name: 'คุณประยูร ช่างสี',  role: 'staff',     addedAt: '2025-10-01', note: 'หัวหน้าทีมงานสี' },
    { id: 'u4', name: 'คุณสมพร ช่างปูน',   role: 'staff',     addedAt: '2025-08-20', note: 'หัวหน้าทีมก่อสร้าง' }
  ];
  P2.members = [
    { id: 'u1', name: 'คุณวิชัย รัตนกุล',    role: 'executive', addedAt: '2025-06-01', note: 'ผู้บริหาร' },
    { id: 'u5', name: 'คุณนิรันดร์ ผจก.',  role: 'manager',   addedAt: '2025-06-01', note: 'ผจก.โครงการทาวน์โฮม' },
    { id: 'u6', name: 'คุณอภิชาติ วิศวกร', role: 'manager',   addedAt: '2025-06-15', note: 'วิศวกรควบคุมงาน' },
    { id: 'u2', name: 'คุณสมชาย ผู้ช่วย',   role: 'staff',     addedAt: '2025-07-10', note: 'ผู้ช่วยประสานงาน' }
  ];
  P3.members = [
    { id: 'u1', name: 'คุณวิชัย รัตนกุล',    role: 'executive', addedAt: '2025-12-01', note: 'ผู้บริหาร' },
    { id: 'u7', name: 'คุณสุภาพร เจ้าของ', role: 'manager',   addedAt: '2025-12-01', note: 'เจ้าของกิจการ ร่วมตัดสินใจ' },
    { id: 'u3', name: 'คุณประยูร ช่างสี',  role: 'staff',     addedAt: '2026-02-08', note: 'หัวหน้าทีมตกแต่ง' }
  ];

  // ============== Income Plan: planned milestones with due dates ==============
  // มัดจำ + 4 งวด (ตามมูลค่าสัญญา P1: 4,500,000)
  P1.incomePlan = [
    { id: 'ip1-1', label: 'ค่ามัดจำ',                 dueDate: '2025-08-20', plannedAmount: 450000,  note: 'มัดจำ 10% ตามสัญญา' },
    { id: 'ip1-2', label: 'งวดที่ 1 - เริ่มงาน',      dueDate: '2025-09-30', plannedAmount: 675000,  note: 'ตอกเสาเข็ม + ฐานราก' },
    { id: 'ip1-3', label: 'งวดที่ 2 - งานโครงสร้าง',  dueDate: '2025-11-15', plannedAmount: 900000,  note: 'เทคาน-เสา ชั้น 1' },
    { id: 'ip1-4', label: 'งวดที่ 3 - งานสถาปัตย์',   dueDate: '2026-01-10', plannedAmount: 1125000, note: 'ผนัง-หลังคา' },
    { id: 'ip1-5', label: 'งวดที่ 4 - งานระบบ',       dueDate: '2026-03-05', plannedAmount: 675000,  note: 'ระบบไฟฟ้า-ประปา + ฉาบ' },
    { id: 'ip1-6', label: 'งวดสุดท้าย - ส่งมอบงาน',  dueDate: '2026-04-30', plannedAmount: 675000,  note: 'งวดส่งมอบ' }
  ];
  // P2: 18M, milestones approx
  P2.incomePlan = [
    { id: 'ip2-1', label: 'ค่ามัดจำ',                 dueDate: '2025-06-10', plannedAmount: 1800000, note: 'มัดจำ 10%' },
    { id: 'ip2-2', label: 'งวดที่ 1 - เริ่มงาน',      dueDate: '2025-07-30', plannedAmount: 2700000, note: 'ปรับพื้นที่ + เสาเข็ม 8 ยูนิต' },
    { id: 'ip2-3', label: 'งวดที่ 2 - งานโครงสร้าง',  dueDate: '2025-10-15', plannedAmount: 3600000, note: 'โครงสร้างชั้น 1 ครบ' },
    { id: 'ip2-4', label: 'งวดที่ 3 - งานสถาปัตย์',   dueDate: '2026-01-25', plannedAmount: 2700000, note: 'โครงสร้าง + ผนัง' },
    { id: 'ip2-5', label: 'งวดที่ 4 - งานระบบ',       dueDate: '2026-04-20', plannedAmount: 3600000, note: 'งานระบบ 8 ยูนิต' },
    { id: 'ip2-6', label: 'งวดที่ 5 - ตกแต่ง',        dueDate: '2026-06-30', plannedAmount: 2700000, note: 'งานตกแต่ง' },
    { id: 'ip2-7', label: 'งวดสุดท้าย - ส่งมอบ',     dueDate: '2026-08-31', plannedAmount: 900000,  note: 'ส่งมอบงาน 8 ยูนิต' }
  ];
  // P3: 850K
  P3.incomePlan = [
    { id: 'ip3-1', label: 'ค่ามัดจำ',                 dueDate: '2025-12-05', plannedAmount: 255000,  note: 'มัดจำ 30%' },
    { id: 'ip3-2', label: 'งวดที่ 1 - เริ่มงาน',      dueDate: '2026-01-20', plannedAmount: 297500,  note: 'รื้อ-เทพื้น-โครงสร้าง' },
    { id: 'ip3-3', label: 'งวดที่ 2 - งานโครงสร้าง',  dueDate: '2026-02-25', plannedAmount: 212500,  note: 'หลังคา-ผนัง' },
    { id: 'ip3-4', label: 'งวดสุดท้าย - ส่งมอบ',     dueDate: '2026-03-15', plannedAmount: 85000,   note: 'ส่งมอบงาน' }
  ];
})();
