"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Select, Toast, fieldClass, ghostBtn, ghostSm, type ToastData } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  STORAGE_LIMIT,
  ago,
  categoryMeta,
  formatSize,
  pathOf,
  seedLibrary,
  subtree,
  typeFilters,
  type Folder,
  type Resource,
  type Role,
  type TypeFilter,
} from "@/lib/resources";
import { DeleteDialog, EditDrawer, FolderDialog, PreviewDrawer, downloadResource, type FolderDraft } from "./modals";
import { FileThumb, FolderGlyph, KebabMenu, icons } from "./parts";
import UploadDrawer from "./UploadDrawer";

type View = "grid" | "list";
type Modal =
  | { kind: "upload" }
  | { kind: "new-folder" }
  | { kind: "folder"; folder: Folder; mode: "Rename Folder" | "Change Class / Subject Tag" }
  | { kind: "delete-folder"; folder: Folder }
  | { kind: "preview"; file: Resource }
  | { kind: "edit"; file: Resource }
  | { kind: "delete-file"; file: Resource }
  | null;

const noop = () => () => {};
const clientNow = () => Math.floor(Date.now() / 60_000) * 60_000;

/**
 * Universal library. Everyone can browse, preview and download; only teachers and admins
 * see upload, folder and edit/delete controls (`role`). The backend must enforce the same rule.
 */
export default function ResourceHub({ role, user, allowStudentPreview = false }: { role: Role; user: string; allowStudentPreview?: boolean }) {
  const now = useSyncExternalStore(noop, clientNow, () => 0);
  if (!now) {
    return (
      <main className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] py-6 lg:py-8">
        <div className="h-[220px] animate-pulse rounded-[20px] bg-ink/8" />
      </main>
    );
  }
  return <Library now={now} role={role} user={user} allowStudentPreview={allowStudentPreview} />;
}

function Library({ now, role: realRole, user, allowStudentPreview }: { now: number; role: Role; user: string; allowStudentPreview: boolean }) {
  const [lib, setLib] = useState(() => seedLibrary(now));
  const [asStudent, setAsStudent] = useState(false);
  const role: Role = realRole === "teacher" && asStudent ? "student" : realRole;
  const canManage = role === "teacher";

  const [folderId, setFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("all");
  const [subject, setSubject] = useState("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [view, setView] = useState<View>("grid");
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const close = () => setModal(null);

  const { folders, files } = lib;
  const path = pathOf(folders, folderId);
  const scopeIds = useMemo(() => (folderId ? subtree(folders, folderId) : null), [folders, folderId]);
  const inScope = useCallback((f: Resource) => !scopeIds || scopeIds.has(f.folderId), [scopeIds]);

  const stats = useMemo(() => {
    const used = files.reduce((t, f) => t + f.size, 0);
    return {
      total: files.length,
      classes: folders.filter((f) => f.parentId === null && f.grade !== null && files.some((x) => x.grade === f.grade)).length,
      used,
      week: files.filter((f) => now - new Date(f.uploadedAt).getTime() < 7 * 86_400_000).length,
    };
  }, [files, folders, now]);

  const filtering = query.trim() !== "" || grade !== "all" || subject !== "all" || type !== "all";
  const q = query.trim().toLowerCase();
  const typeMatch = typeFilters.find((t) => t.key === type)!.match;

  // Subject pills come from what exists in the current scope and grade.
  const subjectPills = useMemo(
    () => [...new Set(files.filter((f) => inScope(f) && (grade === "all" || f.grade === Number(grade))).map((f) => f.subject))].sort(),
    [files, inScope, grade],
  );

  const results = files
    .filter(
      (f) =>
        inScope(f) &&
        (grade === "all" || f.grade === Number(grade)) &&
        (subject === "all" || f.subject === subject) &&
        (!typeMatch.length || typeMatch.includes(f.category)) &&
        (!q || `${f.title} ${f.subject} ${f.uploadedBy} ${f.description} ${categoryMeta[f.category].badge}`.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  const childFolders = folders.filter((f) => f.parentId === folderId).sort((a, b) => (a.grade !== null && b.grade !== null && a.parentId === null ? b.grade - a.grade : a.name.localeCompare(b.name)));
  const childFiles = files.filter((f) => f.folderId === (folderId ?? "")).sort((a, b) => a.title.localeCompare(b.title));
  const countIn = (id: string) => {
    const ids = subtree(folders, id);
    return files.filter((f) => ids.has(f.folderId)).length;
  };

  const shownFolders = filtering ? [] : childFolders;
  const shownFiles = filtering ? results : childFiles;

  const open = (id: string | null) => {
    setFolderId(id);
    setSubject("all");
  };
  const resetFilters = () => {
    setQuery("");
    setGrade("all");
    setSubject("all");
    setType("all");
  };

  /* ---------- Teacher-only mutations ---------- */

  const saveFolder = (draft: FolderDraft, existing?: Folder) => {
    const iso = new Date(now).toISOString();
    if (existing) {
      setLib((l) => ({ ...l, folders: l.folders.map((f) => (f.id === existing.id ? { ...f, ...draft, updated: iso } : f)) }));
      setToast({ text: `Folder "${draft.name}" updated.` });
    } else {
      const parent = folders.find((f) => f.id === folderId);
      const f: Folder = { id: `f-${draft.name.toLowerCase().replace(/\W+/g, "-")}-${folders.length}`, name: draft.name, parentId: folderId, grade: draft.grade ?? parent?.grade ?? null, subject: draft.subject ?? parent?.subject ?? null, updated: iso };
      setLib((l) => ({ ...l, folders: [...l.folders, f] }));
      setToast({ text: `Folder "${f.name}" created.`, action: { label: "Open", run: () => (open(f.id), setToast(null)) } });
    }
    close();
  };

  const deleteFolder = (folder: Folder) => {
    const ids = subtree(folders, folder.id);
    const prev = lib;
    setLib((l) => ({ folders: l.folders.filter((f) => !ids.has(f.id)), files: l.files.filter((f) => !ids.has(f.folderId)) }));
    if (folderId && ids.has(folderId)) open(folder.parentId);
    close();
    setToast({ text: `Folder "${folder.name}" deleted.`, action: { label: "Undo", run: () => (setLib(prev), setToast(null)) } });
  };

  const deleteFile = (file: Resource) => {
    const prev = lib;
    setLib((l) => ({ ...l, files: l.files.filter((f) => f.id !== file.id) }));
    close();
    setToast({ text: `"${file.title}" deleted. Students no longer have access.`, action: { label: "Undo", run: () => (setLib(prev), setToast(null)) } });
  };

  const fileActions = (f: Resource, compact = false) => (
    <div className="flex flex-nowrap items-center gap-1">
      <button type="button" onClick={() => setModal({ kind: "preview", file: f })} title="Preview in Browser" aria-label={`Preview ${f.title}`} className={ghostSm}>
        <Icon d={icons.eye} className="size-4" />
        {!compact && "Preview"}
      </button>
      <button type="button" onClick={() => downloadResource(f)} title="Download File" aria-label={`Download ${f.title}`} className={ghostSm}>
        <Icon d={icons.download} className="size-4" />
        {!compact && "Download"}
      </button>
      {canManage && (
        <KebabMenu
          label={`Manage ${f.title}`}
          items={[
            { label: "Edit Details / Replace File", icon: icons.edit, run: () => setModal({ kind: "edit", file: f }) },
            { label: "Delete Resource", icon: icons.trash, danger: true, run: () => setModal({ kind: "delete-file", file: f }) },
          ]}
        />
      )}
    </div>
  );

  const folderMenu = (f: Folder) =>
    canManage ? (
      <KebabMenu
        label={`Manage folder ${f.name}`}
        items={[
          { label: "Rename", icon: icons.edit, run: () => setModal({ kind: "folder", folder: f, mode: "Rename Folder" }) },
          { label: "Change Class / Subject Tag", icon: icons.tag, run: () => setModal({ kind: "folder", folder: f, mode: "Change Class / Subject Tag" }) },
          { label: "Delete Folder", icon: icons.trash, danger: true, run: () => setModal({ kind: "delete-folder", folder: f }) },
        ]}
      />
    ) : null;

  const folderTitle = (f: Folder) => (f.parentId && f.grade !== null ? `Grade ${f.grade} - ${f.subject && f.subject !== f.name ? `${f.subject} ${f.name}` : f.name}` : f.name);
  const tags = (f: Resource) => (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[.7rem] font-bold text-primary">Class {f.grade}</span>
      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[.7rem] font-bold text-[#3d6e71]">{f.subject}</span>
      <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[.7rem] font-bold text-ink/65">{categoryMeta[f.category].badge}</span>
    </span>
  );
  const pathLabel = (id: string) => pathOf(folders, id).map((p) => p.name).join(" > ") || "Home";

  const defaultGrade = grade !== "all" ? Number(grade) : (path.find((p) => p.grade !== null)?.grade ?? 10);
  const defaultSubject = subject !== "all" ? subject : (path.find((p) => p.subject)?.subject ?? "Mathematics");

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {allowStudentPreview && realRole === "teacher" ? (
          <div role="group" aria-label="View as" className="flex items-center gap-1 rounded-xl border border-ink/10 bg-white p-1 shadow-[0_10px_30px_rgba(6,30,41,.05)]">
            {[
              [false, "Teacher view"],
              [true, "Preview as student"],
            ].map(([v, l]) => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={asStudent === v}
                onClick={() => setAsStudent(v as boolean)}
                className={`cursor-pointer rounded-lg px-3.5 py-2 text-[.82rem] font-bold transition-colors ${asStudent === v ? "bg-primary text-surface" : "text-ink/60 hover:text-primary"}`}
              >
                {l as string}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {canManage ? (
          <div className="flex flex-wrap gap-2.5 max-sm:w-full">
            <button type="button" onClick={() => setModal({ kind: "new-folder" })} className={`${ghostBtn} max-sm:flex-1`}>
              <Icon d={icons.folderPlus} className="size-[18px]" />
              New Subject Folder
            </button>
            <button type="button" onClick={() => setModal({ kind: "upload" })} className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1")}>
              <Icon d={icons.upload} className="size-[18px]" />
              Upload Resource
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3.5 py-2 text-[.8rem] font-semibold text-primary">
            <Icon d="M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z" className="size-4" />
            Read-only library: browse, preview and download
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard label="Total Indexed Resources" value={`${stats.total} Documents`} icon="M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6" note="Textbooks, guides, papers and slides" />
        <StatCard label="Class Folders" value={`${stats.classes} Classes Active`} icon={icons.folderPlus} note={`${folders.length} folders in total`} />
        <StatCard
          label="Storage Utilization"
          value={`${formatSize(stats.used)} / 20 GB`}
          icon="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"
          note={`${Math.round((stats.used / STORAGE_LIMIT) * 100)}% used`}
        />
        <StatCard label="Recently Added" value={`${stats.week} Added`} icon="M12 5v14 M5 12h14" note="this week" />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search resources</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, subject, author or keyword" className={`${fieldClass} w-full pl-10`} />
          </label>
          <Select
            label="Class / grade"
            value={grade}
            onChange={(v) => {
              setGrade(v);
              setSubject("all");
            }}
            className="lg:w-[180px]"
          >
            <option value="all">All Classes</option>
            {Array.from({ length: 10 }, (_, i) => 10 - i).map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </Select>
          <div role="group" aria-label="View mode" className="flex rounded-xl border border-ink/10 p-1">
            {(
              [
                ["grid", "Folder Grid", "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z"],
                ["list", "File List", "M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14"],
              ] as const
            ).map(([v, l, ic]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[.82rem] font-semibold transition-colors ${view === v ? "bg-primary text-surface" : "text-ink/60 hover:text-primary"}`}
              >
                <Icon d={ic} className="size-4" />
                {l}
              </button>
            ))}
          </div>
        </div>

        <div role="group" aria-label="Subject" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {["all", ...subjectPills].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={subject === s}
              onClick={() => setSubject(s)}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[.8rem] font-semibold transition-colors ${subject === s ? "border-primary bg-primary text-surface" : "border-ink/12 text-ink/70 hover:border-accent hover:text-primary"}`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <div role="group" aria-label="File type" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {typeFilters.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={type === t.key}
              onClick={() => setType(t.key)}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3 py-1 text-[.76rem] font-bold transition-colors ${type === t.key ? "border-ink bg-ink text-surface" : "border-ink/12 text-ink/60 hover:border-accent hover:text-primary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <nav aria-label="Folder path" className="flex flex-wrap items-center gap-1 rounded-xl bg-surface/70 px-3 py-2 text-[.84rem]">
          <button type="button" onClick={() => open(null)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 font-bold ${folderId ? "text-primary hover:bg-white" : "text-ink"}`}>
            <Icon d={icons.home} className="size-4" />
            Home
          </button>
          {path.map((p, i) => (
            <span key={p.id} className="inline-flex items-center gap-1">
              <Icon d="M9 6l6 6-6 6" className="size-3.5 text-ink/35" />
              {i === path.length - 1 ? (
                <span aria-current="page" className="px-2 py-1 font-bold">
                  {p.name}
                </span>
              ) : (
                <button type="button" onClick={() => open(p.id)} className="cursor-pointer rounded-lg px-2 py-1 font-bold text-primary hover:bg-white">
                  {p.name}
                </button>
              )}
            </span>
          ))}
          {filtering && (
            <span className="ml-auto inline-flex items-center gap-2 text-[.78rem] text-ink/60" aria-live="polite">
              <strong className="text-ink">{results.length}</strong> matching files
              <button type="button" onClick={resetFilters} className={ghostSm}>
                Clear
              </button>
            </span>
          )}
        </nav>

        {shownFolders.length === 0 && shownFiles.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-14 text-center">
            <FolderGlyph subject={null} className="size-14" />
            <p className="font-bold">{filtering ? "No resources match these filters" : "This folder is empty"}</p>
            <p className="max-w-[380px] text-[.86rem] text-ink/55">{filtering ? "Try another subject, type or keyword." : canManage ? "Upload a file or create a sub-folder to get started." : "Your teachers have not added material here yet."}</p>
            {canManage && !filtering && (
              <button type="button" onClick={() => setModal({ kind: "upload" })} className={buttonClass("primary", "md", "cursor-pointer")}>
                <Icon d={icons.upload} className="size-[18px]" />
                Upload Resource
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-5">
            {shownFolders.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {shownFolders.map((f) => (
                  <li key={f.id} className="group relative flex items-center gap-3.5 rounded-[18px] border border-ink/8 bg-white p-4 transition-[box-shadow,translate,border-color] duration-300 ease-soft hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_16px_36px_rgba(6,30,41,.08)]">
                    <FolderGlyph subject={f.subject} />
                    <button type="button" onClick={() => open(f.id)} className="grid min-w-0 flex-1 cursor-pointer text-left after:absolute after:inset-0">
                      <span className="truncate text-[.95rem] font-extrabold">{folderTitle(f)}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[.74rem] text-ink/55">
                        <span className="rounded-full bg-ink/6 px-2 py-0.5 font-bold text-ink/70">{countIn(f.id)} Files</span>
                        Updated {ago(f.updated, now)}
                      </span>
                    </button>
                    <div className="relative z-10">{folderMenu(f)}</div>
                  </li>
                ))}
              </ul>
            )}
            {shownFiles.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {shownFiles.map((f) => (
                  <li key={f.id} className="flex flex-col gap-3 rounded-[18px] border border-ink/8 bg-white p-4 transition-shadow hover:shadow-[0_16px_36px_rgba(6,30,41,.08)]">
                    <div className="flex items-start gap-3">
                      <FileThumb ext={f.ext} />
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <button type="button" onClick={() => setModal({ kind: "preview", file: f })} className="line-clamp-2 cursor-pointer text-left text-[.9rem] font-bold leading-snug hover:text-primary">
                          {f.title}
                        </button>
                        <span className="text-[.74rem] text-ink/50">
                          {formatSize(f.size)}
                          {filtering && ` · ${pathLabel(f.folderId)}`}
                        </span>
                      </span>
                    </div>
                    {tags(f)}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 pt-3">
                      <span className="text-[.74rem] text-ink/55">
                        Uploaded by <strong className="text-ink/75">{f.uploadedBy}</strong> · {ago(f.uploadedAt, now)}
                      </span>
                      {fileActions(f, true)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[18px] border border-ink/8">
            <table className="w-full min-w-[900px] text-left text-[.84rem]">
              <thead className="bg-surface/70 text-[.7rem] font-bold uppercase tracking-[.1em] text-ink/50">
                <tr>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-3 py-3">Classification</th>
                  <th scope="col" className="px-3 py-3">Size</th>
                  <th scope="col" className="px-3 py-3">Uploaded</th>
                  <th scope="col" className="px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {shownFolders.map((f) => (
                  <tr key={f.id} className="transition-colors hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => open(f.id)} className="flex cursor-pointer items-center gap-3 text-left">
                        <FolderGlyph subject={f.subject} className="size-10" />
                        <span className="font-bold">{folderTitle(f)}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-ink/60">{countIn(f.id)} Files</td>
                    <td className="px-3 py-3 text-ink/40">-</td>
                    <td className="px-3 py-3 text-ink/60">Updated {ago(f.updated, now)}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end">{folderMenu(f)}</div>
                    </td>
                  </tr>
                ))}
                {shownFiles.map((f) => (
                  <tr key={f.id} className="transition-colors hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileThumb ext={f.ext} size="sm" />
                        <span className="grid min-w-0">
                          <button type="button" onClick={() => setModal({ kind: "preview", file: f })} className="cursor-pointer text-left font-bold hover:text-primary">
                            {f.title}
                          </button>
                          {filtering && <span className="text-[.72rem] text-ink/50">{pathLabel(f.folderId)}</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">{tags(f)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-ink/65">{formatSize(f.size)}</td>
                    <td className="px-3 py-3 text-[.78rem] text-ink/60">
                      {f.uploadedBy}
                      <br />
                      {ago(f.uploadedAt, now)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end">{fileActions(f, true)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal?.kind === "upload" && canManage && (
        <UploadDrawer
          folders={folders}
          folderId={folderId}
          grade={defaultGrade}
          subject={defaultSubject}
          uploader={user}
          now={now}
          onClose={close}
          onUpload={(added) => {
            setLib((l) => ({ ...l, files: [...added, ...l.files] }));
            setToast({ text: `${added.length} file${added.length === 1 ? "" : "s"} uploaded and now visible to students.` });
          }}
        />
      )}
      {modal?.kind === "new-folder" && canManage && (
        <FolderDialog
          title="New Subject Folder"
          initial={{ name: "", grade: path.find((p) => p.grade !== null)?.grade ?? null, subject: path.find((p) => p.subject)?.subject ?? null }}
          onSave={(d) => saveFolder(d)}
          onClose={close}
        />
      )}
      {modal?.kind === "folder" && canManage && <FolderDialog title={modal.mode} initial={modal.folder} onSave={(d) => saveFolder(d, modal.folder)} onClose={close} />}
      {modal?.kind === "delete-folder" && canManage && (
        <DeleteDialog
          heading={`Delete "${modal.folder.name}"?`}
          body={`This removes the folder, its sub-folders and ${countIn(modal.folder.id)} files. Students will no longer have access.`}
          onConfirm={() => deleteFolder(modal.folder)}
          onClose={close}
        />
      )}
      {modal?.kind === "preview" && <PreviewDrawer r={modal.file} onClose={close} onDownload={() => downloadResource(modal.file)} />}
      {modal?.kind === "edit" && canManage && (
        <EditDrawer
          r={modal.file}
          folders={folders}
          onClose={close}
          onSave={(r) => {
            setLib((l) => ({ ...l, files: l.files.map((f) => (f.id === r.id ? r : f)) }));
            setToast({ text: `"${r.title}" updated.` });
          }}
        />
      )}
      {modal?.kind === "delete-file" && canManage && (
        <DeleteDialog heading="Delete this resource?" body="Are you sure you want to delete this resource? Students will no longer have access." onConfirm={() => deleteFile(modal.file)} onClose={close} />
      )}
      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
