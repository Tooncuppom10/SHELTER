// AC1: ผู้มีสิทธิ์แต่ละระดับเข้าหน้ารายงานได้ / ผู้ไม่มีสิทธิ์เข้าไม่ได้
// ตั้งชื่อผู้ใช้ใน .env (USER_CENTRAL, USER_PROVINCE, ...) และ ROLE_PASS — ไม่ตั้ง = ข้ามเคสนั้น
// ผู้ดูแลระบบ (superadmin) ถูกตรวจแล้วใน TC-01
import { test, expect } from '@playwright/test';
import { loginAs } from '../../lib/login.mjs';
import { cfg } from '../../lib/config.mjs';
import * as R from '../../lib/report-form.mjs';

const cases = [['TC-18', 'ส่วนกลาง'], ['TC-19', 'จังหวัด'], ['TC-20', 'อำเภอ'], ['TC-21', 'ตำบล']];

for (const [id, role] of cases) {
  test(`${id} บทบาท "${role}" เข้าหน้ารายงานข้อมูลศูนย์พักพิงเบื้องต้น และเปิดฟอร์มสร้างรายงานได้`, async ({ browser }, testInfo) => {
    const user = cfg.roles[role];
    test.skip(!user || !cfg.rolePass, `ยังไม่ได้ตั้งบัญชีบทบาท "${role}" ใน .env`);
    const { context, page } = await loginAs(browser, testInfo, user, cfg.rolePass);
    try {
      await R.openFromShelterMenu(page);
      await page.locator('main').getByRole('link', { name: 'สร้างรายงาน', exact: true }).click();
      await expect(page).toHaveURL(/\/basic-report\/new$/);
    } finally { await context.close(); }
  });
}

test('TC-22 ผู้ใช้ที่ไม่มีสิทธิ์ ไม่เห็นปุ่มและเข้าหน้ารายงานไม่ได้', async ({ browser }, testInfo) => {
  test.skip(!cfg.noPermissionUser || !cfg.rolePass, 'ยังไม่ได้ตั้ง USER_NO_PERMISSION ใน .env');
  const { context, page } = await loginAs(browser, testInfo, cfg.noPermissionUser, cfg.rolePass);
  try {
    await page.goto('/backoffice/shelter');
    await expect(page.locator('main').getByText(R.TITLE, { exact: true })).toHaveCount(0);
    await page.goto(R.LIST_URL);
    await expect(page.locator('main').getByRole('link', { name: 'สร้างรายงาน', exact: true })).toHaveCount(0);
  } finally { await context.close(); }
});
