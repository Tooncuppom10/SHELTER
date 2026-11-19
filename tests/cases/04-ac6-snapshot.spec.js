// AC6: รายงานย้อนหลังต้องไม่เปลี่ยนตามข้อมูลศูนย์พักพิงที่แก้ภายหลัง
// เคสนี้ "แก้ข้อมูลศูนย์จริง" (ความจุ +1) แล้วคืนค่าเดิมใน finally → เปิดด้วย RUN_AC6=1 เท่านั้น
import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../../lib/login.mjs';
import { cfg, data } from '../../lib/config.mjs';
import { setShelterCapacity } from '../../lib/shelter-admin.mjs';
import * as R from '../../lib/report-form.mjs';

test.skip(!cfg.runAc6, 'ข้าม: ตั้ง RUN_AC6=1 เมื่อพร้อมให้แก้ข้อมูลศูนย์พักพิงจริงแล้วคืนค่า');

test('TC-17 แก้ความจุศูนย์ในเมนูจัดการศูนย์พักพิงแล้ว รายงานฉบับเดิมยังแสดงค่าเดิม', async ({ page }) => {
  test.setTimeout(240_000);
  await ensureLoggedIn(page);

  // ใช้รายงานของรอบนี้ (จาก 03) ถ้าไม่มี สร้างรายงาน 1 แถวขึ้นมาเอง
  await R.gotoList(page);
  const name = (await R.historyRow(page, data.reportName).count()) ? data.reportName : `${data.reportName} (AC6)`;
  if (name !== data.reportName) {
    await R.openCreate(page);
    await R.setHeader(page, { name, province: cfg.province });
    await R.fillRowFromSystem(page, 1, { code: cfg.shelterCode, district: cfg.district, aor: cfg.aor });
    await R.saveAndConfirm(page);
  }
  await R.openFromHistory(page, name, 'ดูรายงาน');
  const before = (await R.readReport(page)).data.find((r) => r[4].includes(cfg.shelterName));
  expect(before, `รายงานต้องมีแถวของ ${cfg.shelterName}`).toBeTruthy();

  let old;
  try {
    old = await setShelterCapacity(page, cfg.shelterName, String(Number(before[5]) + 1));
    await R.openFromHistory(page, name, 'ดูรายงาน');
    const after = (await R.readReport(page)).data.find((r) => r[4].includes(cfg.shelterName));
    expect(after[5], 'รองรับคนในรายงานต้องเท่าเดิม').toBe(before[5]);
  } finally {
    if (old !== undefined) await setShelterCapacity(page, cfg.shelterName, old);
  }
});
