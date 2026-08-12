import { STAGE_LABEL, STAGES } from "../lib/constants.js";

export function RouteStrip({ status }) {
  const idx = STAGES.indexOf(status);
  return (
    <div className="flex items-center w-full">
      {STAGES.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${i <= idx ? "bg-amber-400" : "bg-slate-700"}`}
            title={STAGE_LABEL[s]}
          />
          {i < STAGES.length - 1 && (
            <div className={`h-0.5 flex-1 ${i < idx ? "bg-amber-400" : "bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
