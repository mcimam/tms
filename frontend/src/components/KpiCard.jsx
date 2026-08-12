export function KpiCard({ label, value, accent }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex-1 min-w-[130px]">
      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</p>
      <p className={`font-condensed text-3xl font-bold ${accent || "text-slate-100"}`}>{value}</p>
    </div>
  );
}
