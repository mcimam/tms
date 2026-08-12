import { ArrowLeft, Camera, Truck as TruckIcon, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AuditLogList } from "../components/AuditLogList.jsx";
import { Field } from "../components/Field.jsx";
import { InfoBlock, Row } from "../components/InfoBlock.jsx";
import { RouteStrip } from "../components/RouteStrip.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { useDrivers } from "../hooks/useDrivers.js";
import {
  useAssignOrder, useOrder, useOrderPhotos, useUpdateOrderLocation, useUpdateOrderStatus, useUploadPhoto,
} from "../hooks/useOrders.js";
import { useTrucks } from "../hooks/useTrucks.js";
import { ordersApi } from "../api/orders.js";
import { STAGE_LABEL, STAGES } from "../lib/constants.js";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id, { refetchInterval: 10000 });
  const { data: availableDrivers = [] } = useDrivers({ status_filter: "available" });
  const { data: availableTrucks = [] } = useTrucks({ status_filter: "available" });
  const { data: photos = [] } = useOrderPhotos(id);

  const assignOrder = useAssignOrder();
  const updateStatus = useUpdateOrderStatus();
  const updateLocation = useUpdateOrderLocation();
  const uploadPhoto = useUploadPhoto();

  const [driverId, setDriverId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [statusForm, setStatusForm] = useState("");
  const [posForm, setPosForm] = useState(null);
  const fileInputRef = useRef(null);
  const [photoUrls, setPhotoUrls] = useState({});

  if (isLoading || !order) {
    return <div className="p-6 text-slate-500 text-sm">Memuat…</div>;
  }

  const canUpdatePosition = !["ORDER", "COMPLETED"].includes(order.status);
  const canUpdateStatus = order.status !== "ORDER";
  const pos = posForm || {
    current_location: order.current_location || "",
    eta: order.eta || "",
    est_unload_start: order.est_unload_start || "",
    est_unload_end: order.est_unload_end || "",
  };

  async function ensurePhotoUrl(photoId) {
    if (photoUrls[photoId]) return photoUrls[photoId];
    const blob = await ordersApi.photoFileBlob(id, photoId);
    const url = URL.createObjectURL(blob);
    setPhotoUrls((prev) => ({ ...prev, [photoId]: url }));
    return url;
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) uploadPhoto.mutate({ id, file });
    e.target.value = "";
  }

  return (
    <div className="p-6 space-y-5">
      <button onClick={() => navigate("/orders")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} /> Kembali
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-condensed text-2xl font-bold text-slate-100">{order.order_no}</h1>
          <p className="text-sm text-slate-500">{order.customer_name}</p>
        </div>
        <StatusPill status={order.status} />
      </div>

      {order.status !== "ORDER" && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-400/15 flex items-center justify-center">
              <TruckIcon size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Truck</p>
              <p className="font-mono-data text-sm text-slate-100">{order.truck_plate || "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-400/15 flex items-center justify-center">
              <Users size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Driver</p>
              <p className="text-sm text-slate-100">{order.driver_name || "-"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <RouteStrip status={order.status} />
        <div className="flex justify-between mt-2 text-[11px] text-slate-500">
          {STAGES.map((s) => (
            <span key={s} className="w-8 text-center -ml-3 first:ml-0">
              {STAGE_LABEL[s].split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoBlock title="Detail Pengiriman">
          <Row k="Lokasi Muat" v={order.load_location} />
          <Row k="Lokasi Bongkar" v={order.unload_location} />
          <Row k="Tanggal Kirim" v={order.ship_date} />
          <Row k="Jam Muat" v={order.load_time} />
          <Row k="Jenis Barang" v={order.cargo_type} />
          <Row k="Tonase" v={order.tonnage} />
          <Row k="Catatan" v={order.notes} />
        </InfoBlock>

        <InfoBlock title="Assignment & ETA">
          {order.status === "ORDER" ? (
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Driver</span>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  disabled={availableDrivers.length === 0}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 disabled:opacity-50"
                >
                  <option value="">Pilih driver</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {availableDrivers.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">Tidak ada driver berstatus Available. Semua driver sedang on trip.</p>
                )}
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Truck</span>
                <select
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  disabled={availableTrucks.length === 0}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 disabled:opacity-50"
                >
                  <option value="">Pilih truck</option>
                  {availableTrucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.plate} ({t.type})
                    </option>
                  ))}
                </select>
                {availableTrucks.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">Tidak ada truck berstatus Available. Semua truck sedang on trip.</p>
                )}
              </label>
              <button
                disabled={!driverId || !truckId || assignOrder.isPending}
                onClick={() => assignOrder.mutate({ id, driverId: Number(driverId), truckId: Number(truckId) })}
                className="bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 text-sm font-semibold px-4 py-2 rounded-md"
              >
                Assign Driver & Truck
              </button>
              {assignOrder.isError && <p className="text-xs text-red-400">{assignOrder.error.message}</p>}
            </div>
          ) : (
            <>
              <Row k="Posisi Saat Ini" v={order.current_location} />
              <Row k="ETA" v={order.eta} />
              <Row k="Estimasi Bongkar" v={`${order.est_unload_start || "-"} - ${order.est_unload_end || "-"}`} />
            </>
          )}
        </InfoBlock>
      </div>

      <InfoBlock title="Riwayat Status Order">
        <AuditLogList
          entityType="order"
          entityId={id}
          emptyText="Belum ada perubahan status tercatat."
        />
      </InfoBlock>

      {canUpdateStatus && (
        <InfoBlock title="Update Status Order (Manual)">
          <p className="text-xs text-slate-500 -mt-1 mb-2">
            Status TIDAK berubah otomatis. Admin memilih status sesuai kondisi terkini lalu menyimpan.
          </p>
          <div className="flex items-end gap-3">
            <label className="block flex-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Status Order</span>
              <select
                value={statusForm || order.status}
                onChange={(e) => setStatusForm(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100"
              >
                {STAGES.filter((s) => s !== "ORDER").map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => updateStatus.mutate({ id, status: statusForm || order.status })}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-semibold px-4 py-2 rounded-md"
            >
              Simpan Status
            </button>
          </div>
        </InfoBlock>
      )}

      {canUpdatePosition && (
        <InfoBlock title="Update Posisi & ETA (Manual)">
          <p className="text-xs text-slate-500 -mt-1 mb-2">Diisi manual oleh admin, atau berdasarkan info yang dikirim driver.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posisi Truck Saat Ini" value={pos.current_location} onChange={(v) => setPosForm({ ...pos, current_location: v })} />
            <Field label="ETA" value={pos.eta} onChange={(v) => setPosForm({ ...pos, eta: v })} />
            <Field label="Estimasi Bongkar Mulai" value={pos.est_unload_start} onChange={(v) => setPosForm({ ...pos, est_unload_start: v })} />
            <Field label="Estimasi Bongkar Selesai" value={pos.est_unload_end} onChange={(v) => setPosForm({ ...pos, est_unload_end: v })} />
          </div>
          <button
            onClick={() => updateLocation.mutate({ id, data: pos })}
            className="mt-1 bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-semibold px-4 py-2 rounded-md"
          >
            Simpan Update
          </button>
        </InfoBlock>
      )}

      <InfoBlock title="Foto Bukti">
        <div className="flex flex-wrap gap-3">
          {photos.map((p) => (
            <PhotoThumb key={p.id} photo={p} loadUrl={ensurePhotoUrl} />
          ))}
          {photos.length === 0 && <p className="text-sm text-slate-500">Belum ada foto.</p>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadPhoto.isPending}
          className="mt-2 flex items-center gap-2 border border-slate-700 text-slate-200 text-sm font-semibold px-4 py-2 rounded-md hover:border-slate-500 disabled:opacity-60"
        >
          <Camera size={15} /> {uploadPhoto.isPending ? "Mengunggah…" : "Upload Foto"}
        </button>
      </InfoBlock>
    </div>
  );
}

function PhotoThumb({ photo, loadUrl }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadUrl(photo.id).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [photo.id]);

  return (
    <a href={url || undefined} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-md overflow-hidden border border-slate-800 bg-slate-950">
      {url ? (
        <img src={url} alt={photo.original_filename || "photo"} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">…</div>
      )}
    </a>
  );
}
