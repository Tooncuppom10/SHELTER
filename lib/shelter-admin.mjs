// แก้ "ความจุรองรับ [คน]" ของศูนย์พักพิงในเมนู จัดการศูนย์พักพิง (ใช้ในเคส AC6 แล้วคืนค่าเดิม)
import { expect } from '@playwright/test';
import { typeInto } from './helpers.mjs';

const EDIT_TITLE = 'แก้ไขศูนย์พักพิง';

async function openEdit(page, shelterName) {
  await page.goto('/backoffice/shelter');
  const search = page.locator('main').getByPlaceholder('ค้นหาจากชื่อหรือที่อยู่ของศูนย์พักพิง').first();
  await search.fill(shelterName);
  await search.press('Enter');
  const r = page.locator('main tbody tr').filter({ hasText: shelterName });
  await expect(r, `ไม่พบศูนย์ "${shelterName}"`).toHaveCount(1);
  await r.getByRole('button', { name: 'เมนูเพิ่มเติม' }).click();
  await page.getByRole('menuitem', { name: 'แก้ไขข้อมูล' }).click();
  const dlg = page.getByRole('dialog').filter({ hasText: EDIT_TITLE });
  await expect(dlg).toBeVisible();
  await dlg.getByRole('tab', { name: 'คุณสมบัติผู้พักพิง' }).click();
  return dlg;
}

/** ตั้งความจุใหม่ คืนค่าความจุเดิม */
export async function setShelterCapacity(page, shelterName, value) {
  const dlg = await openEdit(page, shelterName);
  const cap = dlg.getByLabel('ความจุรองรับ [คน]', { exact: false }).first();
  await expect(cap).toBeVisible();
  const old = await cap.inputValue();
  await typeInto(page, cap, value, 'ความจุรองรับ');
  await dlg.getByRole('button', { name: 'บันทึกการแก้ไข', exact: true }).click();
  const warn = page.getByRole('alertdialog').or(page.getByRole('dialog').filter({ hasText: 'คุณต้องการบันทึกข้อมูลนี้หรือไม่' })).last();
  await expect(warn).toBeVisible();
  await warn.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await expect(dlg).toBeHidden({ timeout: 20_000 });
  await expect(page.locator('main tbody tr').filter({ hasText: shelterName })).toContainText(`/ ${value} คน`);
  return old;
}
