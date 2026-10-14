"use client";

import { useRef, useState, type DragEvent } from "react";
import { Chip, Drawer, Select, fieldClass, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Badge, Bar } from "@/components/dashboard/ui";
import { Icon } from "@/components/ui/Icon";
import { docCategories, formatBytes, type DocCategory, type VaultDoc } from "@/lib/copilot";
import { grades, subjects } from "@/lib/teachers";

const ACCEPT = ".pdf,.doc,.docx,.txt,.epub";
const MAX_BYTES = 50 * 1024 * 1024;

const stage: Record<VaultDoc["status"], string> = {
  uploading: "Uploading",
  parsing: "Reading & parsing pages",
  embedding: "Chunking & building vectors",
  indexed: "Indexed",
  failed: "Failed",
};

const catIcon: Record<DocCategory, string> = {
  Textbook: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z M8 7h6",
  Syllabus: "M8 3v3 M16 3v3 M4 7h16v13H4z M8 12h8 M8 16h5",
  Handbook: "M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6",
  Policy: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
};

export type UploadMeta = { category: DocCategory; subject: string; grade: string };

export default function VaultDrawer({
  docs,
  onUpload,
  onRemove,
  onAsk,
  onClose,
}: {
  docs: VaultDoc[];
  onUpload: (files: File[], meta: UploadMeta) => void;
  onRemove: (d: VaultDoc) => void;
  onAsk: (d: VaultDoc) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState<UploadMeta>({ category: "Textbook", subject: "", grade: "" });
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<DocCategory | "all">("all");
  const [removing, setRemoving] = useState<string | null>(null);

  const take = (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const bad = files.filter((f) => !/\.(pdf|docx?|txt|epub)$/i.test(f.name));
    const big = files.filter((f) => f.size > MAX_BYTES);
    if (bad.length) return setError(`${bad[0].name} is not supported. Upload PDF, Word, EPUB or text files.`);
    if (big.length) return setError(`${big[0].name} is larger than 50 MB.`);
    setError("");
    onUpload(files, meta);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    take(e.dataTransfer.files);
  };

  const q = query.trim().toLowerCase();
  const shown = docs.filter((d) => (cat === "all" || d.category === cat) && (!q || `${d.title} ${d.file} ${d.subject ?? ""} ${d.grade ?? ""}`.toLowerCase().includes(q)));
  const indexed = docs.filter((d) => d.status === "indexed");

  return (
    <Drawer
      width="max-w-[760px]"
      title="Knowledge Vault"
      subtitle={`${indexed.length} indexed · ${indexed.reduce((n, d) => n + d.pages, 0).toLocaleString("en-US")} pages the copilot can read and cite`}
      onClose={onClose}
      footer={(close) => (
        <button type="button" onClick={close} className={`${ghostBtn} ml-auto max-sm:w-full`}>
          Done
        </button>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7">
          <section className="grid gap-3">
            <h3 className="text-[1rem] font-extrabold tracking-tight">Upload books & documents</h3>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Select label="Document type" value={meta.category} onChange={(v) => setMeta((m) => ({ ...m, category: v as DocCategory }))}>
                {docCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select label="Subject" value={meta.subject} onChange={(v) => setMeta((m) => ({ ...m, subject: v }))}>
                <option value="">Any subject</option>
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <Select label="Grade" value={meta.grade} onChange={(v) => setMeta((m) => ({ ...m, grade: v }))} className="max-sm:col-span-2">
                <option value="">All grades</option>
                {grades.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={`grid justify-items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${drag ? "border-primary bg-primary/6" : "border-ink/15 bg-surface/50"}`}
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-linear-135 from-primary to-accent text-surface">
                <Icon d="M12 16V4 M7 9l5-5 5 5 M5 20h14" className="size-6" />
              </span>
              <p className="font-bold">Drop PDFs, textbooks or policy files here</p>
              <p className="text-[.8rem] text-ink/55">PDF, Word, EPUB or text, up to 50 MB each. The copilot reads, splits and indexes every page.</p>
              <button type="button" onClick={() => fileRef.current?.click()} className={`${ghostBtn} mt-1`}>
                Browse files
              </button>
              <input ref={fileRef} type="file" multiple accept={ACCEPT} onChange={(e) => take(e.target.files)} className="sr-only" aria-label="Upload documents to the knowledge vault" />
            </div>
            {error && (
              <p role="alert" className="text-[.82rem] font-semibold text-danger">
                {error}
              </p>
            )}
          </section>

          <section className="grid gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-[1rem] font-extrabold tracking-tight">Library</h3>
              <p className="text-[.8rem] text-ink/55">{docs.length} documents</p>
            </div>
            <label className="relative">
              <span className="sr-only">Search the vault</span>
              <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, file, subject or grade" className={`${fieldClass} w-full pl-10`} />
            </label>
            <div role="group" aria-label="Document type" className="flex flex-wrap gap-2">
              <Chip type="radio" name="vault-cat" checked={cat === "all"} onChange={() => setCat("all")}>
                All ({docs.length})
              </Chip>
              {docCategories.map((c) => (
                <Chip key={c} type="radio" name="vault-cat" checked={cat === c} onChange={() => setCat(c)}>
                  {c} ({docs.filter((d) => d.category === c).length})
                </Chip>
              ))}
            </div>

            {shown.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-8 text-center text-[.86rem] text-ink/55">No documents match.</p>
            ) : (
              <ul className="grid gap-2.5">
                {shown.map((d) => {
                  const busy = d.status !== "indexed" && d.status !== "failed";
                  return (
                    <li key={d.id} className="rounded-2xl border border-ink/8 p-4">
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                          <Icon d={catIcon[d.category]} className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{d.title}</p>
                          <p className="truncate text-[.76rem] text-ink/55">
                            {d.file} · {formatBytes(d.size)}
                            {d.pages ? ` · ${d.pages} pages` : ""}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge tone="neutral">{d.category}</Badge>
                            {d.subject && <span className="rounded-full bg-accent/12 px-2.5 py-1 text-[.72rem] font-bold text-[#3d6e71]">{d.subject}</span>}
                            {d.grade && <span className="rounded-full bg-accent/12 px-2.5 py-1 text-[.72rem] font-bold text-[#3d6e71]">{d.grade}</span>}
                            {d.status === "indexed" ? <Badge tone="ok">Indexed</Badge> : d.status === "failed" ? <Badge tone="danger">Failed</Badge> : null}
                          </div>
                        </div>
                      </div>
                      {busy && (
                        <div className="mt-3 grid gap-1.5" aria-live="polite">
                          <div className="flex justify-between text-[.76rem] font-semibold text-primary">
                            <span>{stage[d.status]}...</span>
                            <span>{d.progress}%</span>
                          </div>
                          <Bar value={d.progress} label={`${d.title}: ${d.progress}% processed`} />
                        </div>
                      )}
                      {!busy && (
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-1 border-t border-ink/8 pt-2.5">
                          {removing === d.id ? (
                            <>
                              <span className="mr-auto text-[.8rem] font-semibold text-danger">Remove from the vault? The copilot will stop citing it.</span>
                              <button type="button" onClick={() => setRemoving(null)} className={ghostSm}>
                                Keep
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onRemove(d);
                                  setRemoving(null);
                                }}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-danger px-2.5 py-1.5 text-[.8rem] font-semibold text-white hover:bg-[#a33224]"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="mr-auto text-[.74rem] text-ink/45">Added {d.uploaded}</span>
                              {d.status === "indexed" && (
                                <button type="button" onClick={() => onAsk(d)} className={ghostSm}>
                                  <Icon d="M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6" className="size-4" />
                                  Ask about this
                                </button>
                              )}
                              <button type="button" onClick={() => setRemoving(d.id)} className={ghostSm} aria-label={`Remove ${d.title}`}>
                                <Icon d="M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3" className="size-4" />
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
