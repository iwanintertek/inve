'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Package,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Plus,
  Search,
  Filter,
  FileText,
  Upload,
  ExternalLink,
  RefreshCw,
  Database,
  Cloud,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Layers,
  MapPin,
  Flame,
  Skull,
  ShieldAlert,
  Download,
  X,
  History
} from 'lucide-react';

interface Item {
  id: number;
  code: string;
  name: string;
  category: string;
  cas_number: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  location: string;
  batch_number: string | null;
  expiry_date: string | null;
  hazard_classification: string;
  document_url: string | null;
  document_name: string | null;
  notes: string | null;
  is_low_stock?: boolean;
  expiry_status?: 'good' | 'expiring_soon' | 'expired';
}

interface Transaction {
  id: number;
  item_id: number;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  purpose: string | null;
  performed_by: string;
  notes: string | null;
  created_at: string;
  item_name?: string;
  item_code?: string;
  item_unit?: string;
  item_category?: string;
}

interface Stats {
  total_items: number;
  low_stock_count: number;
  expiring_count: number;
  expired_count: number;
}

export default function InventoryDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_items: 0,
    low_stock_count: 0,
    expiring_count: 0,
    expired_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'history' | 'locations'>('catalog');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low_stock' | 'expiring' | 'expired'>('all');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<Item | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Chemical',
    cas_number: '',
    unit: 'L',
    current_stock: 0,
    minimum_stock: 1,
    location: '',
    batch_number: '',
    expiry_date: '',
    hazard_classification: 'none',
    document_url: '',
    document_name: '',
    notes: '',
  });

  const [stockForm, setStockForm] = useState({
    transaction_type: 'OUT' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 1,
    purpose: '',
    performed_by: '',
    notes: '',
  });

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load items and stats
  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, statsRes, txRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/stats'),
        fetch('/api/transactions?limit=50'),
      ]);

      const itemsData = await itemsRes.json();
      const statsData = await statsRes.json();
      const txData = await txRes.json();

      if (itemsData.success) setItems(itemsData.items);
      if (statsData.success) setStats(statsData.stats);
      if (txData.success) setTransactions(txData.transactions);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Open Add Item Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Chemical',
      cas_number: '',
      unit: 'L',
      current_stock: 1,
      minimum_stock: 2,
      location: 'Cabinet 1',
      batch_number: '',
      expiry_date: '',
      hazard_classification: 'none',
      document_url: '',
      document_name: '',
      notes: '',
    });
    setErrorMsg('');
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      cas_number: item.cas_number || '',
      unit: item.unit,
      current_stock: item.current_stock,
      minimum_stock: item.minimum_stock,
      location: item.location,
      batch_number: item.batch_number || '',
      expiry_date: item.expiry_date || '',
      hazard_classification: item.hazard_classification || 'none',
      document_url: item.document_url || '',
      document_name: item.document_name || '',
      notes: item.notes || '',
    });
    setErrorMsg('');
    setIsItemModalOpen(true);
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors?.fieldErrors) {
          const firstErr = Object.values(data.errors.fieldErrors)[0] as string[];
          setErrorMsg(firstErr[0] || 'Validation failed');
        } else {
          setErrorMsg(data.error || 'Failed to save item');
        }
        return;
      }

      showToast(editingItem ? 'Item updated successfully!' : 'New item added to inventory!');
      setIsItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Item deleted from inventory');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Stock Modal
  const handleOpenStock = (item: Item, type: 'IN' | 'OUT' | 'ADJUSTMENT' = 'OUT') => {
    setSelectedStockItem(item);
    setStockForm({
      transaction_type: type,
      quantity: 1,
      purpose: type === 'OUT' ? 'QC Sample Testing' : type === 'IN' ? 'Purchase Delivery' : 'Stock Audit',
      performed_by: '',
      notes: '',
    });
    setErrorMsg('');
    setIsStockModalOpen(true);
  };

  // Submit Stock Transaction
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    setErrorMsg('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedStockItem.id,
          ...stockForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to record stock movement');
        return;
      }

      showToast(data.message || 'Stock successfully updated!');
      setIsStockModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction failed');
    }
  };

  // File Upload to RustFS S3
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          document_url: data.url,
          document_name: data.fileName,
        }));
        showToast(`File ${data.fileName} uploaded to RustFS S3!`);
      } else {
        alert(data.error || 'Failed to upload document');
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        search === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.cas_number && item.cas_number.toLowerCase().includes(search.toLowerCase())) ||
        item.location.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      let matchesFilter = true;
      if (stockFilter === 'low_stock') {
        matchesFilter = item.current_stock <= item.minimum_stock;
      } else if (stockFilter === 'expiring') {
        matchesFilter = item.expiry_status === 'expiring_soon';
      } else if (stockFilter === 'expired') {
        matchesFilter = item.expiry_status === 'expired';
      }

      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [items, search, selectedCategory, stockFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Code', 'Name', 'Category', 'CAS', 'Stock', 'Unit', 'Min Stock', 'Location', 'Batch', 'Expiry Date', 'Hazard'];
    const rows = filteredItems.map(i => [
      i.code,
      `"${i.name.replace(/"/g, '""')}"`,
      i.category,
      i.cas_number || '',
      i.current_stock,
      i.unit,
      i.minimum_stock,
      `"${i.location}"`,
      i.batch_number || '',
      i.expiry_date || '',
      i.hazard_classification,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inve_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = ['All', 'Chemical', 'Biological', 'Glassware', 'Consumable', 'Equipment', 'Other'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 transition-all animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
                  inve
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-800 rounded-full">
                  LAB INVENTORY
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Laboratory Inventory & Reagent Management System</p>
            </div>
          </div>

          {/* Infrastructure Health Status & Adminer Link */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                PostgreSQL Live
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <Cloud className="w-3.5 h-3.5" />
                RustFS S3 Ready
              </span>
            </div>

            <a
              href="http://149.41.198.83:8080"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all border border-indigo-400/30"
              title="Open Adminer Database Manager"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Adminer DB</span>
              <ExternalLink className="w-3 h-3 text-indigo-200" />
            </a>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* KPI / Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setStockFilter('all')}
            className={`p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow ${
              stockFilter === 'all' ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Items</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total_items}</div>
            <p className="mt-1 text-xs text-slate-500">Across all categories</p>
          </div>

          <div
            onClick={() => setStockFilter('low_stock')}
            className={`p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow ${
              stockFilter === 'low_stock' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600">{stats.low_stock_count}</div>
            <p className="mt-1 text-xs text-amber-700">At or below reorder level</p>
          </div>

          <div
            onClick={() => setStockFilter('expiring')}
            className={`p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow ${
              stockFilter === 'expiring' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring Soon</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-orange-600">{stats.expiring_count}</div>
            <p className="mt-1 text-xs text-orange-700">Within the next 30 days</p>
          </div>

          <div
            onClick={() => setStockFilter('expired')}
            className={`p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow ${
              stockFilter === 'expired' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expired</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-600">{stats.expired_count}</div>
            <p className="mt-1 text-xs text-rose-700">Dispose according to SOP</p>
          </div>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory Catalog</span>
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Stock Transactions</span>
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                {transactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'locations'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Locations</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
              title="Export Current View as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchData}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* TAB 1: INVENTORY CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by reagent name, code, CAS #, location..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Item Code & Name</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">CAS / Batch</th>
                      <th className="py-3 px-4 text-right">Current Stock</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Expiry</th>
                      <th className="py-3 px-3">Hazard</th>
                      <th className="py-3 px-3">Document</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                          <p className="font-medium text-slate-600">No laboratory items found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Try adjusting your search criteria or add a new inventory item.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map(item => {
                        const isLow = item.current_stock <= item.minimum_stock;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{item.name}</div>
                              <div className="text-xs font-mono text-slate-500 mt-0.5">{item.code}</div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                {item.category}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-xs text-slate-600 font-mono">
                              {item.cas_number && <div>CAS: {item.cas_number}</div>}
                              {item.batch_number && <div className="text-slate-400 text-[11px]">{item.batch_number}</div>}
                              {!item.cas_number && !item.batch_number && <span className="text-slate-300">-</span>}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="font-bold text-slate-900 text-base">{item.current_stock}</span>
                                <span className="text-xs text-slate-500">{item.unit}</span>
                              </div>
                              {isLow && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Min: {item.minimum_stock}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-xs text-slate-700 font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {item.location}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-xs">
                              {item.expiry_date ? (
                                item.expiry_status === 'expired' ? (
                                  <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    Expired: {item.expiry_date}
                                  </span>
                                ) : item.expiry_status === 'expiring_soon' ? (
                                  <span className="text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                    Exp: {item.expiry_date}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">{item.expiry_date}</span>
                                )
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              {item.hazard_classification === 'flammable' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                  <Flame className="w-3 h-3 text-red-500" /> Flammable
                                </span>
                              )}
                              {item.hazard_classification === 'corrosive' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                                  <ShieldAlert className="w-3 h-3 text-amber-600" /> Corrosive
                                </span>
                              )}
                              {item.hazard_classification === 'toxic' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                  <Skull className="w-3 h-3 text-purple-600" /> Toxic
                                </span>
                              )}
                              {item.hazard_classification === 'biohazard' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                                  Biohazard
                                </span>
                              )}
                              {item.hazard_classification === 'oxidizing' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-800 bg-yellow-50 border border-yellow-300 px-2 py-0.5 rounded-full">
                                  Oxidizing
                                </span>
                              )}
                              {(!item.hazard_classification || item.hazard_classification === 'none') && (
                                <span className="text-slate-400 text-xs">None</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-xs">
                              {item.document_url ? (
                                <a
                                  href={item.document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-medium hover:underline"
                                  title={item.document_name || 'Download MSDS/Spec'}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[80px]">{item.document_name || 'MSDS'}</span>
                                </a>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenStock(item, 'OUT')}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded transition-colors"
                                  title="Check Out / Use Stock"
                                >
                                  Use
                                </button>
                                <button
                                  onClick={() => handleOpenStock(item, 'IN')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors"
                                  title="Add / Receive Stock"
                                >
                                  + In
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                  title="Edit Item Details"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK TRANSACTION HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Audit Trail / Stock Transaction Log</h3>
                <p className="text-xs text-slate-500">Record of all stock received, withdrawn, or adjusted.</p>
              </div>
              <span className="text-xs font-semibold text-slate-600">Showing last 50 transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-3 text-right">Stock (Before &rarr; After)</th>
                    <th className="py-3 px-4">Purpose / Experiment</th>
                    <th className="py-3 px-4">Analyst / Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900">{tx.item_name}</span>
                          <span className="block text-xs font-mono text-slate-500">{tx.item_code}</span>
                        </td>
                        <td className="py-3 px-3">
                          {tx.transaction_type === 'IN' && (
                            <span className="inline-block px-2 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded">
                              + STOCK IN
                            </span>
                          )}
                          {tx.transaction_type === 'OUT' && (
                            <span className="inline-block px-2 py-0.5 text-xs font-bold text-amber-800 bg-amber-100 rounded">
                              - STOCK OUT
                            </span>
                          )}
                          {tx.transaction_type === 'ADJUSTMENT' && (
                            <span className="inline-block px-2 py-0.5 text-xs font-bold text-indigo-800 bg-indigo-100 rounded">
                              ADJUSTMENT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {tx.quantity} {tx.item_unit}
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-slate-600 font-mono">
                          {tx.previous_stock} &rarr; <span className="font-bold text-slate-900">{tx.new_stock}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-xs">
                          {tx.purpose || '-'}
                          {tx.notes && <span className="block text-[11px] text-slate-400 italic">{tx.notes}</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium text-xs">
                          {tx.performed_by}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LOCATIONS VIEW */}
        {activeTab === 'locations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(items.map(i => i.location))).map(loc => {
              const locItems = items.filter(i => i.location === loc);
              return (
                <div key={loc} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{loc}</h4>
                        <span className="text-xs text-slate-500">{locItems.length} items stored</span>
                      </div>
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-50 text-xs max-h-48 overflow-y-auto">
                    {locItems.map(item => (
                      <li key={item.id} className="py-1.5 flex items-center justify-between">
                        <span className="font-medium text-slate-800 truncate max-w-[180px]">{item.name}</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {item.current_stock} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT ITEM */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 my-8 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">
                  {editingItem ? `Edit Item: ${editingItem.code}` : 'Add New Laboratory Item'}
                </h3>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code / SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. CHM-001"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Chemical">Chemical / Solvent</option>
                    <option value="Biological">Biological / Reagent</option>
                    <option value="Glassware">Glassware</option>
                    <option value="Consumable">Consumable / PPE</option>
                    <option value="Equipment">Lab Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Item Name / Description *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. Sulfuric Acid 98% AR Grade"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CAS Registry Number</label>
                  <input
                    type="text"
                    value={formData.cas_number}
                    onChange={e => setFormData({ ...formData, cas_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="e.g. 7664-93-9"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="e.g. L, mL, g, kg, pcs, box"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Storage Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="e.g. Acid Cabinet 2, Shelf 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {!editingItem && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Initial Stock *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={formData.current_stock}
                      onChange={e => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Threshold *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.minimum_stock}
                    onChange={e => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={e => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="LOT-2026-X"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hazard Classification</label>
                  <select
                    value={formData.hazard_classification}
                    onChange={e => setFormData({ ...formData, hazard_classification: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="none">None / Non-Hazardous</option>
                    <option value="flammable">Flammable</option>
                    <option value="corrosive">Corrosive (Acid/Base)</option>
                    <option value="toxic">Toxic / Poison</option>
                    <option value="oxidizing">Oxidizing Agent</option>
                    <option value="biohazard">Biohazard</option>
                  </select>
                </div>

                {/* RustFS S3 File Upload */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    MSDS / Safety Sheet (Upload to RustFS S3)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-lg text-slate-600 bg-slate-50 transition-colors">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="truncate">
                        {uploading
                          ? 'Uploading to S3...'
                          : formData.document_name
                          ? formData.document_name
                          : 'Choose file (PDF, Doc)'}
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {formData.document_url && (
                      <a
                        href={formData.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded border border-sky-200"
                        title="View document"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Notes & Handling Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Store in dark glass bottle. Keep away from ignition sources."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK IN / OUT / ADJUSTMENT */}
      {isStockModalOpen && selectedStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Record Stock Movement</h3>
                <p className="text-xs text-sky-300">{selectedStockItem.name}</p>
              </div>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Current balance card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Available In Stock</span>
                  <span className="text-lg font-bold text-slate-900">
                    {selectedStockItem.current_stock} {selectedStockItem.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Item Code</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedStockItem.code}</span>
                </div>
              </div>

              {/* Action type radio pills */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockForm({ ...stockForm, transaction_type: 'OUT' })}
                    className={`py-2 text-center rounded-lg font-bold transition-all ${
                      stockForm.transaction_type === 'OUT'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    - Stock OUT
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockForm({ ...stockForm, transaction_type: 'IN' })}
                    className={`py-2 text-center rounded-lg font-bold transition-all ${
                      stockForm.transaction_type === 'IN'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    + Stock IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockForm({ ...stockForm, transaction_type: 'ADJUSTMENT' })}
                    className={`py-2 text-center rounded-lg font-bold transition-all ${
                      stockForm.transaction_type === 'ADJUSTMENT'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Adjust
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {stockForm.transaction_type === 'ADJUSTMENT' ? 'New Counted Stock *' : 'Quantity *'} ({selectedStockItem.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={stockForm.quantity}
                  onChange={e => setStockForm({ ...stockForm, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Purpose / Experiment Name / Reference *
                </label>
                <input
                  type="text"
                  required
                  value={stockForm.purpose}
                  onChange={e => setStockForm({ ...stockForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Exp #84: Water Quality Titration"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Performed By (Analyst / Staff Name) *
                </label>
                <input
                  type="text"
                  required
                  value={stockForm.performed_by}
                  onChange={e => setStockForm({ ...stockForm, performed_by: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Dr. Jane Doe"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={stockForm.notes}
                  onChange={e => setStockForm({ ...stockForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Prepared 250mL 0.1M solution"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} inve Laboratory Inventory System &bull; vector-intertek.web.id</span>
          <div className="flex items-center gap-4">
            <span>PostgreSQL: 149.41.198.83:5432</span>
            <span>RustFS S3: 149.41.198.83:9000</span>
            <a href="http://149.41.198.83:8080" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
              Adminer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
