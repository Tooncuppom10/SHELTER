import { expect } from '@playwright/test';

export const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const exact = (s) => new RegExp(`^\\s*${esc(s)}\\s*$`);

/** ปิด dropdown/ปฏิทินที่ค้าง: กด Escape เฉพาะตอนยังเห็น popup (กันปิด dialog ทิ้ง) */
export async function closePopups(page) {
  const popup = page.locator('[role="option"]:visible, [data-reka-popper-content-wrapper] [role="grid"]:visible');
  for (let i = 0; i < 3 && (await popup.count()); i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
}

/** คลิกตัวเปิด dropdown แล้วเลือกตัวเลือก (เทียบข้อความตรงตัว หรือ "มีคำว่า" เมื่อ contains=true) */
export async function choose(page, trigger, optionText, { contains = false } = {}) {
  await closePopups(page);
  await trigger.click();
  const opt = page.getByRole('option').filter({ hasText: contains ? optionText : exact(optionText) }).last();
  await expect(opt, `ไม่พบตัวเลือก "${optionText}"`).toBeVisible();
  await opt.click();
  await closePopups(page);
}

/** รายการตัวเลือกทั้งหมดของ dropdown (เปิดแล้วปิด) */
export async function listOptions(page, trigger) {
  await closePopups(page);
  await trigger.click();
  await expect(page.getByRole('option').first()).toBeVisible();
  const texts = (await page.getByRole('option').allInnerTexts()).map((t) => t.trim());
  await closePopups(page);
  return texts;
}

/** พิมพ์ทับค่าในช่อง (ช่องตัวเลขของ Reka ต้องพิมพ์จริง fill ตรง ๆ บางครั้งค่าไม่ติด) แล้วอ่านกลับ */
export async function typeInto(page, input, value, label = 'ช่อง') {
  await closePopups(page);
  await input.click();
  await input.press('ControlOrMeta+a');
  if (value === '') await input.press('Backspace');
  else await input.pressSequentially(String(value));
  await input.press('Tab');
  await expect(input, `${label}: ต้องเป็น "${value}"`).toHaveValue(new RegExp(`^\\s*${esc(String(value))}\\s*$`));
}

/** เลือก "วันนี้" ในปฏิทินที่เปิดจากปุ่ม trigger */
export async function pickToday(page, trigger) {
  await closePopups(page);
  await trigger.click();
  const pop = page.locator('[data-reka-popper-content-wrapper]').last();
  const today = pop.locator('[data-today]').first();
  if (await today.count()) await today.click();
  else {
    const d = String(new Date().getDate());
    await pop.locator('[data-reka-calendar-cell-trigger]:not([data-outside-view])').filter({ hasText: exact(d) }).first().click();
  }
  await closePopups(page);
  await expect(trigger, 'ยังไม่ได้เลือกวันที่').not.toHaveText(/เลือกวันที่/);
}
