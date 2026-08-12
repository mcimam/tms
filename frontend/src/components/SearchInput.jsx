import { Search } from "lucide-react";

export function SearchInput({ value, onChange, placeholder = "Cari…", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
      />
    </div>
  );
}
