import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FileText, Calendar, Plus, Upload, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import CrudActions from '@/components/CrudActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const API_BASE = 'http://localhost:8080/api';
const ITEMS_PER_PAGE = 10; // 🔹 jumlah trip per halaman

// ==============================
// ✅ NEW Helpers (tidak menghapus kode lama)
// - eSuratJalan bisa:
//   1) data:image/... (upload manual)
//   2) URL absolut (http/https)
//   3) URL relatif backend (/api/...)
//   4) JSON string (fallback / syncNotes)
// ==============================
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

function isDataUrl(v) {
  return typeof v === 'string' && v.startsWith('data:');
}

function isHttpUrl(v) {
  return typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'));
}

function isRelativeUrl(v) {
  return typeof v === 'string' && v.startsWith('/');
}

function looksLikeJsonString(v) {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  return (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
}

function resolveToAbsoluteBackendUrl(v) {
  if (!v || typeof v !== 'string') return '';
  if (isDataUrl(v)) return v;
  if (isHttpUrl(v)) return v;
  if (isRelativeUrl(v)) return `${BACKEND_ORIGIN}${v}`;
  return v;
}

// ✅ NEW: paksa scope=trip untuk endpoint surat jalan booking
// - jika URL mengarah ke /api/reguler/bookings/:id/surat-jalan tanpa scope=trip,
//   maka tambahkan param scope=trip agar semua penumpang pada trip yang sama ikut.
function ensureSuratJalanTripScope(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

  const u = rawUrl.trim();

  // hanya untuk endpoint surat jalan booking
  const isBookingSJ =
    u.includes('/api/reguler/bookings/') &&
    u.includes('/surat-jalan');

  if (!isBookingSJ) return rawUrl;
  if (u.includes('scope=trip')) return rawUrl;

  const joiner = u.includes('?') ? '&' : '?';
  return `${u}${joiner}scope=trip`;
}

// Render surat jalan yang “tahan banting” untuk berbagai bentuk payload JSON
function SuratJalanRenderer({ payload, fallbackTrip }) {
  // cari array penumpang di beberapa kemungkinan key
  const candidates = [
    payload?.passengers,
    payload?.penumpang,
    payload?.rows,
    payload?.items,
    payload?.data?.passengers,
    payload?.data?.penumpang,
    payload?.data?.rows,
    payload?.data?.items,
  ];

  const rows = candidates.find((x) => Array.isArray(x)) || [];

  const get = (obj, keys, def = '') => {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
        return obj[k];
      }
    }
    return def;
  };

  const companyName =
    get(payload, ['companyName', 'company', 'namaPerusahaan'], '') ||
    'PT. LANCANG KUNING TRAVELINDO';

  const title = get(payload, ['title', 'judul'], 'SURAT JALAN');

  const licensePlate =
    get(payload, ['licensePlate', 'noPol', 'plate'], '') ||
    (fallbackTrip?.licensePlate || '');

  const departureDate =
    get(payload, ['departureDate', 'date', 'tanggal', 'tripDate'], '') ||
    (fallbackTrip?.departureDate || '');

  const driverName =
    get(payload, ['driverName', 'driver', 'supir'], '') ||
    (fallbackTrip?.driverName || '');

  // buat baris tampil
  const normalizeRow = (r) => {
    const name = get(r, ['name', 'passengerName', 'nama'], '-');
    const phone = get(r, ['phone', 'passengerPhone', 'noHp', 'hp'], '');
    const seat = get(r, ['seat', 'seatCode', 'selectedSeat', 'selectedSeats', 'bangku'], '');

    const pickup = get(r, ['pickup', 'jemput', 'pickupLocation', 'pickupAddress'], '-');
    const dest = get(r, ['destination', 'tujuan', 'dropoffLocation', 'dropoffAddress'], '-');

    const fare = get(r, ['fare', 'tarif', 'price', 'amount', 'totalAmount', 'pricePerSeat'], '');
    const status = get(r, ['status', 'keterangan', 'paymentStatus'], '');

    return { name, phone, seat, pickup, dest, fare, status };
  };

  // minimal 7 baris, mengikuti template
  const rowCount = Math.max(7, rows.length);

  return (
    <div className="bg-white text-black rounded-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="text-center">
          <div className="text-2xl font-extrabold">{companyName}</div>
          <div className="text-lg font-bold mt-1">{title}</div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold w-24">No. Pol</span>
            <span>:</span>
            <span className="font-mono">{licensePlate || '-'}</span>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold w-24">Tanggal</span>
            <span>:</span>
            <span>{departureDate || '-'}</span>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold w-24">Driver</span>
            <span>:</span>
            <span>{driverName || '-'}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 w-12">NO.</th>
                <th className="border border-slate-300 px-3 py-2">NAMA / NOMOR HP</th>
                <th className="border border-slate-300 px-3 py-2">JEMPUT</th>
                <th className="border border-slate-300 px-3 py-2">TUJUAN</th>
                <th className="border border-slate-300 px-3 py-2 w-28">TARIF</th>
                <th className="border border-slate-300 px-3 py-2 w-28">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                Array.from({ length: rowCount }, (_, idx) => {
                  const r = rows[idx];
                  const hasData = !!r;
                  const rr = hasData ? normalizeRow(r) : null;
                  const seatLabel = rr?.seat ? ` (${String(rr.seat)})` : '';
                  return (
                    <tr key={idx}>
                      <td className="border border-slate-300 px-3 py-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-2">
                        {hasData ? (
                          <>
                            <div className="font-semibold">
                              {rr.name}
                              {seatLabel}
                            </div>
                            {rr.phone ? <div className="text-xs text-slate-600">{rr.phone}</div> : null}
                          </>
                        ) : null}
                      </td>
                      <td className="border border-slate-300 px-3 py-2">{hasData ? rr.pickup : ''}</td>
                      <td className="border border-slate-300 px-3 py-2">{hasData ? rr.dest : ''}</td>
                      <td className="border border-slate-300 px-3 py-2 text-right">
                        {hasData && rr.fare !== '' ? rr.fare : ''}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        {hasData && rr.status !== '' ? rr.status : ''}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="border border-slate-300 px-3 py-6 text-center text-slate-600" colSpan={6}>
                    Data surat jalan belum ada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer sign */}
        <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
          <div className="text-left">
            <div className="font-semibold">PENGEMUDI</div>
            <div className="mt-12 border-t border-slate-400 w-56" />
          </div>
          <div className="text-right">
            <div className="font-semibold">PENGURUS</div>
            <div className="mt-12 border-t border-slate-400 w-56 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================
// ✅ NEW: Template Surat Jalan "Belum Sesuai 1" (seperti Booking Confirmed)
// - Dipakai saat payload berasal dari endpoint booking: /api/reguler/bookings/:id/surat-jalan
// - Tidak menghapus SuratJalanRenderer lama (tetap jadi fallback)
// ==============================
function formatDateID(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isBookingSuratJalanPayload(p) {
  if (!p || typeof p !== 'object') return false;
  // payload backend reguler: { bookingId, tripDate, pickupLocation, dropoffLocation, pricePerSeat, total, passengerPhone, passengers:[...] }
  return Array.isArray(p.passengers) && (p.bookingId || p.tripDate || p.pickupLocation || p.dropoffLocation);
}

function SuratJalanBookingTemplate({ payload, trip }) {
  const paxList = Array.isArray(payload?.passengers) ? payload.passengers : [];

  // NOTE:
  // untuk scope=trip, backend akan mengosongkan passengerPhone/pickup/dropoff di level root,
  // karena sudah ada per-penumpang.
  const hpSJ = payload?.passengerPhone || '';
  const jemputSJ = payload?.pickupLocation || '';
  const tujuanSJ = payload?.dropoffLocation || '';

  const seatCount = paxList.length || 0;
  const tarifPerSeat =
    Number(payload?.pricePerSeat || 0) ||
    (seatCount > 0 ? Math.round(Number(payload?.total || 0) / seatCount) : 0);

  const noPol = (trip?.licensePlate || '').trim() || '..............';
  const driver = (trip?.driverName || '').trim() || '..............';
  const tanggal = formatDateID(payload?.tripDate || trip?.departureDate);

  // ✅ FIX: baris mengikuti jumlah penumpang, minimal 7
  const rowCount = Math.max(7, paxList.length);

  // normalize penumpang (support payload baru: phone/pickupLocation/dropoffLocation/fare/status)
  const getRow = (p) => {
    const name = (p?.name || p?.passengerName || '').trim();
    const seat = (p?.seat || p?.seatCode || '').toString().trim();
    const phone = (p?.phone || p?.passengerPhone || hpSJ || '').toString().trim();
    const pickup = (p?.pickupLocation || p?.pickupAddress || jemputSJ || '').toString().trim();
    const dest = (p?.dropoffLocation || p?.dropoffAddress || tujuanSJ || '').toString().trim();
    const fare = Number(p?.fare ?? tarifPerSeat ?? 0);
    const status = (p?.status || p?.paymentStatus || '').toString().trim();
    return { name, seat, phone, pickup, dest, fare, status };
  };

  return (
    <div className="w-full bg-white text-black p-8 font-sans border border-gray-200 shadow-xl rounded-lg">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white border-2 border-black rounded-full p-1 flex items-center justify-center shrink-0">
            <img
              src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg"
              className="w-full h-full object-contain rounded-full"
              alt="Logo"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">
              PT. LANCANG KUNING TRAVELINDO
            </h1>
            <h2 className="text-2xl font-bold uppercase tracking-wider text-center">SURAT JALAN</h2>
          </div>
        </div>

        <div className="text-right text-sm font-bold space-y-1 min-w-[250px]">
          <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
            <span>No. Pol :</span>
            <span className="font-mono ml-2">{noPol}</span>
          </div>
          <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
            <span>Tanggal :</span>
            <span className="font-mono ml-2">{tanggal || '..............'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
            <span>Driver :</span>
            <span className="font-mono ml-2">{driver}</span>
          </div>
        </div>
      </div>

      <div className="w-full mb-12 border-2 border-black">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="border-r border-black p-2 w-10 text-center font-bold uppercase">No.</th>
              <th className="border-r border-black p-2 text-left font-bold uppercase">Nama / Nomor HP</th>
              <th className="border-r border-black p-2 text-left font-bold uppercase w-1/5">Jemput</th>
              <th className="border-r border-black p-2 text-left font-bold uppercase w-1/5">Tujuan</th>
              <th className="border-r border-black p-2 text-center font-bold uppercase w-24">Tarif</th>
              <th className="p-2 text-center font-bold uppercase w-28">Keterangan</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black">
            {Array.from({ length: rowCount }, (_, i) => {
              const p = paxList[i];
              const hasData = !!p;
              const rr = hasData ? getRow(p) : null;

              const seatLabel = rr?.seat ? `(${String(rr.seat).toUpperCase()})` : '';
              const nameUp = (rr?.name || '').toUpperCase();

              return (
                <tr key={i} className="h-10">
                  <td className="border-r border-black p-2 text-center font-bold">{i + 1}</td>

                  <td className="border-r border-black p-2 font-bold uppercase">
                    {hasData ? (
                      <>
                        {nameUp}{' '}
                        {seatLabel ? <span className="font-normal text-xs">{seatLabel}</span> : null}
                        <br />
                        <span className="font-normal text-xs">{rr.phone || ''}</span>
                      </>
                    ) : null}
                  </td>

                  <td className="border-r border-black p-2 uppercase text-xs font-semibold">
                    {hasData ? (rr.pickup || '') : ''}
                  </td>

                  <td className="border-r border-black p-2 uppercase text-xs font-semibold">
                    {hasData ? (rr.dest || '') : ''}
                  </td>

                  <td className="border-r border-black p-2 text-right">
                    {hasData ? (rr.fare ? rr.fare.toLocaleString() : '') : ''}
                  </td>

                  <td className="p-2 text-center text-[10px] font-bold">
                    {hasData ? (rr.status ? rr.status.toUpperCase() : '-') : ''}
                  </td>
                </tr>
              );
            })}

            {paxList.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-center text-xs font-semibold">
                  Data penumpang belum ada. Pastikan endpoint booking surat jalan mengembalikan passengers.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between px-16 text-center text-sm font-bold uppercase">
        <div className="flex flex-col gap-16">
          <span>Pengemudi</span>
          <span className="border-t border-black pt-1 px-4 min-w-[150px]">(.........................)</span>
        </div>
        <div className="flex flex-col gap-16">
          <span>Pengurus</span>
          <span className="border-t border-black pt-1 px-4 min-w-[150px]">(.........................)</span>
        </div>
      </div>
    </div>
  );
}

const TripInformation = () => {
  const { toast } = useToast();
  const [trips, setTrips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null); // For editing
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    driverName: '',
    vehicleCode: '',
    licensePlate: '',
    tripNumber: '',
    departureDate: '',
    departureTime: '', // 🔹 jam keberangkatan
    eSuratJalan: '', // string (dataURL/base64) / URL / JSON
  });

  // 🔍 Search & Pagination
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ==============================
  // ✅ NEW: modal preview surat jalan dari API booking (informasi 6)
  // ==============================
  const [isSuratPreviewOpen, setIsSuratPreviewOpen] = useState(false);
  const [suratPreviewTrip, setSuratPreviewTrip] = useState(null);
  const [suratLoading, setSuratLoading] = useState(false);
  const [suratErr, setSuratErr] = useState('');
  const [suratType, setSuratType] = useState('json'); // 'json' | 'image' | 'raw'
  const [suratPayload, setSuratPayload] = useState(null);

  const openSuratPreview = async (trip) => {
    try {
      setSuratPreviewTrip(trip);
      setIsSuratPreviewOpen(true);
      setSuratLoading(true);
      setSuratErr('');
      setSuratPayload(null);
      setSuratType('json');

      const vRaw = trip?.eSuratJalan;

      if (!vRaw) {
        setSuratErr('Surat jalan belum tersedia.');
        setSuratType('raw');
        setSuratPayload({ raw: '' });
        return;
      }

      // jika base64 upload manual → tampilkan gambar
      if (isDataUrl(vRaw)) {
        setSuratType('image');
        setSuratPayload({ src: vRaw });
        return;
      }

      // jika string JSON di DB (bisa 2 tipe):
      // 1) payload surat jalan langsung
      // 2) "syncNotes" yang berisi suratJalanApi (hasil auto-sync booking)
      if (looksLikeJsonString(vRaw)) {
        try {
          const parsed = JSON.parse(vRaw);

          // ✅ kalau format syncNotes, ambil URL-nya lalu fetch surat jalan asli
          if (parsed?.suratJalanApi) {
            const fixed = ensureSuratJalanTripScope(parsed.suratJalanApi);
            const url2 = resolveToAbsoluteBackendUrl(fixed);

            const res2 = await fetch(url2, { headers: { Accept: 'application/json' } });
            const data2 = await res2.json().catch(() => ({}));

            if (!res2.ok) {
              setSuratErr(data2?.error || 'Gagal memuat surat jalan.');
              setSuratType('raw');
              setSuratPayload({ raw: JSON.stringify(data2 || {}, null, 2) });
              return;
            }

            // support format backend yang mengembalikan image
            if (data2?.__type === 'image' && data2?.src) {
              setSuratType('image');
              setSuratPayload({ src: data2.src });
              return;
            }

            setSuratType('json');
            setSuratPayload(data2);
            return;
          }

          // ✅ kalau JSON payload surat jalan langsung, tapi kita tetap paksa ambil versi scope=trip jika ada bookingId
          if (isBookingSuratJalanPayload(parsed) && parsed?.bookingId) {
            const tripUrl = `${API_BASE}/reguler/bookings/${parsed.bookingId}/surat-jalan?scope=trip`;
            const res3 = await fetch(tripUrl, { headers: { Accept: 'application/json' } });
            const data3 = await res3.json().catch(() => ({}));

            if (res3.ok) {
              if (data3?.__type === 'image' && data3?.src) {
                setSuratType('image');
                setSuratPayload({ src: data3.src });
                return;
              }
              setSuratType('json');
              setSuratPayload(data3);
              return;
            }

            // fallback ke parsed kalau refetch gagal
            setSuratType('json');
            setSuratPayload(parsed);
            return;
          }

          // default: json surat jalan langsung
          setSuratType('json');
          setSuratPayload(parsed);
          return;
        } catch {
          // lanjut fetch
        }
      }

      // URL (relatif/absolut) → fetch JSON
      const fixedV = ensureSuratJalanTripScope(String(vRaw));
      const url = resolveToAbsoluteBackendUrl(fixedV);

      if (!url) {
        setSuratErr('URL surat jalan tidak valid.');
        setSuratType('raw');
        setSuratPayload({ raw: String(vRaw || '') });
        return;
      }

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSuratErr(data?.error || 'Gagal memuat surat jalan.');
        setSuratType('raw');
        setSuratPayload({ raw: JSON.stringify(data || {}, null, 2) });
        return;
      }

      // support format backend yang mengembalikan image
      if (data?.__type === 'image' && data?.src) {
        setSuratType('image');
        setSuratPayload({ src: data.src });
        return;
      }

      // default JSON render
      setSuratType('json');
      setSuratPayload(data);
    } catch (err) {
      console.error(err);
      setSuratErr(err?.message || 'Gagal memuat surat jalan.');
      setSuratType('raw');
      setSuratPayload({ raw: '' });
    } finally {
      setSuratLoading(false);
    }
  };

  const closeSuratPreview = () => {
    setIsSuratPreviewOpen(false);
    setSuratPreviewTrip(null);
    setSuratPayload(null);
    setSuratErr('');
    setSuratType('json');
    setSuratLoading(false);
  };

  // --- LOAD DATA DARI BACKEND ---
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/trip-information`);
        if (!res.ok) throw new Error('Gagal mengambil data trip dari server');
        const data = await res.json();
        setTrips(data);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Gagal memuat data trip dari server',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [toast]);

  const reloadTrips = async () => {
    try {
      const res = await fetch(`${API_BASE}/trip-information`);
      if (!res.ok) throw new Error('Gagal mengambil data trip dari server');
      const data = await res.json();
      setTrips(data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Gagal memuat ulang data trip',
        variant: 'destructive',
      });
    }
  };

  // --- FORM HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, eSuratJalan: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // CREATE / UPDATE ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (currentTrip) {
        // UPDATE
        const res = await fetch(
          `${API_BASE}/trip-information/${currentTrip.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          },
        );
        if (!res.ok) throw new Error('Gagal mengupdate trip');
        toast({
          title: 'Updated',
          description: 'Trip information updated successfully.',
        });
      } else {
        // CREATE
        const res = await fetch(`${API_BASE}/trip-information`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Gagal membuat trip baru');
        const created = await res.json();
        setTrips((prev) => [created, ...prev]);
        toast({ title: 'Created', description: 'New trip record created.' });
      }

      await reloadTrips();
      closeModal();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan data trip',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    setCurrentTrip(null);
    setFormData({
      driverName: '',
      vehicleCode: '',
      licensePlate: '',
      tripNumber: `TRIP-${Math.floor(Math.random() * 10000)}`,
      departureDate: today,
      departureTime: `${hh}:${mm}`,
      eSuratJalan: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (trip) => {
    setCurrentTrip(trip);
    setFormData({
      driverName: trip.driverName || '',
      vehicleCode: trip.vehicleCode || '',
      licensePlate: trip.licensePlate || '',
      tripNumber: trip.tripNumber || '',
      departureDate: trip.departureDate || '',
      departureTime: trip.departureTime || '', // 🔹 ambil dari backend jika ada
      eSuratJalan: trip.eSuratJalan || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/trip-information/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus trip');
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: 'Deleted',
        description: 'Trip record deleted.',
        variant: 'destructive',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus trip',
        variant: 'destructive',
      });
    }
  };

  const closeModal = () => setIsModalOpen(false);

  // 🔎 FILTER & PAGINATION
  const filteredTrips = trips.filter((trip) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;

    const tripNumber = (trip.tripNumber || '').toLowerCase();
    const driverName = (trip.driverName || '').toLowerCase();
    const vehicleCode = (trip.vehicleCode || '').toLowerCase();
    const licensePlate = (trip.licensePlate || '').toLowerCase();
    const departureDate = (trip.departureDate || '').toLowerCase();
    const departureTime = (trip.departureTime || '').toLowerCase();

    return (
      tripNumber.includes(q) ||
      driverName.includes(q) ||
      vehicleCode.includes(q) ||
      licensePlate.includes(q) ||
      departureDate.includes(q) ||
      departureTime.includes(q)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, trips.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTrips.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageTrips = filteredTrips.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSearchClick = () => {
    setSearchText(searchInput.trim());
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Trip Information - LK Travel App</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Trip Information
            </h1>
            <p className="text-gray-400">
              Manage daily trips and Surat Jalan
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={openCreateModal}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Trip Record
            </Button>
          </motion.div>
        </div>

        {/* 🔍 Search (Trip, Driver, Vehicle, Tanggal & Jam) */}
        <div className="bg-slate-800/60 border border-gray-700 rounded-xl p-4">
          <div className="max-w-xl space-y-1">
            <Label htmlFor="searchTrip">
              Search (Trip, Driver, Vehicle, Tanggal / Jam Keberangkatan)
            </Label>
            <div className="flex gap-2">
              <Input
                id="searchTrip"
                placeholder="Ct: TRIP-1001 / Budi / INNOVA-01 / 2025-01-01 / 08:00"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchClick();
                }}
                className="bg-slate-900 border-slate-700"
              />
              <Button
                type="button"
                onClick={handleSearchClick}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Trip Details
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Tanggal Keberangkatan
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Jam Keberangkatan
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Driver Info
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Surat Jalan
                  </th>
                  <th className="text-right py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      Loading trip records...
                    </td>
                  </tr>
                ) : filteredTrips.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      No trip records found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  currentPageTrips.map((trip) => (
                    <motion.tr
                      key={trip.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Trip Number */}
                      <td className="py-4 px-6">
                        <div className="text-white font-bold">
                          {trip.tripNumber}
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-sm text-gray-300">
                          <Calendar className="w-3 h-3" />
                          <span>{trip.departureDate || '-'}</span>
                        </div>
                      </td>

                      {/* Jam */}
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-300">
                          {trip.departureTime || '-'}
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-yellow-500 font-bold">
                            {(trip.driverName?.charAt(0) || '?').toUpperCase()}
                          </div>
                          <span className="text-gray-300 font-medium">
                            {trip.driverName}
                          </span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <div className="text-white font-mono">
                            {trip.licensePlate}
                          </div>
                          <div className="text-xs text-gray-500">
                            Code: {trip.vehicleCode}
                          </div>
                        </div>
                      </td>

                      {/* Surat Jalan */}
                      <td className="py-4 px-6">
                        {trip.eSuratJalan ? (
                          <div className="flex items-center gap-2 text-green-400 text-sm">
                            <FileText className="w-4 h-4" /> Uploaded

                            {isDataUrl(trip.eSuratJalan) ? (
                              <button
                                type="button"
                                onClick={() => openSuratPreview(trip)}
                                className="ml-2"
                                title="Preview Surat Jalan"
                              >
                                <img
                                  src={trip.eSuratJalan}
                                  alt="Preview"
                                  className="w-8 h-8 object-cover rounded border border-gray-600"
                                />
                              </button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="ml-2 border-gray-600 text-gray-200"
                                onClick={() => openSuratPreview(trip)}
                              >
                                Prev
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs italic">
                            Not uploaded
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <CrudActions
                          itemName="Trip"
                          onView={() =>
                            toast({
                              title: 'Trip Details',
                              description: `Trip #${trip.tripNumber}`,
                            })
                          }
                          onEdit={() => openEditModal(trip)}
                          onDelete={() => handleDelete(trip.id)}
                        />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredTrips.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-t border-gray-700 bg-slate-900/40 gap-3">
              <p className="text-xs text-gray-400">
                Showing{' '}
                {`${startIndex + 1}-${Math.min(
                  startIndex + ITEMS_PER_PAGE,
                  filteredTrips.length,
                )}`}{' '}
                of {filteredTrips.length} trips
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className="border-gray-600 text-gray-200"
                >
                  Prev
                </Button>
                <span className="text-xs text-gray-400">
                  Page {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(totalPages, prev + 1),
                    )
                  }
                  className="border-gray-600 text-gray-200"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ✅ NEW: Preview Surat Jalan Modal */}
        <Dialog open={isSuratPreviewOpen} onOpenChange={(v) => (v ? setIsSuratPreviewOpen(true) : closeSuratPreview())}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                E-Surat Jalan
              </DialogTitle>
            </DialogHeader>

            <div className="mt-3">
              {suratLoading ? (
                <div className="py-10 text-center text-gray-400">Memuat surat jalan...</div>
              ) : suratErr ? (
                <div className="py-6 text-center">
                  <div className="text-red-400 font-semibold">{suratErr}</div>
                </div>
              ) : suratType === 'image' ? (
                <div className="bg-white rounded-lg p-3">
                  <img
                    src={suratPayload?.src}
                    alt="Surat Jalan"
                    className="w-full h-auto rounded"
                  />
                </div>
              ) : suratType === 'json' ? (
                isBookingSuratJalanPayload(suratPayload) ? (
                  <SuratJalanBookingTemplate payload={suratPayload} trip={suratPreviewTrip} />
                ) : (
                  <SuratJalanRenderer payload={suratPayload} fallbackTrip={suratPreviewTrip} />
                )
              ) : (
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-700">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                    {suratPayload?.raw || 'Tidak ada data.'}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={closeSuratPreview}
                className="text-gray-400 hover:text-white hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                {currentTrip ? 'Edit Trip Record' : 'Create New Trip'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tripNumber">Trip Number</Label>
                  <Input
                    id="tripNumber"
                    name="tripNumber"
                    value={formData.tripNumber}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Input
                    id="departureDate"
                    name="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    required
                  />
                </div>
              </div>

              {/* Jam Keberangkatan */}
              <div className="space-y-2">
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input
                  id="departureTime"
                  name="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverName">Driver Name</Label>
                <Input
                  id="driverName"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600"
                  placeholder="e.g. Budi Santoso"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleCode">Vehicle Code</Label>
                  <Input
                    id="vehicleCode"
                    name="vehicleCode"
                    value={formData.vehicleCode}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="e.g. INNOVA-01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input
                    id="licensePlate"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="e.g. BM 1234 XX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>E-Surat Jalan (Photo)</Label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors relative">
                  {formData.eSuratJalan ? (
                    <div className="relative">
                      <img
                        src={formData.eSuratJalan}
                        alt="Preview"
                        className="max-h-40 rounded shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            eSuratJalan: '',
                          }))
                        }
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400">
                        Click to upload photo
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
                >
                  {saving
                    ? currentTrip
                      ? 'Saving...'
                      : 'Creating...'
                    : currentTrip
                    ? 'Save Changes'
                    : 'Create Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TripInformation;
