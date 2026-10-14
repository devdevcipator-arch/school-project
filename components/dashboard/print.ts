// Print-ready documents (certificates, receipts, reports) opened in a new window,
// so the principal can print them or choose "Save as PDF".

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Opens a print-ready document in a new window so the principal can print it or "Save as PDF".
 * `body` is trusted markup built by the caller; use `esc` for any data placed inside it.
 */
export function printDocument(title: string, body: (e: typeof esc) => string) {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:"Plus Jakarta Sans","Segoe UI",Roboto,sans-serif;color:#061E29}
  .page{padding:40px 48px} h1{margin:0;font-size:26px} h2{margin:28px 0 8px;font-size:17px;color:#1D546D}
  .muted{color:#5b6b72;font-size:13px} table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
  th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #dfe5e6} th{background:#F3F4F4;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#5b6b72}
  .bar{height:6px;background:linear-gradient(135deg,#061E29,#1D546D,#5F9598);margin-bottom:28px}
  .cert{margin:40px;border:10px double #1D546D;padding:56px 64px;text-align:center;min-height:640px}
  .cert h1{font-size:40px;letter-spacing:.04em;color:#1D546D} .cert .name{font-size:34px;font-weight:800;margin:18px 0 6px;border-bottom:2px solid #5F9598;display:inline-block;padding:0 24px 6px}
  .cert p{font-size:16px;line-height:1.7} .sign{display:flex;justify-content:space-between;margin-top:72px;font-size:13px}
  .sign div{border-top:1px solid #061E29;padding-top:6px;width:220px}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 24px;font-size:13px;margin-top:12px}
  .right{text-align:right} .total td{font-weight:800;border-top:2px solid #061E29}
  .slip{border:1px dashed #5F9598;border-radius:12px;padding:22px 26px;margin-bottom:18px}
  .stamp{display:inline-block;border:2px solid #2e8b57;color:#2e8b57;border-radius:8px;padding:4px 12px;font-weight:800;letter-spacing:.1em}
  .stamp.due{border-color:#c0392b;color:#c0392b}
  @media print{.page,.cert{margin:0}}
</style></head><body>${body(esc)}</body></html>`);
  w.document.close();
  w.focus();
  // Give the new window a moment to lay out before opening the print dialog.
  setTimeout(() => w.print(), 300);
  return true;
}
