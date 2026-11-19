# SHEL-714 Regression (Playwright)

สคริปต์ทดสอบซ้ำหน้า "รายงานข้อมูลศูนย์พักพิงเบื้องต้น" ของระบบ Shelter (UAT) สร้างจากผลทดสอบจริงวันที่ 19 พ.ย. 2569 (v1.0.0-rc.25)
รายการเคสทั้งหมดอยู่ที่ `tests/cases/README.md`

## ติดตั้งครั้งแรก (Mac / Terminal)
```bash
cd shel714-regression
npm install
npx playwright install chromium
cp .env.example .env      # แล้วเปิด .env ใส่ SHELTER_PASS
```

## รัน
| ต้องการ | คำสั่ง |
|---|---|
| ชุดที่ไม่สร้างข้อมูล (แนะนำรันก่อน) | `npm run test:safe` |
| ทั้งหมด (สร้างรายงาน 1 ฉบับ) | `npx playwright test` |
| เคสเดียว | `npx playwright test -g "TC-07"` |
| ช่วงสร้าง/แก้ไข | `npx playwright test -g "TC-1[0-6]"` |
| รวม AC6 (แก้ศูนย์จริงแล้วคืนค่า) | `RUN_AC6=1 npx playwright test -g "TC-17"` |
| ไม่เปิดหน้าต่าง / ช้าลงให้ดู | `HEADLESS=1 npx playwright test` / `SLOW=300 npx playwright test` |
| ดูรายงานผล | `npm run report` |

Windows (PowerShell): `$env:RUN_AC6=1; npx playwright test -g "TC-17"`

## ถ้าพัง ส่งกลับมา
1. ข้อความใน Terminal ทั้งหมด
2. โฟลเดอร์ `test-results/` (มีภาพหน้าจอ + trace ของเคสที่พัง เปิดดูด้วย `npx playwright show-trace <ไฟล์ trace.zip>`)

## หมายเหตุ
- รหัสผ่านอยู่ใน `.env` เท่านั้น ห้าม commit (`.gitignore` กันไว้แล้ว รวมถึง `auth/` ที่เก็บ session)
- ถ้า login หลุด ลบโฟลเดอร์ `auth/` แล้วรันใหม่
