import { STAGE_DOT, STAGE_LABEL } from "../lib/constants.js";

export function StatusPill({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border border-slate-700 bg-slate-800/70 text-slate-200">
      <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[status]}`} />
      {STAGE_LABEL[status]}
    </span>
  );
}
