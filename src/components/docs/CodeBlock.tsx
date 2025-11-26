"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CodeBlock({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = wrapperRef.current?.innerText ?? "";
    try {
      if (text.trim().length === 0) return;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // noop
    }
  }

  return (
    <div ref={wrapperRef} className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-white/15 bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-slate-200 opacity-0 shadow-sm transition hover:bg-slate-900 group-hover:opacity-100"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-emerald-400" /> Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5 text-sky-400" /> Copy
          </>
        )}
      </button>
      <pre className="mb-4 overflow-x-auto rounded-lg bg-slate-950/60 p-4 border border-white/10">
        {children}
      </pre>
    </div>
  );
}

