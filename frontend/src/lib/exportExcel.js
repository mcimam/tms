import * as XLSX from "xlsx";

import { STAGES, STAGE_LABEL } from "./constants.js";

export function exportOrdersExcel({ orders, drivers, trucks, counts }) {
  const wb = XLSX.utils.book_new();

  const orderHeaders = [
    "No. Order", "Customer", "Lokasi Muat", "Lokasi Bongkar", "Tanggal Kirim", "Jam Muat",
    "Jenis Barang", "Tonase", "Driver", "Truck", "Status", "Posisi Saat Ini", "ETA",
    "Est. Bongkar Mulai", "Est. Bongkar Selesai", "Catatan",
  ];
  const orderAoa = [orderHeaders, ...orders.map(o => [
    o.order_no, o.customer_name, o.load_location, o.unload_location, o.ship_date || "-", o.load_time || "-",
    o.cargo_type || "-", o.tonnage || "-", o.driver_name || "-", o.truck_plate || "-",
    STAGE_LABEL[o.status] || o.status, o.current_location || "-", o.eta || "-",
    o.est_unload_start || "-", o.est_unload_end || "-", o.notes || "-",
  ])];
  const wsOrders = XLSX.utils.aoa_to_sheet(orderAoa);
  wsOrders["!cols"] = orderHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

  const summaryAoa = [
    ["Status", "Jumlah"],
    ...STAGES.map(s => [STAGE_LABEL[s], counts[s] || 0]),
    ["TOTAL", counts.total ?? orders.length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary["!cols"] = [{ wch: 22 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Status");

  const driverAoa = [
    ["Nama", "No. HP", "Status"],
    ...drivers.map(d => [d.name, d.phone || "-", d.status === "available" ? "Available" : "On Trip"]),
  ];
  const wsDrivers = XLSX.utils.aoa_to_sheet(driverAoa);
  wsDrivers["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsDrivers, "Drivers");

  const truckAoa = [
    ["No. Polisi", "Tipe", "Status"],
    ...trucks.map(t => [t.plate, t.type || "-", t.status === "available" ? "Available" : "On Trip"]),
  ];
  const wsTrucks = XLSX.utils.aoa_to_sheet(truckAoa);
  wsTrucks["!cols"] = [{ wch: 16 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsTrucks, "Trucks");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `TrackIt_Report_${today}.xlsx`);
}
