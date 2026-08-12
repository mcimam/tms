export function InfoBlock({ title, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Row({ k, v }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-200 text-right">{v || "-"}</span>
    </div>
  );
}
