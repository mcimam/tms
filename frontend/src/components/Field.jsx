const PICKER_TYPES = new Set(["date", "time", "datetime-local"]);

export function Field({ label, value, onChange, type = "text", required = false, error = "" }) {
  const isPicker = PICKER_TYPES.has(type);

  function openPicker(e) {
    if (isPicker) e.currentTarget.showPicker?.();
  }

  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={openPicker}
        className={`mt-1 w-full bg-slate-950 border rounded-md px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 ${
          isPicker ? "cursor-pointer [color-scheme:dark]" : ""
        } ${error ? "border-red-500" : "border-slate-700"}`}
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
