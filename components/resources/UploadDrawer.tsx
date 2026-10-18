"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer, Select, fieldClass, ghostBtn } from "@/components/dashboard/controls";
import { Bar } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MAX_UPLOAD, allowedExt, categoryMeta, extOf, formatSize, pathOf, subjectsForGrade, type Category, type Ext, type Folder, type Resource } from "@/lib/resources";
import { FileThumb, icons } from "./parts";

type Item = { key: string; file: File; error: string; progress: number };

const label = "grid gap-1.5 text-[.8rem] font-bold text-ink/70";
const grades = Array.from({ length: 12 }, (_, i) => i + 1);
const uploadCategories: Category[] = ["textbook", "helping", "past-paper", "presentation", "worksheet"];

function validate(f: File) {
  if (!allowedExt.includes(extOf(f.name) as Ext)) return "Only PDF, EPUB, DOCX and PPTX files are allowed.";
  if (f.size > MAX_UPLOAD) return `Too large (${formatSize(f.size)}). The limit is 50 MB.`;
  return "";
}

/** Folder options shown as full paths, e.g. "Grade 10 / Mathematics / Helping Books". */
export function folderOptions(folders: Folder[]) {
  return folders.map((f) => ({ id: f.id, label: pathOf(folders, f.id).map((p) => p.name).join(" / ") })).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

export default function UploadDrawer({
  folders,
  folderId,
  grade: defaultGrade,
  subject: defaultSubject,
  uploader,
  now,
  onUpload,
  onClose,
}: {
  folders: Folder[];
  folderId: string | null;
  grade: number;
  subject: string;
  uploader: string;
  now: number;
  onUpload: (files: Resource[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState(defaultGrade);
  const [subject, setSubject] = useState(defaultSubject);
  const [folder, setFolder] = useState(folderId ?? "");
  const [category, setCategory] = useState<Category>("helping");
  const [uploading, setUploading] = useState(false);
  const [tried, setTried] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const closeRef = useRef<() => void>(() => {});

  const valid = items.filter((i) => !i.error);
  const single = valid.length === 1;
  const options = folderOptions(folders);

  const add = (list: FileList | null) => {
    if (!list) return;
    setItems((x) => [...x, ...[...list].map((file, i) => ({ key: `${file.name}-${file.size}-${i}-${x.length}`, file, error: validate(file), progress: 0 }))]);
  };

  // Simulated transfer: larger files fill more slowly.
  useEffect(() => {
    if (!uploading) return;
    const t = setInterval(() => {
      setItems((x) => x.map((i) => (i.error || i.progress >= 100 ? i : { ...i, progress: Math.min(100, i.progress + Math.max(4, 40 - i.file.size / 2_000_000)) })));
    }, 180);
    return () => clearInterval(t);
  }, [uploading]);

  const done = uploading && valid.length > 0 && valid.every((i) => i.progress >= 100);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      const iso = new Date(now).toISOString();
      onUpload(
        valid.map((i, k) => ({
          id: `up-${i.key}-${k}`,
          title: single && title.trim() ? `${title.trim().replace(/\.(pdf|docx|pptx|epub)$/i, "")}.${extOf(i.file.name)}` : i.file.name,
          description: description.trim(),
          ext: extOf(i.file.name) as Ext,
          size: i.file.size,
          grade,
          subject: subject.trim(),
          category,
          folderId: folder,
          uploadedBy: uploader,
          uploadedAt: iso,
          url: URL.createObjectURL(i.file),
        })),
      );
      closeRef.current();
    }, 400);
    return () => clearTimeout(t);
    // Runs once when every file reaches 100%.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const start = () => {
    setTried(true);
    if (!valid.length || !subject.trim()) return;
    setUploading(true);
  };

  return (
    <Drawer
      title="Upload Resource"
      subtitle="PDF, EPUB, DOCX or PPTX, up to 50 MB each"
      width="max-w-[720px]"
      onClose={onClose}
      footer={(close) => {
        closeRef.current = close;
        return (
          <>
            <button type="button" onClick={close} disabled={uploading} className={`${ghostBtn} disabled:opacity-40`}>
              Cancel
            </button>
            <span className="flex-1" />
            <button type="button" onClick={start} disabled={uploading} className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-60")}>
              <Icon d={icons.upload} className="size-[18px]" />
              {uploading ? "Uploading..." : `Upload ${valid.length > 1 ? `${valid.length} Files` : "Resource"}`}
            </button>
          </>
        );
      }}
    >
      {() => (
        <div className="grid gap-5 p-5 sm:p-7">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (!uploading) add(e.dataTransfer.files);
            }}
            className={`grid justify-items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-9 text-center transition-colors ${drag ? "border-primary bg-primary/6" : tried && !valid.length ? "border-danger/60" : "border-ink/15 bg-surface/50"}`}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-linear-135 from-primary to-accent text-surface">
              <Icon d={icons.upload} className="size-7" />
            </span>
            <p className="text-[.95rem] font-bold">Drag and drop files here</p>
            <p className="text-[.8rem] text-ink/55">or</p>
            <button type="button" disabled={uploading} onClick={() => input.current?.click()} className={`${ghostBtn} disabled:opacity-40`}>
              Browse files
            </button>
            <input ref={input} type="file" multiple accept=".pdf,.epub,.docx,.pptx" className="sr-only" onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
            />
            {tried && !valid.length && <p className="text-[.8rem] font-semibold text-danger">Add at least one valid file.</p>}
          </div>

          {items.length > 0 && (
            <ul className="grid gap-2" aria-live="polite">
              {items.map((i) => (
                <li key={i.key} className={`flex items-center gap-3 rounded-xl border p-2.5 ${i.error ? "border-danger/30 bg-danger/5" : "border-ink/8"}`}>
                  <FileThumb ext={(allowedExt.includes(extOf(i.file.name) as Ext) ? extOf(i.file.name) : "pdf") as Ext} size="sm" />
                  <span className="grid min-w-0 flex-1 gap-1">
                    <span className="truncate text-[.86rem] font-bold">{i.file.name}</span>
                    {i.error ? (
                      <span className="text-[.76rem] font-semibold text-danger">{i.error}</span>
                    ) : (
                      <span className="grid grid-cols-[1fr_auto] items-center gap-2">
                        <Bar value={i.progress} fill={i.progress >= 100 ? "bg-ok" : "bg-primary"} label={`${i.file.name} upload ${Math.round(i.progress)}%`} />
                        <span className="w-[86px] text-right text-[.74rem] font-semibold text-ink/55">{i.progress >= 100 ? "Done" : uploading ? `${Math.round(i.progress)}%` : formatSize(i.file.size)}</span>
                      </span>
                    )}
                  </span>
                  {!uploading && (
                    <button type="button" onClick={() => setItems((x) => x.filter((y) => y.key !== i.key))} aria-label={`Remove ${i.file.name}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink/50 hover:bg-danger/8 hover:text-danger">
                      <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <fieldset disabled={uploading} className="grid gap-4">
            <label className={label}>
              Title {!single && <span className="font-normal text-ink/45">(multiple files keep their file names)</span>}
              <input value={single ? title : ""} disabled={!single} onChange={(e) => setTitle(e.target.value)} placeholder={single ? valid[0].file.name : "e.g. PTB Mathematics Keybook - Chapter 4"} className={`${fieldClass} disabled:bg-surface/60`} />
            </label>
            <label className={label}>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is inside and how students should use it" className={`${fieldClass} resize-y font-normal`} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Target class / grade
                <Select label="Grade" value={String(grade)} onChange={(v) => setGrade(Number(v))}>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              </label>
              <label className={label}>
                Target subject
                <input list="res-subjects" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" className={`${fieldClass} ${tried && !subject.trim() ? "border-danger" : ""}`} />
                <datalist id="res-subjects">
                  {subjectsForGrade(Math.min(grade, 10)).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
              <label className={label}>
                Folder destination
                <Select label="Folder" value={folder} onChange={setFolder}>
                  <option value="">Home (root)</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className={label}>
                Document category
                <Select label="Category" value={category} onChange={(v) => setCategory(v as Category)}>
                  {uploadCategories.map((c) => (
                    <option key={c} value={c}>
                      {categoryMeta[c].upload}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </fieldset>
        </div>
      )}
    </Drawer>
  );
}
