// ขั้นตอนของหน้า "รายงานข้อมูลศูนย์พักพิงเบื้องต้น" (/backoffice/shelter/basic-report)
// ชื่อปุ่ม/ข้อความตามหน้าจอจริงบน UAT v1.0.0-rc.25
import { expect } from '@playwright/test';
import { choose, closePopups, pickToday, typeInto, exact } from './helpers.mjs';

export const LIST_URL = '/backoffice/shelter/basic-report';
export const TITLE = 'รายงานข้อมูลศูนย์พักพิงเบื้องต้น';

// ลำดับช่องกรอกในแต่ละ "ลำดับที่ N" (input + textarea) ตามหน้าจอ
const ROW_FIELD = {
  place: 0, capacity: 1, coordName: 2, coordPos: 3, coordPhone: 4,
  need: 5, needQty: 6, male: 7, female: 8, elderly: 9, child: 10, disabled: 11, bedridden: 12, pregnant: 13,
};
export const ROW_LABELS = {
  place: 'สถานที่ตั้งศูนย์พักพิง', capacity: 'รองรับจำนวน (คน)', coordName: 'ชื่อ-สกุล', coordPos: 'ตำแหน่ง',
  coordPhone: 'หมายเลขโทรศัพท์', need: 'ความต้องการในพื้นที่', needQty: 'จำนวน', male: 'ชาย (คน)', female: 'หญิง (คน)',
  elderly: 'ผู้สูงอายุ', child: 'เด็กเล็ก', disabled: 'ผู้พิการหรือผู้ทุพพลภาพ', bedridden: 'ผู้ป่วยติดเตียง', pregnant: 'หญิงตั้งครรภ์',
};

const main = (page) => page.locator('main');

/* ---------- เปิดหน้า ---------- */

export async function openFromShelterMenu(page) {
  await page.goto('/backoffice/shelter');
  const btn = main(page).getByRole('link', { name: TITLE }).or(main(page).getByRole('button', { name: TITLE })).first();
  await expect(btn, `เมนู "จัดการศูนย์พักพิง" ต้องมีปุ่ม "${TITLE}"`).toBeVisible();
  await btn.click();
  await expect(page).toHaveURL(new RegExp(`${LIST_URL}$`));
  await expect(main(page).getByRole('link', { name: 'สร้างรายงาน', exact: true })).toBeVisible();
}

export async function gotoList(page) {
  await page.goto(LIST_URL);
  await expect(main(page).getByRole('link', { name: 'สร้างรายงาน', exact: true })).toBeVisible();
}

export async function openCreate(page) {
  await gotoList(page);
  await main(page).getByRole('link', { name: 'สร้างรายงาน', exact: true }).click();
  await expect(page).toHaveURL(/\/basic-report\/new$/);
  await expect(main(page).getByText('ลำดับที่ 1', { exact: true })).toBeVisible();
}

/* ---------- ส่วนหัวรายงาน ---------- */

export const reportNameInput = (page) => main(page).getByPlaceholder('ไม่ระบุ = ใช้ชื่อมาตรฐานจากจังหวัดและวันที่ข้อมูล');
// dropdown แบบค้นหาได้ (จังหวัด / ศูนย์ในระบบ / อำเภอ / อปท.) เป็นปุ่ม aria-label="Show popup"
export const provinceTrigger = (page) => main(page).locator('button[aria-label="Show popup"]').first();

export async function setHeader(page, { name, province }) {
  if (name !== undefined) await reportNameInput(page).fill(name);
  if (province) {
    await choose(page, provinceTrigger(page), province);
    await expect(provinceTrigger(page)).toContainText(province);
  }
}

/* ---------- แถวข้อมูลศูนย์พักพิง ---------- */

export const row = (page, n) =>
  main(page).locator(`xpath=.//*[normalize-space(text())="ลำดับที่ ${n}"]/ancestor::*[count(.//input)>=10][1]`);

export const rowInputs = (r) => r.locator('input:not([type="hidden"]):not([type="time"]), textarea');
export const field = (r, key) => rowInputs(r).nth(ROW_FIELD[key]);
const popupBtn = (r) => r.locator('button[aria-label="Show popup"]');
export const shelterTrigger = (r) => popupBtn(r).nth(0);
export const districtTrigger = (r) => popupBtn(r).nth(1);
export const aorTrigger = (r) => popupBtn(r).nth(2);
export const STATUS_OPTIONS = ['เปิดศูนย์', 'จุดการให้บริการ', 'ปิดศูนย์', 'อื่น ๆ (ระบุ)'];
export const statusTrigger = (r) =>
  r.locator('button').filter({ hasText: /^\s*(เลือกสถานะ|เปิดศูนย์|จุดการให้บริการ|ปิดศูนย์|อื่น ๆ.*)\s*$/ }).first();
export const openDateTrigger = (r) => r.getByRole('button').filter({ hasText: /เลือกวันที่|\d{4}/ }).nth(0);

export async function addRow(page) {
  const before = await main(page).getByText(/^ลำดับที่ \d+$/).count();
  await main(page).getByRole('button', { name: 'เพิ่มรายการ', exact: true }).click();
  await expect(main(page).getByText(`ลำดับที่ ${before + 1}`, { exact: true })).toBeVisible();
  return before + 1;
}

async function fillCommon(page, r, d) {
  for (const k of ['capacity', 'coordName', 'coordPos', 'coordPhone']) {
    if (d[k] !== undefined) await typeInto(page, field(r, k), d[k], ROW_LABELS[k]);
    else await expect(field(r, k), `${ROW_LABELS[k]} ต้องมีค่า`).not.toHaveValue('');
  }
  if ((await statusTrigger(r).innerText()).includes('เลือกสถานะ')) await choose(page, statusTrigger(r), d.status || 'เปิดศูนย์');
  if ((await openDateTrigger(r).innerText()).includes('เลือกวันที่')) await pickToday(page, openDateTrigger(r));
  if (d.need !== undefined) { await closePopups(page); await field(r, 'need').fill(d.need); }
  if (d.needQty !== undefined) await typeInto(page, field(r, 'needQty'), d.needQty, ROW_LABELS.needQty);
  for (const [k, v] of Object.entries(d.people || {})) await typeInto(page, field(r, k), v, ROW_LABELS[k]);
}

/** แถวที่เลือก "ศูนย์พักพิงในระบบ" (ระบบเติมข้อมูลให้) แล้วกรอกเพิ่มเฉพาะช่องที่ว่าง/ที่ส่งมา */
export async function fillRowFromSystem(page, n, { code, district, aor, ...d }) {
  const r = row(page, n);
  if (district) await choose(page, districtTrigger(r), district);
  if (aor) await choose(page, aorTrigger(r), aor);
  await choose(page, shelterTrigger(r), code, { contains: true });
  await expect(field(r, 'place'), 'ระบบต้องเติมสถานที่ตั้งจากศูนย์ในระบบ').not.toHaveValue('');
  if (!d.coordPos && !(await field(r, 'coordPos').inputValue())) d.coordPos = 'ปลัดอำเภอ';
  await fillCommon(page, r, d);
  return {
    place: (await field(r, 'place').inputValue()).trim(),
    capacity: await field(r, 'capacity').inputValue(),
  };
}

/** แถวที่ "พิมพ์ชื่อสถานที่เอง (ไม่มีในระบบ)" */
export async function fillRowManual(page, n, { place, district, ...d }) {
  const r = row(page, n);
  await choose(page, shelterTrigger(r), 'พิมพ์ชื่อสถานที่เอง', { contains: true });
  await closePopups(page);
  await field(r, 'place').fill(place);
  await choose(page, districtTrigger(r), district);
  await fillCommon(page, r, d);
}

/* ---------- บันทึก / ยืนยัน ---------- */

export const confirmDialog = (page, title) =>
  page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: title });

export async function clickSave(page, label = 'บันทึกรายงาน') {
  await closePopups(page);
  await main(page).getByRole('button', { name: label, exact: true }).click();
}

/** กดบันทึก → รอหน้าต่างยืนยัน → (ยืนยันบันทึก | กลับไปแก้ไข) */
export async function saveAndConfirm(page, { edit = false, confirm = true } = {}) {
  await clickSave(page, edit ? 'บันทึกการแก้ไข' : 'บันทึกรายงาน');
  const dlg = confirmDialog(page, edit ? 'ยืนยันการแก้ไขรายงาน' : 'ยืนยันการบันทึกรายงาน');
  await expect(dlg, 'ต้องแสดงหน้าต่างยืนยันการบันทึก').toBeVisible();
  const summary = await dlg.innerText();
  await dlg.getByRole('button', { name: confirm ? 'ยืนยันบันทึก' : 'กลับไปแก้ไข', exact: true }).click();
  await expect(dlg).toBeHidden();
  if (confirm) await expect(page).toHaveURL(/\/basic-report\/[0-9a-f-]{20,}$/, { timeout: 20_000 });
  return summary;
}

/* ---------- หน้าแสดงรายงาน ---------- */

/** อ่านตารางรายงาน: คืนแถวข้อมูล (array ของ cell) และแถวรวมทั้งสิ้น */
export async function readReport(page) {
  const table = main(page).locator('table').first();
  await expect(table).toBeVisible();
  // แถว "รวมทั้งสิ้น" อยู่ใน <tfoot> จึงต้องอ่านทั้ง tbody และ tfoot
  const rows = await table.locator('tbody tr, tfoot tr').evaluateAll((trs) =>
    trs.map((tr) => [...tr.querySelectorAll('td,th')].map((c) => c.innerText.trim())));
  const data = rows.filter((r) => /^\d+$/.test(r[0]));
  const total = rows.find((r) => r[0].startsWith('รวมทั้งสิ้น'));
  const meta = await main(page).getByText(/สร้างเมื่อ/).first().innerText();
  return { data, total, meta };
}

/* ---------- ประวัติรายงาน ---------- */

export const historyRow = (page, reportName) =>
  main(page).locator('table tbody tr').filter({ hasText: reportName });

export async function openFromHistory(page, reportName, action = 'ดูรายงาน') {
  await gotoList(page);
  const r = historyRow(page, reportName);
  await expect(r, `ไม่พบ "${reportName}" ในประวัติรายงาน`).toHaveCount(1);
  await r.getByRole('link', { name: action, exact: true }).click();
  await expect(page).toHaveURL(action === 'แก้ไข' ? /\/edit$/ : /\/basic-report\/[0-9a-f-]{20,}$/);
}

export { exact };
