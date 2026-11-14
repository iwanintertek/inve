# LabLogix - Material Monitoring & Testing System 🧪

A specialized laboratory material monitoring and logistics tracking system built with **Next.js 15 (App Router)**, **TypeScript**, **Zod**, **PostgreSQL**, and **RustFS S3**.

Deployed and orchestrated on **Dokploy** under domain [vector-intertek.web.id](https://vector-intertek.web.id).

---

## 🌟 Fitur Utama & Aturan Bisnis

### 1. Skema Data 19 Kolom & Filter Header Otomatis
Mendukung 19 atribut standar:
`no`, `status`, `deliveryDate`, `pointOfOrigin`, `pointOfDelivery`, `shippingRequirements`, `shipmentBy`, `itemDescription`, `pic`, `technicalProposalStatus`, `costProposalStatus`, `statusCoff`, `noCoff`, `analysisRequested`, `finalStatusReport`, `remarkRaw`, `remarkStructured`, `remarkParseNote`, dan `fileUrl` (Kolom S - LINK FILE).
Filter otomatis melewati baris header jika `no.toLowerCase() === 'no'` atau `status.toLowerCase() === 'status'` atau `itemDescription` mengandung `'item description'`.

### 2. Gerbang Login & Penguncian PIC Otomatis (Locked PIC)
- Pengguna wajib login sebelum mengakses dashboard monitoring.
- Field `PIC` pada Modal Tambah Material dan Modal Update Material otomatis terisi dari akun login dan dikunci (`disabled` & `readOnly`) dengan ikon gembok serta badge `"Akun Login"`.

### 3. Standarisasi 4 Status & 5 Kartu KPI Interaktif
- 4 Status Resmi:
  1. **On The Way** (Badge Sky / Biru Muda + Ikon Truk)
  2. **Analysis** (Badge Amber / Kuning + Indikator Titik Berkedip)
  3. **Canceled** (Badge Rose / Merah + Ikon Peringatan)
  4. **Done** (Badge Emerald / Hijau + Ikon Centang)
- 5 Kartu KPI di atas dashboard (Total Material, On The Way, Analysis, Canceled, Done) yang dapat diklik untuk memfilter tabel secara instan.

### 4. Visualisasi 6 Checkpoint Rute Logistik
- Dropdown standar lokasi origin & delivery:
  `['FPU', 'ORF', 'PSTB', 'Somber / Altus', 'Intertek Balikpapan', 'Intertek Jakarta', 'Handayani']` + opsi kustom.
- Trek 6 Checkpoint di Tab 2:
  `FPU ➔ ORF ➔ PSTB ➔ Somber / Altus ➔ Intertek Balikpapan ➔ Intertek Jakarta`
  dengan indikator animasi `"MOBIL DI SINI"` di atas checkpoint aktif yang otomatis berpindah mengikuti Point of Origin dan dapat diklik langsung.

### 5. Modal Update Material 5 Tab Terstruktur
- **Tab 1 (Status & Sampel)**: Nomor urut otomatis (disabled), dropdown 4 status, tombol Ubah Cepat Status, tanggal pengiriman, deskripsi sampel, PIC terkunci, dan analisis yang diminta.
- **Tab 2 (Rute & Pengiriman)**: Lokasi origin & delivery, kebutuhan pengiriman, ekspedisi (Shipment By), visualisasi 6 Checkpoint mobil.
- **Tab 3 (Proposal, COFF & Laporan)**: Technical Proposal Status, Cost Proposal Status, Status COFF, No. COFF, dan Final Status Report.
- **Tab 4 (Log Aktivitas)**: Form tambah catatan baru (Date Picker, PIC otomatis, input teks aktivitas, tombol "Tambah ke Log" disimpan ke `remarkRaw` dipisahkan `"<br> "`), serta daftar timeline riwayat log dengan tombol Hapus (ikon tempat sampah merah) per baris log.
- **Tab 5 (Lampiran File)**: Area upload dokumen/foto untuk mengisi `fileUrl` (Kolom S: LINK FILE), tombol Preview dan Hapus File.

### 6. Fitur Upload & Preview File "Versi Paksa" (100% Anti-Gagal)
- Di Tabel Monitoring Utama (Kolom S - LINK FILE):
  * Jika belum ada file: tombol `+ Upload` langsung di baris tabel.
  * Jika sudah ada file: tombol `Preview` (tab baru) dan tombol ganti file.
- Di Backend Upload: mencoba upload ke RustFS S3; jika terjadi kendala izin/koneksi/CORS, otomatis mengaktifkan "Versi Paksa" (Robust Fallback) dengan menyimpan Base64 Data URL sehingga upload 100% anti-gagal dan dapat langsung di-preview.

### 7. Koneksi Database Otomatis & Halaman Admin Terproteksi
- Koneksi default ke database Dokploy PostgreSQL (`inve_db`).
- Halaman Koneksi & Database diproteksi password administrator (`intertekqc`) untuk cek status sinkronisasi, salin connection string, dan reset database ke sampel standar LabLogix.

---

## 🛠️ Infrastruktur & Kredensial

- **Aplikasi Web:** [https://vector-intertek.web.id](https://vector-intertek.web.id)
- **Adminer DB GUI:** [http://149.41.198.83:8080](http://149.41.198.83:8080)
- **RustFS S3:** `http://149.41.198.83:9000` (Console: `http://149.41.198.83:9001`)
- **Dokploy:** `http://149.41.198.83:3000`
- **Admin Password:** `intertekqc`
