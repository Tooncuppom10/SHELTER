// ชุดอิสระ: กด "บันทึกรายงาน" ตอนข้อมูลไม่ครบ ระบบต้องไม่บันทึก (ไม่มีการยืนยันบันทึกจริง)
import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../../lib/login.mjs';
import { cfg, data, MSG } from '../../lib/config.mjs';
import * as R from '../../lib/report-form.mjs';

test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

test('TC-07 กดบันทึกโดยไม่กรอกข้อมูล ระบบไม่บันทึก และแจ้งเตือนทุกช่องบังคับ', async ({ page }) => {
  await R.openCreate(page);
  await R.clickSave(page);
  const main = page.locator('main');
  await expect(page.getByText(MSG.summary).first(), 'ต้องมีแจ้งเตือนรวม').toBeVisible();
  for (const key of ['province', 'place', 'district', 'capacity', 'coordName', 'coordPos', 'coordPhone', 'status', 'openDate']) {
    await expect.soft(main.getByText(MSG[key], { exact: true }).first(), `ต้องแจ้ง "${MSG[key]}"`).toBeVisible();
  }
  await expect(page.locator('[role="dialog"]').filter({ hasText: 'ยืนยันการบันทึกรายงาน' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/basic-report\/new$/);
});

test('TC-08 แถวที่ 2 ว่าง ระบบไม่บันทึก และแจ้งเตือนเฉพาะช่องของแถวที่ 2', async ({ page }) => {
  await R.openCreate(page);
  await R.setHeader(page, { province: cfg.province });
  await R.fillRowFromSystem(page, 1, { code: cfg.shelterCode, district: cfg.district, aor: cfg.aor });
  await R.addRow(page);
  await R.clickSave(page);
  await expect(page.getByText(MSG.summary).first()).toBeVisible();
  await expect(R.row(page, 1).getByText(/^กรุณา/)).toHaveCount(0);
  await expect(R.row(page, 2).getByText(MSG.place, { exact: true })).toBeVisible();
  await expect(R.row(page, 2).getByText(MSG.district, { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/basic-report\/new$/);
});

test('TC-09 หน้ายืนยันแสดงสรุปข้อมูล และกด "กลับไปแก้ไข" แล้วข้อมูลเดิมยังอยู่ครบ (ไม่บันทึก)', async ({ page }) => {
  await R.openCreate(page);
  await R.setHeader(page, { name: data.reportName, province: cfg.province });
  const row1 = await R.fillRowFromSystem(page, 1, { code: cfg.shelterCode, district: cfg.district, aor: cfg.aor });
  await R.addRow(page);
  await R.fillRowManual(page, 2, { place: data.manualPlace, district: cfg.district2, ...data.row2 });
  const before = await R.rowInputs(page.locator('main')).evaluateAll((els) => els.map((e) => e.value));

  const summary = await R.saveAndConfirm(page, { confirm: false });
  expect(summary).toContain(cfg.province);
  expect(summary).toContain('2 แห่ง');
  expect(summary).toContain(`${Number(row1.capacity) + Number(data.row2.capacity)} คน`);
  expect(summary).toContain(data.manualPlace);

  const after = await R.rowInputs(page.locator('main')).evaluateAll((els) => els.map((e) => e.value));
  expect(after).toEqual(before);
  await expect(page).toHaveURL(/\/basic-report\/new$/);
});
