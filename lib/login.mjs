import fs from 'node:fs';
import { expect } from '@playwright/test';
import { cfg } from './config.mjs';

/**
 * ให้แน่ใจว่าอยู่ในระบบหลังบ้านแล้ว
 * 1) ใช้ session เดิม (auth/user.json) ถ้ายังใช้ได้
 * 2) ไม่งั้น login ด้วย SHELTER_USER / SHELTER_PASS แล้วเก็บ session ไว้ใช้รอบหน้า
 */
export async function ensureLoggedIn(page, { user = cfg.user, pass = cfg.pass, saveState = true } = {}) {
  page.on('dialog', (d) => d.accept().catch(() => {})); // กัน "ออกจากหน้านี้?" ค้าง
  await page.goto('/backoffice/shelter');
  await page.waitForLoadState('networkidle').catch(() => {});
  if (!/\/login/.test(page.url())) return;

  if (!pass) throw new Error('ยังไม่ได้ตั้งรหัสผ่าน: ใส่ SHELTER_PASS ในไฟล์ .env (ดูตัวอย่างใน .env.example)');
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(pass);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  // หน้า login มี ?redirect=/backoffice/... อยู่ใน URL จึงต้องเช็คว่า "ออกจากหน้า login แล้ว" ไม่ใช่แค่มีคำว่า backoffice
  await expect(page, `login ไม่สำเร็จด้วยบัญชี ${user} (ตรวจ SHELTER_PASS ใน .env)`).not.toHaveURL(/\/login/, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/backoffice/);

  if (saveState) {
    fs.mkdirSync('auth', { recursive: true });
    await page.context().storageState({ path: 'auth/user.json' });
  }
}

/** login ด้วยบัญชีอื่นในหน้าต่างใหม่ (ไม่ใช้ session หลัก) สำหรับเคสบทบาท */
export async function loginAs(browser, testInfo, user, pass) {
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: testInfo.project.use.viewport,
    locale: 'th-TH',
  });
  const page = await context.newPage();
  await ensureLoggedIn(page, { user, pass, saveState: false });
  return { context, page };
}
