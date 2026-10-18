"use client";

import { useEffect, useState } from "react";
import { Dialog, Drawer, Select, fieldClass, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MAX_UPLOAD, allowedExt, categoryMeta, extOf, formatSize, placeholderPdf, subjectsForGrade, type Category, type Ext, type Folder, type Resource } from "@/lib/resources";
import { FileThumb, icons } from "./parts";
import { folderOptions } from "./UploadDrawer";

const label = "grid gap-1.5 text-[.8rem] font-bold text-ink/70";
const grades = Array.from({ length: 12 }, (_, i) => i + 1);

/** Text lines for the generated stand-in PDF of a library file. */
export const pdfLines = (r: Resource) => [
  `Grade ${r.grade} - ${r.subject}`,
  categoryMeta[r.category].badge,
  r.description,
  `Uploaded by ${r.uploadedBy}`,
  "",
  "Preview copy from the school Resource Hub.",
  "The full document is served once the library backend is connected.",
];

/** Saves the real uploaded file, or a generated PDF copy for library files. */
export function downloadResource(r: Resource) {
  const a = document.createElement("a");
  if (r.url) {
    a.href = r.url;
    a.download = r.title;
    a.click();
    return;
  }
  const url = URL.createObjectURL(placeholderPdf(r.title, pdfLines(r)));
  a.href = url;
  a.download = r.ext === "pdf" ? r.title : `${r.title.replace(/\.\w+$/, "")} (preview).pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** In-app viewer: PDFs render in the browser viewer; slides and documents get a paged mock preview. */
export function PreviewDrawer({ r, onClose, onDownload }: { r: Resource; onClose: () => void; onDownload: () => void }) {
  // Library files get a generated PDF; uploads already have an object URL.
  const [generated] = useState(() => (r.ext === "pdf" && !r.url ? URL.createObjectURL(placeholderPdf(r.title, pdfLines(r))) : null));
  useEffect(() => () => void (generated && URL.revokeObjectURL(generated)), [generated]);
  const src = r.url ?? generated;

  return (
    <Drawer
      title={r.title}
      subtitle={`Grade ${r.grade} · ${r.subject} · ${formatSize(r.size)}`}
      width="max-w-[960px]"
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={ghostBtn}>
            Close
          </button>
          <span className="flex-1" />
          <button type="button" onClick={onDownload} className={buttonClass("primary", "md", "cursor-pointer")}>
            <Icon d={icons.download} className="size-[18px]" />
            Download File
          </button>
        </>
      )}
    >
      {() =>
        r.ext === "pdf" ? (
          src ? <iframe src={src} title={`Preview of ${r.title}`} className="h-full min-h-[70vh] w-full border-0 bg-surface" /> : null
        ) : (
          <div className="grid gap-5 bg-surface/70 p-5 sm:p-8">
            {[0, 1].map((page) => (
              <div
                key={page}
                className={`mx-auto w-full rounded-lg bg-white p-6 shadow-[0_10px_30px_rgba(6,30,41,.12)] sm:p-9 ${r.ext === "pptx" ? "aspect-video max-w-[760px]" : "max-w-[620px]"}`}
              >
                {page === 0 ? (
                  <div className={r.ext === "pptx" ? "grid h-full content-center gap-3 text-center" : "grid gap-3"}>
                    <p className="text-[.72rem] font-bold uppercase tracking-[.16em] text-accent">
                      Grade {r.grade} · {r.subject}
                    </p>
                    <h3 className="text-[1.5rem] font-extrabold leading-tight tracking-tight">{r.title.replace(/\.\w+$/, "")}</h3>
                    <p className="text-[.9rem] text-ink/60">{r.description || categoryMeta[r.category].badge}</p>
                  </div>
                ) : (
                  <div className="grid gap-2.5" aria-hidden>
                    {Array.from({ length: r.ext === "pptx" ? 5 : 12 }, (_, i) => (
                      <span key={i} className="h-2.5 rounded-full bg-ink/8" style={{ width: `${60 + ((i * 37) % 40)}%` }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <p className="text-center text-[.8rem] text-ink/55">
              {r.url ? "In-browser preview supports PDF. Download the file to open it in Word or PowerPoint." : "Preview pages. Download for the full document."}
            </p>
          </div>
        )
      }
    </Drawer>
  );
}

/** Edit metadata and optionally swap the file. */
export function EditDrawer({ r, folders, onSave, onClose }: { r: Resource; folders: Folder[]; onSave: (r: Resource) => void; onClose: () => void }) {
  const [title, setTitle] = useState(r.title.replace(/\.\w+$/, ""));
  const [description, setDescription] = useState(r.description);
  const [grade, setGrade] = useState(r.grade);
  const [subject, setSubject] = useState(r.subject);
  const [category, setCategory] = useState<Category>(r.category);
  const [folder, setFolder] = useState(r.folderId);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const save = () => {
    if (!title.trim() || !subject.trim()) return setError("Title and subject are required.");
    const ext = file ? (extOf(file.name) as Ext) : r.ext;
    onSave({
      ...r,
      title: `${title.trim()}.${ext}`,
      description: description.trim(),
      grade,
      subject: subject.trim(),
      category,
      folderId: folder,
      ...(file ? { ext, size: file.size, url: URL.createObjectURL(file) } : {}),
    });
    return true;
  };

  return (
    <Drawer
      title="Edit Details / Replace File"
      subtitle={r.title}
      width="max-w-[640px]"
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={ghostBtn}>
            Cancel
          </button>
          <span className="flex-1" />
          <button type="button" onClick={() => save() === true && close()} className={buttonClass("primary", "md", "cursor-pointer")}>
            Save Changes
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-4 p-5 sm:p-7">
          <label className={label}>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </label>
          <label className={label}>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${fieldClass} resize-y font-normal`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Class / grade
              <Select label="Grade" value={String(grade)} onChange={(v) => setGrade(Number(v))}>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </Select>
            </label>
            <label className={label}>
              Subject
              <input list="edit-subjects" value={subject} onChange={(e) => setSubject(e.target.value)} className={fieldClass} />
              <datalist id="edit-subjects">
                {subjectsForGrade(Math.min(grade, 10)).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <label className={label}>
              Category
              <Select label="Category" value={category} onChange={(v) => setCategory(v as Category)}>
                {(Object.keys(categoryMeta) as Category[]).map((c) => (
                  <option key={c} value={c}>
                    {categoryMeta[c].upload}
                  </option>
                ))}
              </Select>
            </label>
            <label className={label}>
              Folder
              <Select label="Folder" value={folder} onChange={setFolder}>
                <option value="">Home (root)</option>
                {folderOptions(folders).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <div className="grid gap-2 rounded-2xl border border-ink/8 p-4">
            <span className="text-[.8rem] font-bold text-ink/70">Replace file</span>
            <div className="flex flex-wrap items-center gap-3">
              <FileThumb ext={file ? ((allowedExt.includes(extOf(file.name) as Ext) ? extOf(file.name) : r.ext) as Ext) : r.ext} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[.86rem] font-semibold">{file ? `${file.name} · ${formatSize(file.size)}` : `Current: ${r.title} · ${formatSize(r.size)}`}</span>
              <label className={`${ghostBtn} cursor-pointer`}>
                Choose file
                <input
                  type="file"
                  accept=".pdf,.epub,.docx,.pptx"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    if (!allowedExt.includes(extOf(f.name) as Ext)) return setError("Only PDF, EPUB, DOCX and PPTX files are allowed.");
                    if (f.size > MAX_UPLOAD) return setError("The replacement file is larger than 50 MB.");
                    setError("");
                    setFile(f);
                  }}
                />
              </label>
            </div>
          </div>
          {error && <p className="text-[.82rem] font-semibold text-danger">{error}</p>}
        </div>
      )}
    </Drawer>
  );
}

export type FolderDraft = { name: string; grade: number | null; subject: string | null };

/** Create a folder, or rename / retag an existing one. */
export function FolderDialog({ title, initial, onSave, onClose }: { title: string; initial: FolderDraft; onSave: (f: FolderDraft) => void; onClose: () => void }) {
  const [name, setName] = useState(initial.name);
  const [grade, setGrade] = useState(initial.grade);
  const [subject, setSubject] = useState(initial.subject ?? "");
  const [tried, setTried] = useState(false);
  return (
    <Dialog label={title} onClose={onClose}>
      <span className="grid size-12 place-items-center rounded-2xl bg-linear-135 from-primary to-accent text-surface">
        <Icon d={icons.folderPlus} className="size-6" />
      </span>
      <h2 className="mt-4 text-[1.2rem] font-extrabold tracking-tight">{title}</h2>
      <div className="mt-4 grid gap-4">
        <label className={label}>
          Folder name
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Past Papers 2021-2025" className={`${fieldClass} ${tried && !name.trim() ? "border-danger" : ""}`} />
          {tried && !name.trim() && <span className="font-semibold text-danger">Name the folder.</span>}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Class
            <Select label="Class" value={grade === null ? "" : String(grade)} onChange={(v) => setGrade(v ? Number(v) : null)}>
              <option value="">All classes</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </Select>
          </label>
          <label className={label}>
            Subject
            <input list="folder-subjects" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="All subjects" className={fieldClass} />
            <datalist id="folder-subjects">
              {subjectsForGrade(Math.min(grade ?? 10, 10)).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => {
            setTried(true);
            if (name.trim()) onSave({ name: name.trim(), grade, subject: subject.trim() || null });
          }}
          className={buttonClass("primary", "md", "flex-1 cursor-pointer")}
        >
          Save Folder
        </button>
        <button type="button" onClick={onClose} className={`${ghostBtn} flex-1`}>
          Cancel
        </button>
      </div>
    </Dialog>
  );
}

/** Red confirmation for deleting a file or a folder. */
export function DeleteDialog({ heading, body, onConfirm, onClose }: { heading: string; body: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog label={heading} onClose={onClose}>
      <span className="grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger">
        <Icon d={icons.trash} className="size-6" />
      </span>
      <h2 className="mt-4 text-[1.2rem] font-extrabold tracking-tight">{heading}</h2>
      <p className="mt-1.5 text-[.9rem] text-ink/65">{body}</p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button type="button" onClick={onConfirm} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-danger px-[22px] py-[11px] text-[.95rem] font-semibold text-white transition-colors hover:bg-[#a33125]">
          <Icon d={icons.trash} className="size-[18px]" />
          Delete
        </button>
        <button type="button" onClick={onClose} className={`${ghostBtn} flex-1`}>
          Cancel
        </button>
      </div>
    </Dialog>
  );
}
