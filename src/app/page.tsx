'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FlaskConical,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Plus,
  Search,
  ExternalLink,
  RefreshCw,
  Database,
  Cloud,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Download,
  X,
  History,
  FileText,
  Upload,
  LogOut,
  User,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { standardLocations, sixCheckpoints } from '@/lib/validations';

interface Material {
  id: number;
  no: string | null;
  status: 'On The Way' | 'Analysis' | 'Canceled' | 'Done';
  deliveryDate: string | null;
  pointOfOrigin: string;
  pointOfDelivery: string;
  shippingRequirements: string | null;
  shipmentBy: string | null;
  itemDescription: string;
  pic: string;
  technicalProposalStatus: string | null;
  costProposalStatus: string | null;
  statusCoff: string | null;
  noCoff: string | null;
  analysisRequested: string | null;
  finalStatusReport: string | null;
  remarkRaw: string | null;
  remarkStructured: string | null;
  remarkParseNote: string | null;
  fileUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Stats {
  total_materials: number;
  on_the_way: number;
  analysis: number;
  canceled: number;
  done: number;
}

export default function LabLogixDashboard() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState('Iwan Joko');
  const [loginPassword, setLoginPassword] = useState('');

  // Main Data States
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_materials: 0,
    on_the_way: 0,
    analysis: 0,
    canceled: 0,
    done: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'On The Way' | 'Analysis' | 'Canceled' | 'Done'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeUpdateTab, setActiveUpdateTab] = useState<'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5'>('tab1');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Admin / Database Modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Activity Log Entry Form in Tab 4
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [newLogActivity, setNewLogActivity] = useState('');

  // Forms State
  const [formData, setFormData] = useState({
    no: '',
    status: 'On The Way' as 'On The Way' | 'Analysis' | 'Canceled' | 'Done',
    deliveryDate: new Date().toISOString().slice(0, 10),
    pointOfOrigin: 'FPU',
    customOrigin: '',
    pointOfDelivery: 'Intertek Balikpapan',
    customDelivery: '',
    shippingRequirements: '',
    shipmentBy: 'Altus Logistics',
    itemDescription: '',
    pic: '',
    technicalProposalStatus: 'Approved',
    costProposalStatus: 'Accepted',
    statusCoff: 'Issued',
    noCoff: '',
    analysisRequested: '',
    finalStatusReport: 'In Progress',
    remarkRaw: '',
    fileUrl: '',
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [uploadingForId, setUploadingForId] = useState<number | null>(null);
  const [modalUploading, setModalUploading] = useState(false);
  const tableFileInputRef = useRef<HTMLInputElement>(null);
  const [targetUploadMaterialId, setTargetUploadMaterialId] = useState<number | null>(null);

  // Check login on mount
  useEffect(() => {
    const saved = localStorage.getItem('lablogix_user');
    if (saved) {
      setCurrentUser(saved);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Materials and Stats
  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, statsRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/stats'),
      ]);

      const matData = await matRes.json();
      const statsData = await statsRes.json();

      if (matData.success) {
        setMaterials(matData.materials);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) return;
    const name = loginInput.trim();
    setCurrentUser(name);
    localStorage.setItem('lablogix_user', name);
    showToast(`Selamat datang, ${name}!`);
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lablogix_user');
  };

  // Open Add Material Modal
  const handleOpenAdd = () => {
    const nextNo = String(materials.length + 1).padStart(3, '0');
    setFormData({
      no: nextNo,
      status: 'On The Way',
      deliveryDate: new Date().toISOString().slice(0, 10),
      pointOfOrigin: 'FPU',
      customOrigin: '',
      pointOfDelivery: 'Intertek Balikpapan',
      customDelivery: '',
      shippingRequirements: 'Standard sample packing',
      shipmentBy: 'Altus Logistics',
      itemDescription: '',
      pic: currentUser || 'Iwan Joko',
      technicalProposalStatus: 'Approved',
      costProposalStatus: 'Accepted',
      statusCoff: 'Issued',
      noCoff: `COFF-${new Date().getFullYear()}-${String(materials.length + 80).padStart(3, '0')}`,
      analysisRequested: '',
      finalStatusReport: 'In Progress',
      remarkRaw: `[${new Date().toISOString().slice(0, 10)}] ${currentUser || 'Staff'}: Material terdaftar dan siap dikirim.`,
      fileUrl: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Update Material Modal
  const handleOpenUpdate = (material: Material) => {
    setSelectedMaterial(material);
    setActiveUpdateTab('tab1');
    const isCustomOrigin = !standardLocations.includes(material.pointOfOrigin as any);
    const isCustomDelivery = !standardLocations.includes(material.pointOfDelivery as any);

    setFormData({
      no: material.no || String(material.id).padStart(3, '0'),
      status: material.status,
      deliveryDate: material.deliveryDate || '',
      pointOfOrigin: isCustomOrigin ? 'Custom' : material.pointOfOrigin,
      customOrigin: isCustomOrigin ? material.pointOfOrigin : '',
      pointOfDelivery: isCustomDelivery ? 'Custom' : material.pointOfDelivery,
      customDelivery: isCustomDelivery ? material.pointOfDelivery : '',
      shippingRequirements: material.shippingRequirements || '',
      shipmentBy: material.shipmentBy || '',
      itemDescription: material.itemDescription,
      pic: currentUser || material.pic, // Locked to logged in user
      technicalProposalStatus: material.technicalProposalStatus || '',
      costProposalStatus: material.costProposalStatus || '',
      statusCoff: material.statusCoff || '',
      noCoff: material.noCoff || '',
      analysisRequested: material.analysisRequested || '',
      finalStatusReport: material.finalStatusReport || '',
      remarkRaw: material.remarkRaw || '',
      fileUrl: material.fileUrl || '',
    });
    setNewLogActivity('');
    setIsUpdateModalOpen(true);
  };

  // Submit Add Material
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOrigin = formData.pointOfOrigin === 'Custom' ? formData.customOrigin : formData.pointOfOrigin;
    const finalDelivery = formData.pointOfDelivery === 'Custom' ? formData.customDelivery : formData.pointOfDelivery;

    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pointOfOrigin: finalOrigin,
          pointOfDelivery: finalDelivery,
          pic: currentUser || 'Iwan Joko', // Locked PIC
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Gagal menambahkan material');
        return;
      }

      showToast('Material berhasil ditambahkan!');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Submit Update Material
  const handleSaveUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedMaterial) return;

    const finalOrigin = formData.pointOfOrigin === 'Custom' ? formData.customOrigin : formData.pointOfOrigin;
    const finalDelivery = formData.pointOfDelivery === 'Custom' ? formData.customDelivery : formData.pointOfDelivery;

    try {
      const res = await fetch(`/api/materials/${selectedMaterial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pointOfOrigin: finalOrigin,
          pointOfDelivery: finalDelivery,
          pic: currentUser || selectedMaterial.pic, // Locked PIC
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Gagal memperbarui material');
        return;
      }

      showToast('Material berhasil diperbarui!');
      setIsUpdateModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data material ini?')) return;
    try {
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Material telah dihapus');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Status Change in Modal Tab 1
  const handleQuickStatusChange = (newStatus: 'On The Way' | 'Analysis' | 'Canceled' | 'Done') => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  // Activity Log Handlers (Tab 4)
  const parsedLogs = useMemo(() => {
    if (!formData.remarkRaw) return [];
    return formData.remarkRaw
      .split('<br>')
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0);
  }, [formData.remarkRaw]);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogActivity.trim()) return;

    const newEntry = `[${newLogDate}] ${currentUser || 'Analyst'}: ${newLogActivity.trim()}`;
    const updatedRemark = formData.remarkRaw
      ? `${formData.remarkRaw}<br> ${newEntry}`
      : newEntry;

    setFormData(prev => ({ ...prev, remarkRaw: updatedRemark }));
    setNewLogActivity('');
    showToast('Catatan ditambahkan ke riwayat!');
  };

  const handleDeleteLog = (indexToDelete: number) => {
    const updatedLogs = parsedLogs.filter((_, idx) => idx !== indexToDelete);
    const updatedRemark = updatedLogs.join('<br> ');
    setFormData(prev => ({ ...prev, remarkRaw: updatedRemark }));
  };

  // File Upload Handlers (Versi Paksa - 100% Anti-Gagal)
  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setModalUploading(true);
    const body = new FormData();
    body.append('file', file);
    if (selectedMaterial) {
      body.append('materialId', String(selectedMaterial.id));
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, fileUrl: data.url }));
        showToast(`File ${data.fileName} berhasil diunggah! (${data.message})`);
      } else {
        alert(data.error || 'Gagal mengunggah file');
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setModalUploading(false);
    }
  };

  // Direct Table Row Upload Trigger
  const triggerTableRowUpload = (materialId: number) => {
    setTargetUploadMaterialId(materialId);
    if (tableFileInputRef.current) {
      tableFileInputRef.current.value = '';
      tableFileInputRef.current.click();
    }
  };

  const handleTableFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadMaterialId) return;

    const matId = targetUploadMaterialId;
    setUploadingForId(matId);

    const body = new FormData();
    body.append('file', file);
    body.append('materialId', String(matId));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (data.success) {
        showToast(`Dokumen untuk Material #${matId} berhasil disimpan!`);
        fetchData();
      } else {
        alert(data.error || 'Gagal mengunggah');
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingForId(null);
      setTargetUploadMaterialId(null);
    }
  };

  // Admin / Database Modal Handlers
  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');

    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAdminError(data.error || 'Password salah!');
        return;
      }

      setIsAdminUnlocked(true);
      setAdminData(data);
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin me-reset database dan men-seed ulang material standar LabLogix?')) {
      return;
    }

    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput, action: 'reset' }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
        // Refresh admin data info
        const infoRes = await fetch('/api/admin/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: adminPasswordInput }),
        });
        const info = await infoRes.json();
        setAdminData(info);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Filtered Materials list
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch =
        search === '' ||
        (m.itemDescription && m.itemDescription.toLowerCase().includes(search.toLowerCase())) ||
        (m.no && m.no.toLowerCase().includes(search.toLowerCase())) ||
        (m.pic && m.pic.toLowerCase().includes(search.toLowerCase())) ||
        (m.pointOfOrigin && m.pointOfOrigin.toLowerCase().includes(search.toLowerCase())) ||
        (m.pointOfDelivery && m.pointOfDelivery.toLowerCase().includes(search.toLowerCase())) ||
        (m.shipmentBy && m.shipmentBy.toLowerCase().includes(search.toLowerCase())) ||
        (m.analysisRequested && m.analysisRequested.toLowerCase().includes(search.toLowerCase())) ||
        (m.noCoff && m.noCoff.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [materials, search, statusFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Status',
      'Delivery Date',
      'Point of Origin',
      'Point of Delivery',
      'Shipping Requirements',
      'Shipment By',
      'Item Description',
      'PIC',
      'Technical Proposal Status',
      'Cost Proposal Status',
      'Status COFF',
      'No COFF',
      'Analysis Requested',
      'Final Status Report',
      'Remark Raw',
      'LINK FILE'
    ];

    const rows = filteredMaterials.map(m => [
      `"${m.no || ''}"`,
      `"${m.status}"`,
      `"${m.deliveryDate || ''}"`,
      `"${m.pointOfOrigin}"`,
      `"${m.pointOfDelivery}"`,
      `"${(m.shippingRequirements || '').replace(/"/g, '""')}"`,
      `"${m.shipmentBy || ''}"`,
      `"${(m.itemDescription || '').replace(/"/g, '""')}"`,
      `"${m.pic}"`,
      `"${m.technicalProposalStatus || ''}"`,
      `"${m.costProposalStatus || ''}"`,
      `"${m.statusCoff || ''}"`,
      `"${m.noCoff || ''}"`,
      `"${(m.analysisRequested || '').replace(/"/g, '""')}"`,
      `"${m.finalStatusReport || ''}"`,
      `"${(m.remarkRaw || '').replace(/"/g, '""')}"`,
      `"${m.fileUrl || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LabLogix_Material_Monitoring_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'On The Way':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 rounded-full shadow-sm">
            <Truck className="w-3.5 h-3.5 text-sky-500" />
            <span>On The Way</span>
          </span>
        );
      case 'Analysis':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Analysis</span>
          </span>
        );
      case 'Canceled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Canceled</span>
          </span>
        );
      case 'Done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Done</span>
          </span>
        );
      default:
        return (
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
            {status}
          </span>
        );
    }
  };

  // ==========================================
  // VIEW: GERBANG LOGIN (Jika belum login)
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-8 text-center bg-slate-900 text-white relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4">
              <FlaskConical className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">LabLogix</h1>
            <p className="text-xs text-sky-300 font-medium tracking-wide uppercase mt-1">
              Material Monitoring & Testing System
            </p>
            <div className="inline-flex items-center gap-1.5 bg-slate-800 text-emerald-400 text-[11px] font-semibold px-3 py-1 rounded-full mt-3 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gerbang Akses Terproteksi</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih atau Masukkan Nama PIC
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda / PIC"
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
                />

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {['Iwan Joko', 'QC Analyst', 'Handayani', 'Field Inspector'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLoginInput(preset)}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border text-left truncate transition-colors ${
                        loginInput === preset
                          ? 'bg-sky-50 border-sky-400 text-sky-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kata Sandi / PIN (Opsional)
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Masuk ke Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              LabLogix QC &bull; Dokploy Cloud &bull; vector-intertek.web.id
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: DASHBOARD UTAMA
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Hidden file input for direct table upload */}
      <input
        type="file"
        ref={tableFileInputRef}
        onChange={handleTableFileSelected}
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-xs">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">LabLogix</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800 rounded-full tracking-wide">
                  MATERIAL MONITORING &amp; TESTING
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Intertek QC Tracking &bull; Dokploy Infra &bull; vector-intertek.web.id
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Logged in PIC badge */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[11px]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 block font-medium">Akun Login</span>
                <span className="font-bold text-white text-xs">{currentUser}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-slate-400 hover:text-rose-400 p-1 rounded"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin & Database Modal Button */}
            <button
              onClick={() => {
                setIsAdminModalOpen(true);
                setAdminError('');
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-all shadow-sm"
              title="Koneksi & Database (Admin Protected)"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Koneksi &amp; DB</span>
            </button>

            {/* Add New Material Button */}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-sky-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Material</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* ========================================================
            3. STANDARISASI 4 STATUS & 5 KARTU KPI INTERAKTIF
           ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Card 1: Total Material */}
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
              statusFilter === 'all'
                ? 'border-slate-900 ring-2 ring-slate-900/10 bg-slate-50/50'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Material</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{stats.total_materials}</div>
            <p className="mt-0.5 text-[11px] text-slate-500">Semua sampel terdaftar</p>
          </div>

          {/* Card 2: On The Way */}
          <div
            onClick={() => setStatusFilter('On The Way')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
              statusFilter === 'On The Way'
                ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">On The Way</span>
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-sky-600">{stats.on_the_way}</div>
            <p className="mt-0.5 text-[11px] text-sky-700/80">Dalam perjalanan logistik</p>
          </div>

          {/* Card 3: Analysis */}
          <div
            onClick={() => setStatusFilter('Analysis')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
              statusFilter === 'Analysis'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Analysis</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600">{stats.analysis}</div>
            <p className="mt-0.5 text-[11px] text-amber-700/80">Proses uji laboratorium</p>
          </div>

          {/* Card 4: Canceled */}
          <div
            onClick={() => setStatusFilter('Canceled')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
              statusFilter === 'Canceled'
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Canceled</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600">{stats.canceled}</div>
            <p className="mt-0.5 text-[11px] text-rose-700/80">Pengujian dibatalkan</p>
          </div>

          {/* Card 5: Done */}
          <div
            onClick={() => setStatusFilter('Done')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
              statusFilter === 'Done'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Done</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600">{stats.done}</div>
            <p className="mt-0.5 text-[11px] text-emerald-700/80">Laporan selesai terbit</p>
          </div>
        </div>

        {/* Toolbar: Search & Action Buttons */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari deskripsi sampel, No, PIC, origin, COFF..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center gap-1"
              >
                <span>Reset Filter ({statusFilter})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchData}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ========================================================
            TABEL MONITORING UTAMA (19 ATRIBUT MODEL)
           ======================================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-3">No</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Tgl Kirim</th>
                  <th className="py-3.5 px-3">Origin &rarr; Delivery</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Deskripsi Sampel / Material</th>
                  <th className="py-3.5 px-3">PIC (Locked)</th>
                  <th className="py-3.5 px-3">Analisis yang Diminta</th>
                  <th className="py-3.5 px-3 text-center">LINK FILE (Kolom S)</th>
                  <th className="py-3.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">Tidak ada material terdaftar</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Sesuaikan kata kunci pencarian atau klik tombol &quot;Tambah Material&quot;.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {item.no || String(item.id).padStart(3, '0')}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Delivery Date */}
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {item.deliveryDate || '-'}
                      </td>

                      {/* Origin -> Delivery */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{item.pointOfOrigin}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>&rarr;</span>
                          <span>{item.pointOfDelivery}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.itemDescription}</div>
                        {item.shippingRequirements && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                            {item.shippingRequirements}
                          </div>
                        )}
                      </td>

                      {/* PIC */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>{item.pic}</span>
                        </span>
                      </td>

                      {/* Analysis Requested */}
                      <td className="py-3 px-3 text-slate-700 max-w-xs">
                        <span className="line-clamp-2">{item.analysisRequested || '-'}</span>
                      </td>

                      {/* ========================================================
                          6. FITUR UPLOAD & PREVIEW FILE (KOLOM S - LINK FILE)
                         ======================================================== */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.fileUrl ? (
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 rounded-lg transition-colors shadow-sm"
                              title="Buka dokumen di tab baru"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </a>
                            <button
                              onClick={() => triggerTableRowUpload(item.id)}
                              disabled={uploadingForId === item.id}
                              className="p-1 text-slate-400 hover:text-sky-600 rounded"
                              title="Ganti File"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => triggerTableRowUpload(item.id)}
                            disabled={uploadingForId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            <span>{uploadingForId === item.id ? 'Mengunggah...' : '+ Upload'}</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenUpdate(item)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                            title="Buka Modal Update 5 Tab"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                            title="Hapus Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ========================================================
          MODAL 1: TAMBAH MATERIAL (DENGAN LOCKED PIC)
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm sm:text-base">Tambah Material Baru</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Material *</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="On The Way">On The Way</option>
                    <option value="Analysis">Analysis</option>
                    <option value="Canceled">Canceled</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pengiriman</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Material / Sampel *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crude Oil Sample Wellhead A-12"
                  value={formData.itemDescription}
                  onChange={e => setFormData({ ...formData, itemDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              {/* Rute Dropdowns: NO quick-selection pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Point of Origin *</label>
                  <select
                    value={formData.pointOfOrigin}
                    onChange={e => setFormData({ ...formData, pointOfOrigin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    {standardLocations.map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                    <option value="Custom">-- Input Lokasi Kustom --</option>
                  </select>
                  {formData.pointOfOrigin === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Ketik lokasi origin kustom..."
                      value={formData.customOrigin}
                      onChange={e => setFormData({ ...formData, customOrigin: e.target.value })}
                      className="mt-2 w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Point of Delivery *</label>
                  <select
                    value={formData.pointOfDelivery}
                    onChange={e => setFormData({ ...formData, pointOfDelivery: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    {standardLocations.map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                    <option value="Custom">-- Input Lokasi Kustom --</option>
                  </select>
                  {formData.pointOfDelivery === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Ketik lokasi delivery kustom..."
                      value={formData.customDelivery}
                      onChange={e => setFormData({ ...formData, customDelivery: e.target.value })}
                      className="mt-2 w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Locked PIC Requirement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>PIC (Penanggung Jawab)</span>
                    </label>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                      Akun Login (Terkunci)
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={currentUser}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ekspedisi (Shipment By)</label>
                  <input
                    type="text"
                    placeholder="e.g. Altus Logistics / Kurir Internal"
                    value={formData.shipmentBy}
                    onChange={e => setFormData({ ...formData, shipmentBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Analisis yang Diminta</label>
                <textarea
                  rows={2}
                  placeholder="e.g. BS&W, API Gravity, H2S Content, Kinematic Viscosity"
                  value={formData.analysisRequested}
                  onChange={e => setFormData({ ...formData, analysisRequested: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kebutuhan Pengiriman</label>
                <input
                  type="text"
                  placeholder="e.g. Suhu dingin 4°C, botol kaca gelap"
                  value={formData.shippingRequirements}
                  onChange={e => setFormData({ ...formData, shippingRequirements: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: UPDATE MATERIAL 5 TAB TERSTRUKTUR
         ======================================================== */}
      {isUpdateModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">Update Material #{formData.no}</h3>
                  {renderStatusBadge(formData.status)}
                </div>
                <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                  {selectedMaterial.itemDescription}
                </p>
              </div>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5 Tab Navigation Buttons */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-1 overflow-x-auto text-xs font-bold">
              {[
                { id: 'tab1', label: '1. Status & Sampel' },
                { id: 'tab2', label: '2. Rute & Pengiriman' },
                { id: 'tab3', label: '3. Proposal & Laporan' },
                { id: 'tab4', label: '4. Log Aktivitas' },
                { id: 'tab5', label: '5. Lampiran File' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveUpdateTab(tab.id as any)}
                  className={`px-3 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                    activeUpdateTab === tab.id
                      ? 'bg-white text-slate-900 border-sky-500 shadow-sm'
                      : 'text-slate-500 border-transparent hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 text-xs">
              {/* TAB 1: STATUS & SAMPEL */}
              {activeUpdateTab === 'tab1' && (
                <div className="space-y-4">
                  {/* Nomor urut (disabled) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nomor Urut (Otomatis)</label>
                      <input
                        type="text"
                        disabled
                        readOnly
                        value={formData.no}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 font-mono font-bold text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status Saat Ini</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                      >
                        <option value="On The Way">On The Way</option>
                        <option value="Analysis">Analysis</option>
                        <option value="Canceled">Canceled</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>

                  {/* Tombol Ubah Cepat Status */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Ubah Cepat Status</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange('On The Way')}
                        className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                          formData.status === 'On The Way'
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>On The Way</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange('Analysis')}
                        className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                          formData.status === 'Analysis'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        <span>Analysis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange('Canceled')}
                        className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                          formData.status === 'Canceled'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Canceled</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange('Done')}
                        className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                          formData.status === 'Done'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Pengiriman</label>
                      <input
                        type="date"
                        value={formData.deliveryDate}
                        onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    {/* Locked PIC Requirement */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>PIC (Penanggung Jawab)</span>
                        </label>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                          Akun Login (Terkunci)
                        </span>
                      </div>
                      <input
                        type="text"
                        disabled
                        readOnly
                        value={currentUser}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Deskripsi Sampel / Material *</label>
                    <input
                      type="text"
                      required
                      value={formData.itemDescription}
                      onChange={e => setFormData({ ...formData, itemDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Analisis yang Diminta</label>
                    <textarea
                      rows={2}
                      value={formData.analysisRequested}
                      onChange={e => setFormData({ ...formData, analysisRequested: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: RUTE & PENGIRIMAN (DENGAN 6 CHECKPOINT VISUALISASI) */}
              {activeUpdateTab === 'tab2' && (
                <div className="space-y-5">
                  {/* Dropdowns (No pills) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Point of Origin *</label>
                      <select
                        value={formData.pointOfOrigin}
                        onChange={e => setFormData({ ...formData, pointOfOrigin: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        {standardLocations.map(loc => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                        <option value="Custom">-- Input Lokasi Kustom --</option>
                      </select>
                      {formData.pointOfOrigin === 'Custom' && (
                        <input
                          type="text"
                          placeholder="Ketik lokasi origin kustom..."
                          value={formData.customOrigin}
                          onChange={e => setFormData({ ...formData, customOrigin: e.target.value })}
                          className="mt-2 w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Point of Delivery *</label>
                      <select
                        value={formData.pointOfDelivery}
                        onChange={e => setFormData({ ...formData, pointOfDelivery: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        {standardLocations.map(loc => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                        <option value="Custom">-- Input Lokasi Kustom --</option>
                      </select>
                      {formData.pointOfDelivery === 'Custom' && (
                        <input
                          type="text"
                          placeholder="Ketik lokasi delivery kustom..."
                          value={formData.customDelivery}
                          onChange={e => setFormData({ ...formData, customDelivery: e.target.value })}
                          className="mt-2 w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kebutuhan Pengiriman</label>
                      <input
                        type="text"
                        value={formData.shippingRequirements}
                        onChange={e => setFormData({ ...formData, shippingRequirements: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ekspedisi (Shipment By)</label>
                      <input
                        type="text"
                        value={formData.shipmentBy}
                        onChange={e => setFormData({ ...formData, shipmentBy: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* ========================================================
                      4. VISUALISASI TREK 6 CHECKPOINT RUTE LOGISTIK
                     ======================================================== */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-xs uppercase tracking-wider text-sky-200">
                          Trek 6 Checkpoint Rute Logistik
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Klik checkpoint untuk ubah origin</span>
                    </div>

                    <div className="relative pt-8 pb-4">
                      {/* Connecting Line */}
                      <div className="absolute top-12 left-6 right-6 h-1 bg-slate-700 z-0"></div>

                      {/* 6 Checkpoint Nodes */}
                      <div className="relative z-10 grid grid-cols-6 gap-1">
                        {sixCheckpoints.map((cp, idx) => {
                          const isActive = formData.pointOfOrigin === cp;
                          return (
                            <div
                              key={cp}
                              onClick={() => setFormData({ ...formData, pointOfOrigin: cp })}
                              className="flex flex-col items-center cursor-pointer group"
                            >
                              {/* Animated Car Indicator "MOBIL DI SINI" */}
                              {isActive && (
                                <div className="absolute -top-6 flex flex-col items-center animate-bounce z-20">
                                  <span className="px-2 py-0.5 text-[9px] font-black bg-sky-400 text-slate-950 rounded-full shadow-lg shadow-sky-400/50 uppercase tracking-tighter whitespace-nowrap">
                                    MOBIL DI SINI
                                  </span>
                                  <Truck className="w-4 h-4 text-sky-300 mt-0.5" />
                                </div>
                              )}

                              {/* Dot Node */}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                                  isActive
                                    ? 'bg-sky-400 text-slate-950 ring-4 ring-sky-400/30 scale-110'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                                }`}
                              >
                                {idx + 1}
                              </div>

                              {/* Label */}
                              <span
                                className={`mt-2 text-center text-[10px] font-semibold leading-tight max-w-[80px] transition-colors ${
                                  isActive ? 'text-sky-300 font-bold' : 'text-slate-400 group-hover:text-slate-200'
                                }`}
                              >
                                {cp}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROPOSAL, COFF & LAPORAN */}
              {activeUpdateTab === 'tab3' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Technical Proposal Status</label>
                      <input
                        type="text"
                        value={formData.technicalProposalStatus}
                        onChange={e => setFormData({ ...formData, technicalProposalStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        placeholder="e.g. Approved / Submitted"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Cost Proposal Status</label>
                      <input
                        type="text"
                        value={formData.costProposalStatus}
                        onChange={e => setFormData({ ...formData, costProposalStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        placeholder="e.g. Accepted / In Review"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status COFF</label>
                      <input
                        type="text"
                        value={formData.statusCoff}
                        onChange={e => setFormData({ ...formData, statusCoff: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        placeholder="e.g. Issued / Pending"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">No. COFF</label>
                      <input
                        type="text"
                        value={formData.noCoff}
                        onChange={e => setFormData({ ...formData, noCoff: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                        placeholder="e.g. COFF-2026-081"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Final Status Report</label>
                    <input
                      type="text"
                      value={formData.finalStatusReport}
                      onChange={e => setFormData({ ...formData, finalStatusReport: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                      placeholder="e.g. Certificate of Analysis Released / In Progress"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: LOG AKTIVITAS (TIMELINE DENGAN HAPUS PER BARIS) */}
              {activeUpdateTab === 'tab4' && (
                <div className="space-y-4">
                  {/* Form Tambah Catatan Baru */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="font-bold text-slate-800 block text-xs">Tambah Catatan Aktivitas Baru</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Tanggal Log</label>
                        <input
                          type="date"
                          value={newLogDate}
                          onChange={e => setNewLogDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">PIC (Otomatis)</label>
                        <input
                          type="text"
                          disabled
                          readOnly
                          value={currentUser}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 font-bold text-slate-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Deskripsi Aktivitas</label>
                      <input
                        type="text"
                        placeholder="e.g. Sampel telah tiba di lab dan siap dilakukan preparasi..."
                        value={newLogActivity}
                        onChange={e => setNewLogActivity(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddLog}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah ke Log</span>
                      </button>
                    </div>
                  </div>

                  {/* Daftar Timeline Riwayat dengan Tombol Hapus per Baris */}
                  <div>
                    <span className="font-bold text-slate-700 block mb-2">Riwayat Timeline Aktivitas</span>
                    {parsedLogs.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Belum ada riwayat aktivitas yang tercatat.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {parsedLogs.map((logEntry, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0"></div>
                              <span className="text-slate-700 font-medium leading-relaxed">{logEntry}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded shrink-0 transition-colors"
                              title="Hapus baris log ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: LAMPIRAN FILE (KOLOM S - LINK FILE) */}
              {activeUpdateTab === 'tab5' && (
                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/50 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">Upload Lampiran / Dokumen Uji</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Mendukung PDF, Word, Excel, Gambar hasil lab (Disimpan ke S3 &amp; Versi Paksa Anti-Gagal).
                      </p>
                    </div>

                    <div className="pt-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>{modalUploading ? 'Sedang Mengunggah...' : 'Pilih File Dokumen'}</span>
                        <input
                          type="file"
                          onChange={handleModalFileUpload}
                          disabled={modalUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {formData.fileUrl ? (
                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block text-xs truncate">
                            Dokumen Terlampir (Kolom S - LINK FILE)
                          </span>
                          <span className="text-[11px] text-sky-700 font-mono truncate block">
                            {formData.fileUrl.startsWith('data:')
                              ? 'Base64 Data Document (Versi Paksa)'
                              : formData.fileUrl}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={formData.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fileUrl: '' })}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-100 rounded-xl text-center text-slate-500 text-xs">
                      Belum ada file yang terlampir pada material ini.
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
                <span className="text-[11px] text-slate-400">
                  Perubahan akan disimpan langsung ke database PostgreSQL
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveUpdate()}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: HALAMAN ADMIN KONEKSI & DATABASE (PASSWORD: intertekqc)
         ======================================================== */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">Koneksi &amp; Status Database</h3>
              </div>
              <button
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setIsAdminUnlocked(false);
                  setAdminPasswordInput('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-xs">
              {!isAdminUnlocked ? (
                <form onSubmit={handleUnlockAdmin} className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800">
                    <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Halaman ini dilindungi kata sandi administrator. Masukkan kata sandi untuk melanjutkan.</span>
                  </div>

                  {adminError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
                      {adminError}
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Password Administrator</label>
                    <input
                      type="password"
                      required
                      placeholder="Masukkan password admin..."
                      value={adminPasswordInput}
                      onChange={e => setAdminPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAdminModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 rounded-xl font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={adminLoading}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
                    >
                      {adminLoading ? 'Memeriksa...' : 'Buka Kunci'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Status Database: TERKONEKSI OTOMATIS</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>

                  {adminData && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Database Server:</span>
                        <span className="font-bold text-slate-800">{adminData.database}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Host &amp; Port:</span>
                        <span className="font-bold text-slate-800">{adminData.host}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Database Name:</span>
                        <span className="font-bold text-slate-800">{adminData.dbName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">RustFS S3 Endpoint:</span>
                        <span className="font-bold text-slate-800">{adminData.s3Endpoint}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Material Terdaftar:</span>
                        <span className="font-bold text-sky-700 text-sm">{adminData.totalMaterials} Data</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            'postgresql://inve_user:InveLab2026SecurePass@149.41.198.83:5432/inve_db'
                          );
                          setCopiedConfig(true);
                          setTimeout(() => setCopiedConfig(false), 2000);
                        }}
                        className="flex-1 py-2 px-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                      >
                        {copiedConfig ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin URL Database</span>
                          </>
                        )}
                      </button>

                      <a
                        href="http://149.41.198.83:8080"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Adminer</span>
                        <ExternalLink className="w-3 h-3 text-indigo-200" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetDatabase}
                      disabled={adminLoading}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${adminLoading ? 'animate-spin' : ''}`} />
                      <span>Reset Data ke Sampel Standar LabLogix</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} LabLogix Material Monitoring &amp; Testing System &bull; Intertek QC</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              PostgreSQL Dokploy
            </span>
            <span className="flex items-center gap-1 text-sky-600 font-medium">
              <Cloud className="w-3.5 h-3.5" />
              RustFS S3 (Versi Paksa Ready)
            </span>
            <a
              href="http://149.41.198.83:8080"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline font-semibold"
            >
              Adminer DB
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
