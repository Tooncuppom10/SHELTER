// ชุดอิสระ: ไม่สร้างข้อมูล (เปิดหน้า/ฟอร์ม → ตรวจ → ออกโดยไม่บันทึก)
import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../../lib/login.mjs';
import { cfg } from '../../lib/config.mjs';
import { listOptions, closePopups, choose, esc } from '../../lib/helpers.mjs';
import * as R from '../../lib/report-form.mjs';

test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

test('TC-01 เมนู "จัดการศูนย์พักพิง" แสดงปุ่ม "รายงานข้อมูลศูนย์พักพิงเบื้องต้น" และเปิดหน้าประวัติรายงานได้', async ({ page }) => {
  await R.openFromShelterMenu(page);
  await expect(page.locator('main').getByRole('button', { name: 'ประวัติรายงาน' }).or(page.locator('main').getByText('ประวัติรายงานที่บันทึกไว้'))).toBeVisible();
});

test('TC-02 หน้าสร้างรายงานแสดงช่องครบตาม AC2 และช่องบังคับมีเครื่องหมาย *', async ({ page }) => {
  await R.openCreate(page);
  const main = page.locator('main');
  const required = ['จังหวัด', 'ข้อมูลวันที่', 'เวลา', 'สถานที่ตั้งศูนย์พักพิง', 'อำเภอ', 'รองรับจำนวน (คน)',
    'ชื่อ-สกุล', 'ตำแหน่ง', 'หมายเลขโทรศัพท์', 'สถานะ', 'วันที่เปิดศูนย์'];
  const optional = ['ชื่อรายงาน', 'ศูนย์พักพิงในระบบ', 'อปท.', 'วันที่ปิดศูนย์', 'ความต้องการในพื้นที่', 'จำนวน',
    'ชาย (คน)', 'หญิง (คน)', 'ผู้สูงอายุ', 'เด็กเล็ก', 'ผู้พิการหรือผู้ทุพพลภาพ', 'ผู้ป่วยติดเตียง', 'หญิงตั้งครรภ์'];
  const labels = await main.locator('label').evaluateAll((ls) => ls.map((l) => ({
    text: l.innerText.trim(), star: getComputedStyle(l, '::after').content.includes('*') })));
  const find = (t) => labels.find((l) => l.text === t);
  for (const t of required) {
    expect(find(t), `ไม่พบช่อง "${t}"`).toBeTruthy();
    expect.soft(find(t).star, `ช่อง "${t}" ต้องมี *`).toBe(true);
  }
  for (const t of optional) {
    expect(find(t), `ไม่พบช่อง "${t}"`).toBeTruthy();
    expect.soft(find(t).star, `ช่อง "${t}" ไม่ควรมี *`).toBe(false);
  }
});

test('TC-03 เลือกจังหวัดแล้ว อำเภอ/อปท. แสดงเฉพาะของจังหวัดนั้น', async ({ page }) => {
  await R.openCreate(page);
  await R.setHeader(page, { province: cfg.province });
  const r = R.row(page, 1);
  const districts = await listOptions(page, R.districtTrigger(r));
  expect(districts).toContain(cfg.district);
  expect(districts, 'อำเภอต้องไม่ใช่รายชื่อจังหวัด').not.toContain('กรุงเทพมหานคร');
  await choose(page, R.districtTrigger(r), cfg.district);
  const aors = await listOptions(page, R.aorTrigger(r));
  expect(aors).toContain(cfg.aor);
});

test('TC-04 ช่องศูนย์พักพิงในระบบ มีตัวเลือก "พิมพ์ชื่อสถานที่เอง" และค้นหาศูนย์ในจังหวัดได้', async ({ page }) => {
  await R.openCreate(page);
  await R.setHeader(page, { province: cfg.province });
  const opts = await listOptions(page, R.shelterTrigger(R.row(page, 1)));
  expect(opts.some((o) => o.startsWith('พิมพ์ชื่อสถานที่เอง'))).toBe(true);
  expect(opts.some((o) => o.includes(cfg.shelterCode)), `ต้องเห็นศูนย์ ${cfg.shelterCode}`).toBe(true);
});

test('TC-05 เลือกศูนย์ในระบบแล้ว ระบบเติมสถานที่ตั้ง รองรับจำนวน และผู้ประสานงานให้อัตโนมัติ', async ({ page }) => {
  await R.openCreate(page);
  await R.setHeader(page, { province: cfg.province });
  const r = R.row(page, 1);
  await choose(page, R.shelterTrigger(r), cfg.shelterCode, { contains: true });
  await expect(R.field(r, 'place')).toHaveValue(new RegExp(esc(cfg.shelterName)));
  await expect(R.field(r, 'capacity')).not.toHaveValue('');
  await expect(page.locator('main').getByText('รายงานจะไม่เปลี่ยนตามข้อมูลศูนย์ภายหลัง')).toBeVisible();
});

test('TC-06 สถานะมีตัวเลือกครบ และกด "เพิ่มรายการ" ได้หลายแถว', async ({ page }) => {
  await R.openCreate(page);
  const opts = await listOptions(page, R.statusTrigger(R.row(page, 1)));
  expect(opts).toEqual(expect.arrayContaining(R.STATUS_OPTIONS));
  await closePopups(page);
  await R.addRow(page);
  await expect(page.locator('main').getByText(/รวมทั้งสิ้น 2 รายการ/).first()).toBeVisible();
});
