import { Camera, ChevronRight, LogOut, MapPin, Navigation, Smartphone } from "lucide-react";
import { useRef, useState } from "react";

import { StatusPill } from "../components/StatusPill.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { useOrderPhotos, useOrders, useUpdateOrderLocation, useUploadPhoto } from "../hooks/useOrders.js";

export default function DriverMobilePage() {
  const { user, logout } = useAuth();
  const { data: ordersRes } = useOrders({ page_size: 50 }, { refetchInterval: 10000 });
  const orders = ordersRes?.items || [];
  const trip = orders.find((o) => o.status !== "COMPLETED");

  const updateLocation = useUpdateOrderLocation();
  const uploadPhoto = useUploadPhoto();
  const { data: photos = [] } = useOrderPhotos(trip?.id);

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [locForm, setLocForm] = useState({ current_location: "", eta: "" });
  const fileInputRef = useRef(null);

  function openUpdateForm() {
    setLocForm({ current_location: trip?.current_location || "", eta: trip?.eta || "" });
    setShowUpdateForm(true);
  }

  function saveLocation() {
    updateLocation.mutate(
      { id: trip.id, data: locForm },
      { onSuccess: () => setShowUpdateForm(false) },
    );
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file && trip) uploadPhoto.mutate({ id: trip.id, file });
    e.target.value = "";
  }

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center py-8 px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Driver App</p>
            <p className="font-condensed text-lg font-bold text-slate-100">{user?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone size={18} className="text-amber-400" />
            <button onClick={logout} className="text-slate-500 hover:text-slate-300">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {!trip ? (
          <div className="p-8 text-center text-slate-500 text-sm">Tidak ada trip aktif untuk Anda saat ini.</div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-data text-sm text-slate-300">{trip.order_no}</span>
                <StatusPill status={trip.status} />
              </div>
              <p className="text-slate-100 font-semibold">{trip.customer_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <MapPin size={12} /> {trip.load_location} <ChevronRight size={11} /> {trip.unload_location}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div>
                  <p className="text-slate-500">Truck</p>
                  <p className="text-slate-200 font-mono-data">{trip.truck_plate || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Tonase</p>
                  <p className="text-slate-200">{trip.tonnage || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Posisi Saat Ini</p>
                  <p className="text-slate-200">{trip.current_location || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500">ETA</p>
                  <p className="text-slate-200 font-mono-data">{trip.eta || "-"}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
                Status order diubah oleh admin di console — driver hanya melapor posisi & bukti.
              </p>
            </div>

            {showUpdateForm && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-300">Update Posisi Manual</p>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Posisi Saat Ini</span>
                  <input
                    value={locForm.current_location}
                    onChange={(e) => setLocForm({ ...locForm, current_location: e.target.value })}
                    placeholder="cth: Cirebon"
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">ETA</span>
                  <input
                    value={locForm.eta}
                    onChange={(e) => setLocForm({ ...locForm, eta: e.target.value })}
                    placeholder="cth: 15:30"
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={saveLocation}
                    disabled={updateLocation.isPending}
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm py-2.5 rounded-xl disabled:opacity-60"
                  >
                    Simpan
                  </button>
                  <button onClick={() => setShowUpdateForm(false)} className="px-4 border border-slate-700 text-slate-300 text-sm rounded-xl">
                    Batal
                  </button>
                </div>
              </div>
            )}

            {photos.length > 0 && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-400/10 border border-emerald-400/30 rounded-lg px-3 py-2">
                <Camera size={14} /> {photos.length} foto sudah diupload untuk trip ini
              </div>
            )}

            <div className="space-y-2">
              {!showUpdateForm && (
                <button
                  onClick={openUpdateForm}
                  className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm tracking-wide py-3 rounded-xl"
                >
                  <Navigation size={16} /> UPDATE LOCATION
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhoto.isPending}
                className="w-full flex items-center justify-center gap-2 border border-slate-700 text-slate-200 font-bold text-sm tracking-wide py-3 rounded-xl hover:border-slate-500 disabled:opacity-60"
              >
                <Camera size={16} /> {uploadPhoto.isPending ? "MENGUNGGAH…" : "UPLOAD PHOTO"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
