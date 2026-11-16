import { Spinner } from "@/components/auth/fields";
import { buttonClass } from "@/components/ui/Button";

// Small pieces shared by the My Profile pages.

export type SaveStatus = "idle" | "saving" | "saved";

export const accountPanel = "rounded-[22px] border border-ink/10 bg-white p-5 shadow-[0_20px_50px_rgba(6,30,41,.06)] sm:p-8";

export function SaveButton({ status, label }: { status: SaveStatus; label: string }) {
  return (
    <button type="submit" disabled={status === "saving"} className={buttonClass("primary", "md", "cursor-pointer disabled:cursor-wait max-sm:w-full")}>
      {status === "saving" ? (
        <>
          <Spinner />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function Saved({ show, text }: { show: boolean; text: string }) {
  return (
    <p role="status" className={`text-[.88rem] font-semibold text-ok transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}>
      {show && text}
    </p>
  );
}
