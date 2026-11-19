// ชุดต่อเนื่อง: สร้างรายงานจริง 1 ฉบับบน UAT แล้วเปิดดู/แก้ไขต่อ
// ชื่อรายงาน = "ทดสอบอัตโนมัติ SHEL-714 รอบ <RUN_ID>" ใช้ค้นหา/ลบทีหลัง
import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../../lib/login.mjs';
import { cfg, data, MSG } from '../../lib/config.mjs';
import { typeInto, esc } from '../../lib/helpers.mjs';
import * as R from '../../lib/report-form.mjs';

test.describe.configure({ mode: 'serial' });

let context, page, row1;

test.beforeAll(async ({ browser }, testInfo) => {
  context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: testInfo.project.use.viewport,
    storageState: testInfo.project.use.storageState,
    locale: 'th-TH',
  });
  page = await context.newPage();
  await ensureLoggedIn(page);
});
test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus)
    await testInfo.attach('screen', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
test.afterAll(async () => { await context?.close(); });

test('TC-10 สร้างรายงาน 2 แถว (ศูนย์ในระบบ + พิมพ์เอง) ยืนยันแล้วแสดงรายงานทันที ข้อมูลตรงทุกแถว', async () => {
  await R.openCreate(page);
  await R.setHeader(page, { name: data.reportName, province: cfg.province });
  row1 = await R.fillRowFromSystem(page, 1, { code: cfg.shelterCode, district: cfg.district, aor: cfg.aor, ...data.row1 });
  await R.addRow(page);
  await R.fillRowManual(page, 2, { place: data.manualPlace, district: cfg.district2, ...data.row2 });
  await R.saveAndConfirm(page);

  await expect(page.locator('main').getByText(data.reportName).first()).toBeVisible();
  const { data: rows, total, meta } = await R.readReport(page);
  expect(meta).toMatch(/สร้างเมื่อ .* โดย /);
  expect(rows).toHaveLength(2);
  expect(rows[0].slice(1, 6)).toEqual([cfg.province, cfg.district, cfg.aor, row1.place, row1.capacity]);
  expect(rows[0]).toEqual(expect.arrayContaining([data.row1.coordPos, data.row1.need, data.row1.needQty]));
  expect(rows[1].slice(1, 6)).toEqual([cfg.province, cfg.district2, '-', data.manualPlace, data.row2.capacity]);
  expect(rows[1]).toEqual(expect.arrayContaining([data.row2.coordName, data.row2.coordPhone, 'เปิดศูนย์']));
  expect(total).toContain(String(Number(row1.capacity) + Number(data.row2.capacity)));
});

test('TC-11 รายงานที่สร้างแสดงในประวัติรายงาน (2 แห่ง และรองรับรวมถูกต้อง)', async () => {
  await R.gotoList(page);
  const r = R.historyRow(page, data.reportName);
  await expect(r).toHaveCount(1);
  await expect(r).toContainText(cfg.province);
  await expect(r).toContainText('2 แห่ง');
  await expect(r).toContainText(String(Number(row1.capacity) + Number(data.row2.capacity)));
});

test('TC-12 เปิดดูรายงานย้อนหลัง ข้อมูลตรงกับที่บันทึกไว้', async () => {
  await R.openFromHistory(page, data.reportName, 'ดูรายงาน');
  const { data: rows } = await R.readReport(page);
  expect(rows.map((r) => r[4])).toEqual([row1.place, data.manualPlace]);
});

test('TC-13 แบบฟอร์มแก้ไขแสดงข้อมูลเดิมครบทุกแถว', async () => {
  await R.openFromHistory(page, data.reportName, 'แก้ไข');
  await expect(R.reportNameInput(page)).toHaveValue(data.reportName);
  await expect(R.provinceTrigger(page)).toContainText(cfg.province);
  await expect(R.field(R.row(page, 1), 'place')).toHaveValue(new RegExp(esc(row1.place)));
  await expect(R.field(R.row(page, 2), 'place')).toHaveValue(data.manualPlace);
  await expect(R.field(R.row(page, 2), 'coordName')).toHaveValue(data.row2.coordName);
});

test('TC-14 แก้ไขโดยลบช่องบังคับ (ชื่อ-สกุลผู้ประสานงาน แถว 2) ระบบไม่บันทึกและแจ้งเตือน', async () => {
  const r2 = R.row(page, 2);
  await typeInto(page, R.field(r2, 'coordName'), '', 'ชื่อ-สกุล');
  await R.clickSave(page, 'บันทึกการแก้ไข');
  await expect(r2.getByText(MSG.coordName, { exact: true })).toBeVisible();
  await expect(page.locator('[role="dialog"]').filter({ hasText: 'ยืนยันการแก้ไขรายงาน' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/edit$/);
});

test('TC-15 บันทึกการแก้ไขสำเร็จ ปรับปรุงรายงานฉบับเดิม และแสดงวันเวลา/ผู้แก้ไขล่าสุด', async () => {
  const r2 = R.row(page, 2);
  await typeInto(page, R.field(r2, 'coordName'), data.row2.coordName, 'ชื่อ-สกุล');
  await R.field(r2, 'need').fill(data.edit.need);
  await typeInto(page, R.field(r2, 'male'), data.edit.male, 'ชาย (คน)');
  await R.saveAndConfirm(page, { edit: true });

  const { data: rows, total, meta } = await R.readReport(page);
  expect(meta).toMatch(/แก้ไขล่าสุด .* โดย /);
  expect(rows[1]).toEqual(expect.arrayContaining([data.edit.need]));
  const maleCol = rows[0].length - 7; // คอลัมน์ "ชาย"
  expect(rows[1][maleCol]).toBe(data.edit.male);
  expect(total).toContain(String(Number(data.row1.people.male) + Number(data.edit.male)));
});

test('TC-16 หลังแก้ไข ประวัติรายงานยังมีฉบับเดียว และแสดงแก้ไขล่าสุด', async () => {
  await R.gotoList(page);
  const r = R.historyRow(page, data.reportName);
  await expect(r).toHaveCount(1);
  await expect(r).toContainText(/\d{4}, เวลา .* โดย /);
});
