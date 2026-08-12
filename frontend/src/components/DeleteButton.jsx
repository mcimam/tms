import { Trash2 } from "lucide-react";

export function DeleteButton({ mutation, id, confirmMessage = "Yakin ingin menghapus data ini?" }) {
  function handleClick(e) {
    e.stopPropagation();
    if (!window.confirm(confirmMessage)) return;
    mutation.mutate(id, {
      onError: (err) => alert(err.message || "Gagal menghapus data."),
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      title="Hapus"
      className="text-slate-500 hover:text-red-400 disabled:opacity-50"
    >
      <Trash2 size={15} />
    </button>
  );
}
