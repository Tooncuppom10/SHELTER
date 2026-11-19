import './env.mjs';
const e = process.env;
const pad = (n) => String(n).padStart(2, '0');
const now = new Date();

export const RUN_ID = e.RUN_ID || `${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;

export const cfg = {
  user: e.SHELTER_USER || 'superadmin',
  pass: e.SHELTER_PASS || '',
  province: e.PROVINCE || 'สมุทรสาคร',
  district: e.DISTRICT || 'เมืองสมุทรสาคร',
  district2: e.DISTRICT_2 || 'บ้านแพ้ว',
  aor: e.AOR || 'เทศบาลนครสมุทรสาคร',
  shelterCode: e.SHELTER_CODE || 'SH95000108',
  shelterName: e.SHELTER_NAME || 'ศูนย์พักพิงเกณฑ์ B 20 Field',
  runAc6: e.RUN_AC6 === '1',
  rolePass: e.ROLE_PASS || '',
  roles: {
    'ส่วนกลาง': e.USER_CENTRAL || '',
    'จังหวัด': e.USER_PROVINCE || '',
    'อำเภอ': e.USER_DISTRICT || '',
    'ตำบล': e.USER_SUBDISTRICT || '',
  },
  noPermissionUser: e.USER_NO_PERMISSION || '',
};

// ข้อมูลทดสอบ: ชื่อมีรหัสรอบรันเพื่อค้นหา/ลบทีหลัง
export const data = {
  reportName: `ทดสอบอัตโนมัติ SHEL-714 รอบ ${RUN_ID}`,
  manualPlace: `ศาลาประชาคมบ้านหนองแวง ทดสอบ ${RUN_ID}`,
  row1: { coordPos: 'ปลัดอำเภอ', need: 'น้ำดื่ม', needQty: '200',
          people: { male: '10', female: '12', elderly: '2', child: '3', disabled: '1', bedridden: '1', pregnant: '1' } },
  row2: { capacity: '80', coordName: 'สมชาย ศรีสุข', coordPos: 'ปลัดอำเภอ', coordPhone: '0812345678' },
  edit: { need: 'ข้าวสาร', male: '5' },
};

// ข้อความแจ้งเตือนที่เห็นจริงบน UAT v1.0.0-rc.25 (19 พ.ย. 2569)
export const MSG = {
  summary: 'กรุณาตรวจสอบและแก้ไขข้อมูลที่ไม่ครบถ้วนก่อนบันทึก',
  province: 'กรุณาเลือกจังหวัด',
  place: 'กรุณาระบุสถานที่ตั้งศูนย์พักพิง',
  district: 'กรุณาเลือกอำเภอ',
  capacity: 'กรุณาระบุจำนวนที่รองรับ',
  coordName: 'กรุณาระบุชื่อ-สกุลผู้ประสานงาน',
  coordPos: 'กรุณาระบุตำแหน่งผู้ประสานงาน',
  coordPhone: 'กรุณาระบุหมายเลขโทรศัพท์ผู้ประสานงาน',
  status: 'กรุณาเลือกสถานะ',
  openDate: 'กรุณาเลือกวันที่เปิดศูนย์',
};
