// src/pages/ValidasiPembayaran.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Upload,
  ShieldCheck,
  ShieldX,
  Clock3,
  Loader2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
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

// gunakan ENV kalau ada
const API_HOST = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';
const API_BASE = `${API_HOST}/api`;
const VALIDASI_API = `${API_BASE}/payment-validations`;

const norm = (v) => String(v || '').trim().toLowerCase();

const normalizeTripRole = (role) => {
  const r = norm(role);
  if (r === 'keberangkatan') return 'keberangkatan';
  if (r === 'kepulangan') return 'kepulangan';
  return '';
};

const hasValidTripRole = (role) => normalizeTripRole(role) !== '';

const isPaidStatus = (status) => {
  const s = norm(status);
  return (
    s === 'lunas' ||
    s === 'paid' ||
    s === 'pembayaran sukses' ||
    s === 'sukses' ||
    s === 'success' ||
    s === 'settlement'
  );
};

const isRejectedStatus = (status) => {
  const s = norm(status);
  return s === 'ditolak' || s === 'rejected' || s === 'tolak' || s === 'gagal' || s === 'failed';
};

const isWaitingStatus = (status) => {
  const s = norm(status);
  return s === 'menunggu validasi' || s === 'pending' || s === 'menunggu' || s === 'belum sukses' || s === 'belum bayar';
};

const StatusBadge = ({ status }) => {
  const paid = isPaidStatus(status);
  const rejected = isRejectedStatus(status);
  const waiting = isWaitingStatus(status);

  if (paid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
        <CheckCircle className="w-3 h-3" />
        {status || 'Lunas'}
      </span>
    );
  }

  if (rejected) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/40">
        <XCircle className="w-3 h-3" />
        {status || 'Ditolak'}
      </span>
    );
  }

  if (waiting) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-300 border border-yellow-500/40">
        <Clock3 className="w-3 h-3" />
        {status || 'Menunggu Validasi'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/40">
      {status || '-'}
    </span>
  );
};

const inferIsPDF = (proofFile, proofFileName) => {
  const n = norm(proofFileName);
  if (n.endsWith('.pdf')) return true;

  const s = String(proofFile || '').trim();
  if (s.startsWith('data:application/pdf')) return true;
  if (s.startsWith('JVBERi0')) return true;

  return false;
};

const normalizeProofHref = (proofFile, proofFileName) => {
  const s = String(proofFile || '').trim();
  if (!s) return '';

  if (s.startsWith('data:')) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${API_HOST}${s}`;
  if (s.startsWith('uploads/') || s.startsWith('public/') || s.startsWith('files/')) return `${API_HOST}/${s}`;

  const isPdf = inferIsPDF(s, proofFileName);
  if (isPdf) return `data:application/pdf;base64,${s}`;

  return `data:image/jpeg;base64,${s}`;
};

const ValidasiPembayaran = () => {
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupAddress: '',
    origin: '',
    destination: '',
    bookingDate: '',
    paymentMethod: 'Transfer',
    paymentStatus: 'Menunggu Validasi',
    tripRole: '',
    proofFile: '',
    proofFileName: '',
  });

  const [searchText, setSearchText] = useState('');

  const reload = async () => {
    try {
      const res = await fetch(VALIDASI_API);
      if (!res.ok) return;
      const data = await res.json().catch(() => []);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(VALIDASI_API);
        if (!res.ok) throw new Error('Gagal mengambil data validasi pembayaran');
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: err.message || 'Gagal mengambil data validasi pembayaran',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      pickupAddress: '',
      origin: '',
      destination: '',
      bookingDate: '',
      paymentMethod: 'Transfer',
      paymentStatus: 'Menunggu Validasi',
      tripRole: '',
      proofFile: '',
      proofFileName: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      pickupAddress: item.pickupAddress || '',
      origin: item.origin || '',
      destination: item.destination || '',
      bookingDate: item.bookingDate || '',
      paymentMethod: item.paymentMethod || 'Transfer',
      paymentStatus: item.paymentStatus || 'Menunggu Validasi',
      tripRole: item.tripRole || '',
      proofFile: item.proofFile || '',
      proofFileName: item.proofFileName || '',
    });
    setIsModalOpen(true);
  };

  const openPreview = (item) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${VALIDASI_API}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data');
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast({
        title: 'Deleted',
        description: 'Data validasi pembayaran dihapus.',
        variant: 'destructive',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus data',
        variant: 'destructive',
      });
    }
  };

  // ✅ approve helper (bisa dipakai dari tombol / dari submit modal)
  const approvePayment = async (id, { skipConfirm = false } = {}) => {
    if (!id) return;

    if (!skipConfirm) {
      const ok = window.confirm('Approve pembayaran ini? Status akan menjadi Lunas.');
      if (!ok) return;
    }

    setActingId(id);
    try {
      const res = await fetch(`${VALIDASI_API}/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || 'Gagal approve pembayaran');

      toast({ title: 'Approved', description: 'Pembayaran diset Lunas (sync dilakukan).' });
      await reload();
    } finally {
      setActingId(null);
    }
  };

  const rejectPayment = async (id, { skipConfirm = false } = {}) => {
    if (!id) return;

    if (!skipConfirm) {
      const ok = window.confirm('Reject pembayaran ini? Status akan menjadi Ditolak.');
      if (!ok) return;
    }

    setActingId(id);
    try {
      const res = await fetch(`${VALIDASI_API}/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || 'Gagal reject pembayaran');

      toast({ title: 'Rejected', description: 'Pembayaran ditolak.' });
      await reload();
    } finally {
      setActingId(null);
    }
  };

  const handleApprove = async (item) => {
    // ✅ cegah approve kalau role belum dipilih (biar tidak 400 dari backend)
    if (!hasValidTripRole(item?.tripRole)) {
      toast({
        title: 'Role Trip wajib diisi',
        description: 'Klik Edit lalu pilih Keberangkatan/Kepulangan terlebih dahulu.',
        variant: 'destructive',
      });
      openEdit(item);
      return;
    }

    try {
      await approvePayment(item.id);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal approve pembayaran',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (item) => {
    if (!hasValidTripRole(item?.tripRole)) {
      toast({
        title: 'Role Trip wajib diisi',
        description: 'Klik Edit lalu pilih Keberangkatan/Kepulangan terlebih dahulu.',
        variant: 'destructive',
      });
      openEdit(item);
      return;
    }

    try {
      await rejectPayment(item.id);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal reject pembayaran',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'paymentMethod') {
      const v = value;
      setFormData((prev) => ({
        ...prev,
        paymentMethod: v,
        paymentStatus: norm(v) === 'cash' ? 'Lunas' : (prev.paymentStatus || 'Menunggu Validasi'),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        proofFile: reader.result,
        proofFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = { ...formData };

    try {
      // ✅ jika user memilih status "Lunas/Paid/Sukses" di modal, kita akan auto-approve setelah save
      const wantAutoApprove = isPaidStatus(payload.paymentStatus);

      // kalau mau auto-approve, role harus ada (backend approve akan menolak kalau kosong)
      if (wantAutoApprove && !hasValidTripRole(payload.tripRole)) {
        throw new Error('Role trip belum diisi. Pilih Keberangkatan/Kepulangan terlebih dahulu.');
      }

      let savedId = editingItem?.id || null;

      if (editingItem) {
        const res = await fetch(`${VALIDASI_API}/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || data?.message || 'Gagal mengupdate data');
        toast({ title: 'Updated', description: 'Data berhasil diupdate' });
        savedId = editingItem.id;
      } else {
        const res = await fetch(VALIDASI_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || data?.message || 'Gagal membuat data baru');
        toast({ title: 'Created', description: 'Data validasi dibuat' });
        savedId = data?.id || data?.ID || null;
      }

      // ✅ AUTO-APPROVE (biar langsung sync ke keberangkatan/kepulangan)
      if (wantAutoApprove && savedId) {
        await approvePayment(savedId, { skipConfirm: true });
      } else {
        await reload();
      }

      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchText) return items;
    const q = searchText.toLowerCase();
    return items.filter((item) => {
      return (
        (item.customerName || '').toLowerCase().includes(q) ||
        (item.customerPhone || '').toLowerCase().includes(q) ||
        (item.pickupAddress || '').toLowerCase().includes(q) ||
        (item.origin || '').toLowerCase().includes(q) ||
        (item.destination || '').toLowerCase().includes(q)
      );
    });
  }, [items, searchText]);

  const previewHref = useMemo(() => {
    return normalizeProofHref(previewItem?.proofFile, previewItem?.proofFileName);
  }, [previewItem]);

  const previewIsPdf = useMemo(() => {
    return inferIsPDF(previewItem?.proofFile, previewItem?.proofFileName);
  }, [previewItem]);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Validasi Pembayaran - LK Travel App</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Validasi Pembayaran
            </h1>
            <p className="text-gray-400">
              Kelola bukti pembayaran dan status validasi (Approve/Reject).
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 border-0"
            >
              + Tambah Validasi
            </Button>
          </motion.div>
        </div>

        {/* Search */}
        <div className="bg-slate-800/60 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="search">Cari (Nama / No HP / Alamat Jemput)</Label>
            <Input
              id="search"
              placeholder="Ketik kata kunci..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-slate-900 border-slate-700"
            />
          </div>

          <Button
            onClick={reload}
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-700/50"
          >
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Nama</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">No HP</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Alamat Jemput</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Origin</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Destination</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Tgl Pemesanan</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Role Trip</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Metode</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Status</th>
                  <th className="text-left py-3 px-6 text-gray-400 text-xs uppercase">Bukti</th>
                  <th className="text-right py-3 px-6 text-gray-400 text-xs uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500 text-sm">
                      Loading...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500 text-sm">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const paid = isPaidStatus(item.paymentStatus);
                    const rejected = isRejectedStatus(item.paymentStatus);
                    const method = norm(item.paymentMethod);
                    const role = normalizeTripRole(item.tripRole);
                    const hasRole = role !== '';

                    // ✅ approve/reject hanya jika role sudah dipilih
                    const canApproveReject =
                      (method === 'transfer' || method === 'qris') && !paid && !rejected && hasRole;

                    const hasProof = !!String(item.proofFile || '').trim();
                    const proofHref = normalizeProofHref(item.proofFile, item.proofFileName);

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hover:bg-slate-700/30"
                      >
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-yellow-400 font-bold text-xs">
                              {item.customerName ? item.customerName.charAt(0) : 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-sm">{item.customerName}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-300">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-green-400" />
                            <span>{item.customerPhone}</span>
                          </div>
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-300 max-w-xs truncate">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>{item.pickupAddress}</span>
                          </div>
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span>{item.origin || '-'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            <span>{item.destination || '-'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-300">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            <span>{item.bookingDate || '-'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-200">
                          {item.tripRole || '-'}
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-200">
                          {item.paymentMethod || '-'}
                        </td>

                        <td className="py-3 px-6 text-sm">
                          <StatusBadge status={item.paymentStatus} />
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-200">
                          {hasProof ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
                                onClick={() => openPreview(item)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Lihat
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-200"
                                onClick={() => window.open(proofHref, '_blank')}
                                title="Buka di tab baru"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Tab
                              </Button>

                              {item.proofFileName ? (
                                <span className="text-xs text-gray-400 truncate max-w-[160px]">
                                  {item.proofFileName}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Belum upload</span>
                          )}
                        </td>

                        <td className="py-3 px-6 text-right text-sm">
                          <div className="flex justify-end gap-2 flex-wrap">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={!canApproveReject || actingId === item.id}
                              onClick={() => handleApprove(item)}
                              title={
                                !hasRole
                                  ? 'Role Trip wajib dipilih dulu (Edit)'
                                  : !canApproveReject
                                    ? 'Approve hanya untuk Transfer/QRIS yang belum final'
                                    : 'Approve'
                              }
                            >
                              {actingId === item.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-4 h-4 mr-2" />
                              )}
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              disabled={!canApproveReject || actingId === item.id}
                              onClick={() => handleReject(item)}
                              title={
                                !hasRole
                                  ? 'Role Trip wajib dipilih dulu (Edit)'
                                  : !canApproveReject
                                    ? 'Reject hanya untuk Transfer/QRIS yang belum final'
                                    : 'Reject'
                              }
                            >
                              {actingId === item.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <ShieldX className="w-4 h-4 mr-2" />
                              )}
                              Reject
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-200"
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDelete(item.id)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Preview Bukti */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                Bukti Pembayaran
              </DialogTitle>
            </DialogHeader>

            {!previewItem ? (
              <div className="text-sm text-gray-400">Tidak ada data.</div>
            ) : !previewHref ? (
              <div className="text-sm text-red-300">proofFile kosong.</div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-300">
                  <div><b className="text-white">{previewItem.customerName}</b> - {previewItem.customerPhone}</div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Origin/Destination: {previewItem.origin || '-'} → {previewItem.destination || '-'}</div>
                    <div>Role: {previewItem.tripRole || '-'}</div>
                    <div>
                      Metode: {previewItem.paymentMethod || '-'} - Status: {previewItem.paymentStatus || '-'}
                      {previewItem.proofFileName ? ` - File: ${previewItem.proofFileName}` : ''}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 border border-gray-700 rounded-xl p-3">
                  {previewIsPdf ? (
                    <iframe
                      title="Bukti PDF"
                      src={previewHref}
                      className="w-full h-[70vh] rounded-lg border border-gray-700 bg-white"
                    />
                  ) : (
                    <img
                      src={previewHref}
                      alt="Bukti Pembayaran"
                      className="w-full rounded-lg border border-gray-700"
                    />
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-200"
                      onClick={() => window.open(previewHref, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open New Tab
                    </Button>
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
                      onClick={() => setIsPreviewOpen(false)}
                    >
                      Tutup
                    </Button>
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    Jika tidak muncul, biasanya bukti tersimpan sebagai base64 mentah atau terlalu besar. Coba Open New Tab.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal (Create/Edit) */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                {editingItem ? 'Edit Validasi Pembayaran' : 'Tambah Validasi'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>No HP</Label>
                <Input
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Alamat Penjemputan</Label>
                <Input
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origin</Label>
                  <Input
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Pemesanan</Label>
                <Input
                  type="date"
                  name="bookingDate"
                  value={formData.bookingDate}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Role Trip</Label>
                  <select
                    name="tripRole"
                    value={formData.tripRole}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Pilih Role</option>
                    <option value="Keberangkatan">Keberangkatan</option>
                    <option value="Kepulangan">Kepulangan</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Status Pembayaran</Label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="Menunggu Validasi">Menunggu Validasi</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Ditolak">Ditolak</option>
                    <option value="Pembayaran Sukses">Pembayaran Sukses</option>
                    <option value="Belum Sukses">Belum Sukses</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Catatan: Jika kamu pilih <b className="text-white">Lunas/Pembayaran Sukses</b> lalu Save, sistem akan otomatis memanggil <b className="text-white">Approve</b> agar data tersinkron ke Pengaturan Keberangkatan/Kepulangan.
              </p>

              <div className="space-y-2">
                <Label>Foto / PDF Bukti Pembayaran</Label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-600 cursor-pointer text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  {formData.proofFileName && (
                    <span className="text-xs text-gray-400 truncate max-w-[180px]">
                      {formData.proofFileName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
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
                    ? (editingItem ? 'Saving...' : 'Creating...')
                    : (editingItem ? 'Save Changes' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ValidasiPembayaran;
