import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import kasOrganisasiABI from './contracts/KasOrganisasi.json'
import ExcelJS from 'exceljs' // 🔥 Pengganti xlsx yang 100% aman
import Swal from 'sweetalert2' // 🔥 Animasi pop-up mewah

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const LOCAL_RPC_URL = "http://127.0.0.1:8545" 
const NAMA_JABATAN = { 1: "Chairman", 2: "Vice Chairman", 3: "Treasurer" }

// 🔥 Konfigurasi Tema Animasi Alert Glassmorphism
const GlassAlert = Swal.mixin({
  background: 'rgba(15, 23, 42, 0.95)',
  color: '#E2E8F0',
  backdrop: 'rgba(0,0,0,0.75)',
  confirmButtonColor: '#3B82F6',
  customClass: {
    popup: 'swal-glass-popup',
    title: 'swal-glass-title',
    confirmButton: 'swal-glass-btn'
  }
})

// 🔥 Konfigurasi Toast (Notif kecil di pojok untuk file upload)
const GlassToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: 'rgba(15, 23, 42, 0.95)',
  color: '#60A5FA',
  customClass: { popup: 'swal-glass-popup' }
})

// ==========================================
// COMPONENT: 3D BLOCKCHAIN BACKGROUND
// ==========================================
const BlockchainBackground = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0, backgroundColor: '#050810' }}>
      <div className="cyber-grid"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.5))', pointerEvents: 'none' }}>
        <g stroke="rgba(96, 165, 250, 0.15)" strokeWidth="1.5" fill="none">
          <line x1="10%" y1="80%" x2="30%" y2="40%" className="path-glow" />
          <line x1="30%" y1="40%" x2="60%" y2="50%" className="path-glow" />
          <line x1="60%" y1="50%" x2="85%" y2="20%" className="path-glow" />
          <line x1="20%" y1="90%" x2="45%" y2="60%" className="path-glow" style={{ animationDelay: '1.5s' }} />
          <line x1="45%" y1="60%" x2="70%" y2="65%" className="path-glow" style={{ animationDelay: '1.5s' }} />
          <line x1="70%" y1="65%" x2="95%" y2="35%" className="path-glow" style={{ animationDelay: '1.5s' }} />
        </g>
        {[ 
          { cx: '30%', cy: '40%', delay: '0s' }, 
          { cx: '60%', cy: '50%', delay: '1s' }, 
          { cx: '85%', cy: '20%', delay: '2s' },
          { cx: '45%', cy: '60%', delay: '0.5s' },
          { cx: '70%', cy: '65%', delay: '1.5s' }
        ].map((node, i) => (
          <circle key={i} cx={node.cx} cy={node.cy} r="5" fill="#60A5FA" className="node-float" style={{ animationDelay: node.delay }} />
        ))}
      </svg>
    </div>
  );
};

function App() {
  const [viewMode, setViewMode] = useState("publik") 
  const [activeTab, setActiveTab] = useState("dashboard") 

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(false)

  const [alamatResmi, setAlamatResmi] = useState({ ketua: "", wakil: "", bendahara: "" })
  const [statusPemulihan, setStatusPemulihan] = useState({ 1: null, 2: null, 3: null })
  const [targetPemulihan, setTargetPemulihan] = useState("1")
  const [dompetPemulihanBaru, setDompetPemulihanBaru] = useState("")

  const [namaPenyumbang, setNamaPenyumbang] = useState("")
  const [keteranganIuran, setKeteranganIuran] = useState("")
  const [nominalIuran, setNominalIuran] = useState("")
  
  const [judul, setJudul] = useState("")
  const [rincianSingkat, setRincianSingkat] = useState("")
  const [nominal, setNominal] = useState("")
  const [tujuan, setTujuan] = useState("")
  const [fileProposal, setFileProposal] = useState(null)
  
  const [saldoBrankas, setSaldoBrankas] = useState("0")
  const [antreanPengajuan, setAntreanPengajuan] = useState([])
  const [proposalSudahDiTTD, setProposalSudahDiTTD] = useState([]) 
  const [laporanPemasukan, setLaporanPemasukan] = useState([])
  const [laporanPengeluaran, setLaporanPengeluaran] = useState([])
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7))

  const [nomorWA, setNomorWA] = useState("")
  const [isWaRegistered, setIsWaRegistered] = useState(true) 
  
  const [ethPriceIdr, setEthPriceIdr] = useState(0)

  const handleLogout = () => {
    setIsLoggedIn(false); setWalletAddress(""); setRole("");
    setUsername(""); setPassword(""); setNomorWA("");
    setProposalSudahDiTTD([]); setAntreanPengajuan([]);
    setLaporanPemasukan([]); setLaporanPengeluaran([]); 
    setActiveTab("dashboard"); 
    setViewMode("publik");
  }

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=idr")
        const data = await response.json()
        if(data && data.ethereum && data.ethereum.idr) setEthPriceIdr(data.ethereum.idr)
      } catch (error) { setEthPriceIdr(45000000) }
    }
    fetchEthPrice()
  }, [])

  const hitungSaldoRupiah = () => {
    const totalRupiah = parseFloat(saldoBrankas || "0") * ethPriceIdr;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalRupiah);
  }

  async function fetchDataBlockchain() {
    try {
      const readProvider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, kasOrganisasiABI.abi, readProvider);

      let signerAddr = null;
      if (viewMode !== "publik" && window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await browserProvider.getSigner();
          signerAddr = signer.address;
        } catch(e) { } 
      }

      const addrKetua = await readContract.ketua(); 
      const addrWakil = await readContract.wakil(); 
      const addrBendahara = await readContract.bendahara();

      const balanceWei = await readProvider.getBalance(CONTRACT_ADDRESS)
      setSaldoBrankas(ethers.formatEther(balanceWei))

      const jmlPemasukan = await readContract.getJumlahPemasukan()
      let tempPemasukan = []
      for (let i = 0; i < Number(jmlPemasukan); i++) {
        const item = await readContract.riwayatPemasukan(i)
        tempPemasukan.push({
          nama: item.namaPenyumbang !== undefined ? item.namaPenyumbang : item[0],
          keterangan: item.keterangan !== undefined ? item.keterangan : item[1],
          nominal: ethers.formatEther(item.nominal !== undefined ? item.nominal : item[2]),
          waktu: Number(item.waktuSetor !== undefined ? item.waktuSetor : item[3])
        })
      }
      setLaporanPemasukan(tempPemasukan.reverse()) 

      let tempAntrean = []; let tempPengeluaran = []; let tempSudahTtd = [];
      for (let i = 0; i < 15; i++) {
        try {
          const p = await readContract.daftarPengajuan(i)
          const nominalWei = p.nominal !== undefined ? p.nominal : p[2];
          if (!nominalWei || nominalWei.toString() === "0") continue; 

          const isExecuted = p.executed !== undefined ? p.executed : p[4];
          if (signerAddr && !isExecuted) {
            const hasApp = await readContract.hasApproved(i, signerAddr);
            if (hasApp) tempSudahTtd.push(i); 
          }

          const hasKetuaApp = await readContract.hasApproved(i, addrKetua);

          const dataPengajuan = {
            id: i, judul: p.judul !== undefined ? p.judul : p[0], 
            rincian: p.rincianSingkat !== undefined ? p.rincianSingkat : p[1], 
            nominal: ethers.formatEther(nominalWei), tujuan: p.tujuan !== undefined ? p.tujuan : p[3], 
            approvalCount: (p.approvalCount !== undefined ? p.approvalCount : p[5]).toString(),
            waktu: Number(p.waktuCair !== undefined ? p.waktuCair : p[6]), adaBerkas: p.adaBerkas !== undefined ? p.adaBerkas : p[7],
            ketuaHasApproved: hasKetuaApp 
          }

          if (!isExecuted) tempAntrean.push(dataPengajuan) 
          else tempPengeluaran.push(dataPengajuan) 
        } catch (error) { break; }
      }
      setAntreanPengajuan(tempAntrean); setLaporanPengeluaran(tempPengeluaran.reverse()); setProposalSudahDiTTD(tempSudahTtd);

      if (viewMode !== "publik" && signerAddr) {
        setAlamatResmi({ ketua: addrKetua.toLowerCase(), wakil: addrWakil.toLowerCase(), bendahara: addrBendahara.toLowerCase() })

        let tempPemulihan = {}
        for(let i=1; i<=3; i++) {
          const status = await readContract.getStatusPemulihan(i)
          if(status[0] !== "0x0000000000000000000000000000000000000000") tempPemulihan[i] = { dompet: status[0], count: Number(status[1]) }
          else tempPemulihan[i] = null
        }
        setStatusPemulihan(tempPemulihan)

        try {
          const resWA = await fetch(`http://127.0.0.1:8000/api/v1/pengurus/wa/${role}`);
          if (resWA.ok) {
            const dataWA = await resWA.json();
            setIsWaRegistered(dataWA.terdaftar);
            if (dataWA.terdaftar && !nomorWA) setNomorWA(dataWA.no_wa);
          } else setIsWaRegistered(false); 
        } catch (e) { setIsWaRegistered(false); }
      }
    } catch (error) { console.error("Failed to fetch blockchain data:", error) }
  }

  useEffect(() => { fetchDataBlockchain() }, [viewMode, walletAddress])

  async function simpanNomorWA(e) {
    e.preventDefault()
    if (!nomorWA) return GlassAlert.fire('Hold on!', 'WhatsApp number cannot be empty!', 'warning')
    try {
      setLoading(true)
      const response = await fetch("http://127.0.0.1:8000/api/v1/pengurus/wa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dompet: walletAddress.toLowerCase(), jabatan: role, no_wa: nomorWA }) })
      if (response.ok) { 
        GlassAlert.fire('Success!', 'WhatsApp number successfully registered!', 'success'); 
        setIsWaRegistered(true); 
      } 
      else GlassAlert.fire('Error!', 'Failed to register WhatsApp number.', 'error')
    } catch (error) { GlassAlert.fire('Connection Error!', 'Failed to connect to Python Server. Ensure the server is running!', 'error') } finally { setLoading(false) }
  }

  // 🔥 INI DIA FUNGSI SETOR KAS YANG UDAH DI-UPGRADE PAKAI ANIMASI
  async function setorKasWeb3(e) {
    e.preventDefault(); 
    if (!namaPenyumbang || !keteranganIuran || !nominalIuran) return GlassAlert.fire('Missing Details!', 'Please fill in all deposit form fields!', 'warning')
    try {
      setLoading(true); const provider = new ethers.BrowserProvider(window.ethereum); const signer = await provider.getSigner();
      const tx = await new ethers.Contract(CONTRACT_ADDRESS, kasOrganisasiABI.abi, signer).setorKas(namaPenyumbang, keteranganIuran, { value: ethers.parseEther(nominalIuran) })
      await tx.wait(); 
      setNamaPenyumbang(""); setKeteranganIuran(""); setNominalIuran(""); fetchDataBlockchain(); 
      GlassAlert.fire('Transaction Confirmed!', 'Funds have been successfully recorded on the Blockchain.', 'success')
    } catch (error) { GlassAlert.fire('Transaction Failed!', 'Failed to deposit funds. Check your wallet balance or network connection.', 'error') } finally { setLoading(false) }
  }

  async function ajukanDanaWeb3(e) {
    e.preventDefault(); 
    if (!judul || !rincianSingkat || !nominal || !tujuan) return GlassAlert.fire('Missing Details!', 'Please fill in all proposal text fields (File is optional)!', 'warning'); 
    if (!ethers.isAddress(tujuan)) return GlassAlert.fire('Invalid Address!', 'The destination wallet address is invalid.', 'error'); 
    if (parseFloat(nominal) > parseFloat(saldoBrankas)) {
      return GlassAlert.fire('Insufficient Funds!', `Current Treasury Balance is only ${saldoBrankas} ETH. Cannot withdraw ${nominal} ETH!`, 'error');
    }

    try {
      setLoading(true); let bawaBerkas = false; 
      if (fileProposal) {
        const formData = new FormData(); formData.append("file", fileProposal); formData.append("deskripsi", judul);
        try { 
          const response = await fetch("http://127.0.0.1:8000/api/v1/proposal/hybrid", { method: "POST", body: formData });
          if (!response.ok) throw new Error("Failed");
          GlassToast.fire({ icon: 'info', title: 'Document secured in Web2! Proceeding to Web3...' });
          bawaBerkas = true; 
        } catch (err) { GlassToast.fire({ icon: 'warning', title: 'Web2 Error! Proceeding without file...' }); }
      }

      const provider = new ethers.BrowserProvider(window.ethereum); const signer = await provider.getSigner();
      const tx = await new ethers.Contract(CONTRACT_ADDRESS, kasOrganisasiABI.abi, signer).ajukanDana(judul, rincianSingkat, ethers.parseEther(nominal), tujuan, bawaBerkas)
      await tx.wait();
      
      GlassAlert.fire('Proposal Submitted!', 'Fund Proposal Draft has been officially added to the Multi-Sig Queue!', 'success');

      try { await fetch("http://127.0.0.1:8000/api/v1/notif/pengajuan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ judul, nominal }) }); } catch (err) {}
      setJudul(""); setRincianSingkat(""); setNominal(""); setTujuan(""); setFileProposal(null); fetchDataBlockchain(); 
    } catch (error) { GlassAlert.fire('Transaction Failed!', 'Failed to submit proposal. Ensure your wallet balance is sufficient for Gas Fees.', 'error'); } finally { setLoading(false) }
  }

  async function setujuiPencairanWeb3(idTarget) {
    try {
      const pengajuanTarget = antreanPengajuan.find(p => p.id === idTarget);
      
      if (pengajuanTarget && pengajuanTarget.approvalCount === "1" && role !== "ketua" && !pengajuanTarget.ketuaHasApproved) {
        return GlassAlert.fire('Access Denied!', 'First signature is not from the Chairman. The decisive signature MUST be from the CHAIRMAN. Vice Chairman and Treasurer cannot unilaterally withdraw funds!', 'error');
      }
      
      setLoading(true); const provider = new ethers.BrowserProvider(window.ethereum); const signer = await provider.getSigner();
      const tx = await new ethers.Contract(CONTRACT_ADDRESS, kasOrganisasiABI.abi, signer).setujuiPencairan(idTarget); await tx.wait();
      
      GlassAlert.fire('Signature Attached!', 'Your cryptographic signature has been attached successfully. Transaction authorized.', 'success');

      if (pengajuanTarget && pengajuanTarget.approvalCount === "1") {
        try { await fetch("http://127.0.0.1:8000/api/v1/notif/cair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ judul: pengajuanTarget.judul }) }); } catch (err) {}
      }
      fetchDataBlockchain(); 
    } catch (error) { 
      if (error && error.message && error.message.includes("DITOLAK: TTD kedua WAJIB dari Ketua!")) {
        GlassAlert.fire('Contract Denied!', 'Decisive signature MUST be executed by the CHAIRMAN.', 'error');
      } else {
        GlassAlert.fire('Transaction Failed!', 'Failed to approve transaction. Ensure you have not signed this already.', 'error');
      }
    } finally { setLoading(false) }
  }

  async function eksekusiPemulihan() {
    if (!ethers.isAddress(dompetPemulihanBaru)) return GlassAlert.fire('Invalid Address!', 'Please enter a valid Ethereum wallet address.', 'warning')
    try {
      setLoading(true); const provider = new ethers.BrowserProvider(window.ethereum); const signer = await provider.getSigner();
      const tx = await new ethers.Contract(CONTRACT_ADDRESS, kasOrganisasiABI.abi, signer).pulihkanKunci(targetPemulihan, dompetPemulihanBaru); await tx.wait();
      fetchDataBlockchain(); setDompetPemulihanBaru(""); 
      GlassAlert.fire('Vote Recorded!', 'Your recovery vote has been successfully submitted to the blockchain.', 'success')
    } catch (error) { GlassAlert.fire('Vote Failed!', 'Ensure you are not voting for your own key or have already voted.', 'error'); } finally { setLoading(false) }
  }

  const handleLoginWeb2 = (e) => {
    e.preventDefault()
    if (username === "bendahara" && password === "ipnu123") { setRole("bendahara"); setIsLoggedIn(true); setViewMode("dashboard"); }
    else if (username === "ketua" && password === "ipnu123") { setRole("ketua"); setIsLoggedIn(true); setViewMode("dashboard"); }
    else if (username === "wakil" && password === "ipnu123") { setRole("wakil"); setIsLoggedIn(true); setViewMode("dashboard"); }
    else GlassAlert.fire('Login Failed', 'Incorrect Username or Cryptographic Password!', 'error')
  }

  async function connectWallet() {
    if (window.ethereum) {
      try { setWalletAddress((await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]) } catch (err) { }
    } else GlassAlert.fire('Wallet Not Found', 'MetaMask extension is not installed in your browser!', 'warning')
  }

  const formatWaktu = (timestamp) => (!timestamp || timestamp === 0) ? "-" : new Date(timestamp * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const filterByBulan = (timestamp) => {
    if (!timestamp || timestamp === 0) return false;
    const dateObj = new Date(timestamp * 1000);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` === filterBulan;
  };

  const pemasukanBulanIni = laporanPemasukan.filter(item => filterByBulan(item.waktu));
  const pengeluaranBulanIni = laporanPengeluaran.filter(item => filterByBulan(item.waktu));

  // 🔥 FUNGSI EXPORT YANG SUDAH DI-UPGRADE MENGGUNAKAN EXCELJS
  const handleExportExcel = async () => {
    if (pemasukanBulanIni.length === 0 && pengeluaranBulanIni.length === 0) {
      return GlassAlert.fire('No Data', 'No data available this month for export!', 'info');
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistem Kas IPNU';
      workbook.created = new Date();

      const incomeSheet = workbook.addWorksheet('Income Report');
      incomeSheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Transaction Time', key: 'waktu', width: 25 },
        { header: 'Sender Name', key: 'nama', width: 25 },
        { header: 'Memo/Description', key: 'memo', width: 35 },
        { header: 'Amount (ETH)', key: 'nominal', width: 15 }
      ];
      incomeSheet.getRow(1).font = { bold: true };
      incomeSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF60A5FA' } };
      
      pemasukanBulanIni.forEach((item, i) => {
        incomeSheet.addRow({ 
          no: i+1, 
          waktu: formatWaktu(item.waktu), 
          nama: item.nama, 
          memo: item.keterangan, 
          nominal: item.nominal 
        });
      });

      const expSheet = workbook.addWorksheet('Expenditure Report');
      expSheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Withdrawal Time', key: 'waktu', width: 25 },
        { header: 'Proposal Title', key: 'judul', width: 30 },
        { header: 'Proposal Details', key: 'rincian', width: 40 },
        { header: 'Target Wallet', key: 'tujuan', width: 45 },
        { header: 'Amount (ETH)', key: 'nominal', width: 15 }
      ];
      expSheet.getRow(1).font = { bold: true };
      expSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCA5A5' } };

      pengeluaranBulanIni.forEach((item, i) => {
        expSheet.addRow({ 
          no: i+1, 
          waktu: formatWaktu(item.waktu), 
          judul: item.judul, 
          rincian: item.rincian, 
          tujuan: item.tujuan, 
          nominal: item.nominal 
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Treasury_Report_${filterBulan}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      
      GlassToast.fire({ icon: 'success', title: 'Excel report downloaded!' });
    } catch (error) {
      console.error(error);
      GlassAlert.fire('Error', 'Failed to generate Excel file.', 'error');
    }
  }

  const dompetSesuai = !walletAddress || walletAddress.toLowerCase() === alamatResmi[role];
  const isFullyConnected = viewMode === "dashboard" && walletAddress && dompetSesuai && isWaRegistered;
  const sensorAlamat = (addr) => addr ? addr.substring(0, 6) + "..." + addr.substring(addr.length - 4) : "";

  const styles = {
    input: { width: '100%', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#FFFFFF', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box', outline: 'none', transition: 'all 0.3s', backdropFilter: 'blur(5px)', colorScheme: 'dark' },
    card: { backgroundColor: 'rgba(21, 26, 37, 0.4)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px' },
    tableHeader: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#60A5FA', fontSize: '13px', textTransform: 'uppercase', padding: '18px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    tableCell: { padding: '18px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', color: '#CBD5E1' }
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', color: '#E2E8F0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <BlockchainBackground />
      <style>
        {`
          .glass-window {
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            border-left: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.05);
            transition: max-width 0.8s cubic-bezier(0.25, 1, 0.3, 1), min-height 0.8s cubic-bezier(0.25, 1, 0.3, 1), padding 0.8s cubic-bezier(0.25, 1, 0.3, 1), margin-top 0.8s cubic-bezier(0.25, 1, 0.3, 1);
            margin: 0 auto;
            position: relative;
            z-index: 10;
            overflow: hidden;
            width: 100%;
          }
          
          .window-login { max-width: 420px; min-height: 480px; padding: 48px 32px; margin-top: 12vh; }
          .window-full { max-width: 1100px; min-height: 85vh; padding: 32px; margin-top: 4vh; }

          .header-morph { display: flex; transition: all 0.8s cubic-bezier(0.25, 1, 0.3, 1); }
          .header-login { flex-direction: column; align-items: center; justify-content: center; margin-bottom: 24px; }
          .header-full { flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }

          .content-fade-in { animation: morphFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes morphFade { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
          
          .btn-interactive { padding: 14px 28px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; }
          .btn-interactive:not(:disabled):hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
          .btn-interactive:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-outline { padding: 10px 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: transparent; cursor: pointer; transition: all 0.2s; color: #E2E8F0; }
          .btn-outline:hover { background: rgba(255,255,255,0.05); transform: translateY(-1px); }

          .cyber-grid { position: absolute; width: 200vw; height: 200vh; top: -50vh; left: -50vw; background-image: linear-gradient(rgba(59, 130, 246, 0.15) 2px, transparent 2px), linear-gradient(90deg, rgba(59, 130, 246, 0.15) 2px, transparent 2px); background-size: 60px 60px; transform: perspective(600px) rotateX(75deg) translateY(-100px) translateZ(-200px); animation: gridMove 15s linear infinite; }
          @keyframes gridMove { 0% { transform: perspective(600px) rotateX(75deg) translateY(0) translateZ(-200px); } 100% { transform: perspective(600px) rotateX(75deg) translateY(60px) translateZ(-200px); } }
          .orb { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.4; animation: floatOrb 12s infinite alternate; }
          .orb-1 { width: 50vw; height: 50vw; background: #3B82F6; top: -10vh; left: -10vw; }
          .orb-2 { width: 40vw; height: 40vw; background: #8B5CF6; bottom: -20vh; right: -10vw; animation-delay: -4s; }
          @keyframes floatOrb { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(80px, -50px) scale(1.2); } }
          
          input:focus, textarea:focus, select:focus { border-color: rgba(96,165,250,0.6) !important; background-color: rgba(0,0,0,0.5) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
          ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
          
          input[type="month"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.7; filter: invert(60%) sepia(100%) saturate(300%) hue-rotate(180deg) brightness(120%); transition: all 0.2s; }
          input[type="month"]::-webkit-calendar-picker-indicator:hover { opacity: 1; filter: invert(70%) sepia(100%) saturate(400%) hue-rotate(190deg) brightness(140%); transform: scale(1.1); }

          .file-drop-zone {
            display: block;
            position: relative;
            border: 2px dashed rgba(96, 165, 250, 0.4);
            border-radius: 10px;
            padding: 24px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            background: rgba(0,0,0,0.2);
            margin-bottom: 14px;
            backdrop-filter: blur(5px);
          }
          .file-drop-zone:hover { border-color: #60A5FA; background: rgba(59, 130, 246, 0.1); box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.1); }
          .file-icon-wrapper { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
          .file-icon-success { transform: scale(1.1) rotate(360deg); }

          .btn-remove-file {
            position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%;
            background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #F87171;
            display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); z-index: 5;
          }
          .btn-remove-file:hover { background: rgba(239, 68, 68, 0.2); color: #FFF; transform: scale(1.15); box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); border-color: rgba(239, 68, 68, 0.6); }
          .btn-remove-file:active { transform: scale(0.9); }

          /* 🔥 KUSTOMISASI CSS SWEETALERT BIAR NYATU SAMA TEMA GLASSMORPHISM */
          .swal-glass-popup {
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 20px !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
          }
          .swal-glass-title { font-family: 'Inter', sans-serif !important; font-weight: 700 !important; }
          .swal-glass-btn { border-radius: 10px !important; font-weight: 600 !important; letter-spacing: 0.5px !important; padding: 12px 28px !important; }
        `}
      </style>

      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'center' }}>
        <div className={`glass-window ${viewMode === 'login' ? 'window-login' : 'window-full'}`}>
          
          <div className={`header-morph ${viewMode === 'login' ? 'header-login' : 'header-full'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: viewMode === 'login' ? '0' : '16px', flexDirection: viewMode === 'login' ? 'column' : 'row' }}>
              <div style={{ width: viewMode === 'login' ? '64px' : '36px', transition: 'all 0.8s cubic-bezier(0.25, 1, 0.3, 1)', marginBottom: viewMode === 'login' ? '24px' : '0', filter: 'drop-shadow(0 0 12px rgba(96,165,250,0.6))' }}>
                <svg viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#60A5FA" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/><path fill="#3B82F6" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601L256 236.587z"/><path fill="#1E3A8A" d="M127.961 287.958l127.96-75.637-127.96-58.162z"/>
                </svg>
              </div>
              <div style={{ textAlign: viewMode === 'login' ? 'center' : 'left' }}>
                <h2 style={{ margin: 0, fontSize: viewMode === 'login' ? '28px' : '22px', fontWeight: '700', color: '#FFFFFF', transition: 'all 0.8s', letterSpacing: '1px' }}>
                  {viewMode === 'login' ? 'AUTHENTICATION' : 'DApp Ledger'}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: viewMode === 'login' ? '14px' : '13px', color: '#94A3B8', transition: 'all 0.8s' }}>
                  {viewMode === 'login' ? 'Threshold Multi-Sig Access' : 'IPNU-IPPNU Treasury Transparency System'}
                </p>
              </div>
            </div>

            {viewMode !== 'login' && (
              <div className="content-fade-in" style={{ animationDelay: '0.3s' }}>
                {viewMode === "publik" ? (
                  <button className="btn-outline" onClick={() => { setViewMode("login"); setActiveTab("dashboard"); }}>
                    <span style={{ marginRight: '8px' }}>🔒</span> Admin Login
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>Logged in as <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{role.toUpperCase()}</span></span>
                    <button className="btn-outline" onClick={handleLogout} style={{ color: '#FCA5A5', borderColor: 'rgba(248, 113, 113, 0.3)', backgroundColor: 'rgba(248, 113, 113, 0.1)' }}>Disconnect</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="content-fade-in" key={`${viewMode}-${activeTab}-${walletAddress}`}>
            
            {viewMode === 'login' && (
              <form onSubmit={handleLoginWeb2} style={{ marginTop: '16px' }}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <input type="text" placeholder="Admin ID (ketua / wakil / bendahara)" value={username} onChange={e => setUsername(e.target.value)} style={{ ...styles.input, marginBottom: 0, paddingLeft: '44px', background: 'rgba(0,0,0,0.4)' }} />
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>👤</span>
                </div>
                <div style={{ position: 'relative', marginBottom: '32px' }}>
                  <input type="password" placeholder="Cryptographic Password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...styles.input, marginBottom: 0, paddingLeft: '44px', background: 'rgba(0,0,0,0.4)' }} />
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔑</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', bottom: 0, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', filter: 'blur(12px)', zIndex: 0, borderRadius: '10px', opacity: 0.8 }}></div>
                  <button type="submit" className="btn-interactive" style={{ width: '100%', position: 'relative', zIndex: 1, textTransform: 'uppercase', background: 'linear-gradient(135deg, #2563EB, #6D28D9)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}>
                    Initialize Access
                  </button>
                </div>
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <button type="button" className="btn-outline" onClick={() => { setViewMode("publik"); setActiveTab("laporan"); }} style={{ border: 'none', color: '#64748B' }}>
                    ← Back to Explorer
                  </button>
                </div>
              </form>
            )}

            {viewMode !== 'login' && (
              <div>
                <div style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.2)' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>Treasury Balance</p>
                    
                    <h2 translate="no" className="notranslate" style={{ margin: 0, fontSize: '48px', fontWeight: '700', letterSpacing: '-1px', color: '#FFFFFF' }}>
                      {saldoBrankas} <span style={{ fontSize: '20px', color: '#60A5FA', fontWeight: '500' }}>ETH</span>
                    </h2>
                    <p translate="no" className="notranslate" style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#34D399', fontWeight: '500' }}>
                      ≈ {hitungSaldoRupiah()}
                    </p>
                  </div>
                  {viewMode !== "publik" && walletAddress && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 20px', borderRadius: '12px' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#94A3B8' }}>Connected Wallet</p>
                      <p style={{ margin: '0 0 8px 0', fontFamily: 'monospace', fontSize: '14px', color: '#E2E8F0' }}>{sensorAlamat(walletAddress)}</p>
                      {isWaRegistered && dompetSesuai && (
                        <button 
                          onClick={() => setIsWaRegistered(false)} 
                          style={{ fontSize: '11px', background: 'transparent', border: '1px solid rgba(96, 165, 250, 0.4)', color: '#60A5FA', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { e.target.style.background = 'rgba(96, 165, 250, 0.1)'; e.target.style.borderColor = '#60A5FA'; }}
                          onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(96, 165, 250, 0.4)'; }}
                        >
                          ⚙️ Edit WA Number
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {viewMode === "dashboard" && !walletAddress && (
                  <div style={{ ...styles.card, textAlign: 'center', maxWidth: '420px', margin: '40px auto' }}>
                    <h3 style={{ color: '#FFFFFF', margin: '0 0 12px 0', fontWeight: '500' }}>Connect Wallet</h3>
                    <p style={{ color: '#94A3B8', marginBottom: '24px', fontSize: '14px' }}>System requires Ethereum wallet authorization.</p>
                    <button className="btn-interactive" onClick={connectWallet} style={{ width: '100%', backgroundColor: '#F5841F', color: '#fff' }}>Connect MetaMask</button>
                  </div>
                )}

                {viewMode === "dashboard" && walletAddress && !dompetSesuai && (
                   <div style={{ ...styles.card, textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                     <h3 style={{ color: '#F87171', margin: '0 0 12px 0' }}>Access Denied</h3>
                     <p style={{ color: '#FCA5A5', fontSize: '14px' }}>Your wallet does not have access rights as {role.toUpperCase()}.</p>
                   </div>
                )}
                
                {viewMode === "dashboard" && walletAddress && dompetSesuai && !isWaRegistered && (
                  <div style={{ ...styles.card, textAlign: 'center', maxWidth: '420px', margin: '40px auto' }}>
                    <h3 style={{ marginTop: 0, color: '#FFFFFF' }}>WhatsApp Notifications</h3>
                    <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '20px' }}>Enter an active WA number to receive Smart Contract alerts.</p>
                    <form onSubmit={simpanNomorWA}>
                      <input type="text" placeholder="Example: 081234..." value={nomorWA} onChange={e => setNomorWA(e.target.value)} required style={styles.input} />
                      <button className="btn-interactive" type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#3B82F6', color: '#FFF' }}>{loading ? "PROCESSING..." : "SAVE NUMBER"}</button>
                    </form>
                  </div>
                )}

                {isFullyConnected && (
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                    <button className="btn-interactive" onClick={() => setActiveTab('dashboard')} style={{ flex: 1, backgroundColor: activeTab === 'dashboard' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: activeTab === 'dashboard' ? '#60A5FA' : '#94A3B8', border: activeTab === 'dashboard' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.1)' }}>CONTROL PANEL</button>
                    <button className="btn-interactive" onClick={() => setActiveTab('laporan')} style={{ flex: 1, backgroundColor: activeTab === 'laporan' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: activeTab === 'laporan' ? '#60A5FA' : '#94A3B8', border: activeTab === 'laporan' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.1)' }}>BLOCK EXPLORER</button>
                  </div>
                )}

                {isFullyConnected && activeTab === 'dashboard' && (
                  <div className="content-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {role === "bendahara" && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        <div style={styles.card}>
                          <h4 style={{ margin: '0 0 20px 0', color: '#E2E8F0' }}>ADD INCOME</h4>
                          <form onSubmit={setorKasWeb3}>
                            <input type="text" placeholder="Sender Name" value={namaPenyumbang} onChange={e => setNamaPenyumbang(e.target.value)} style={styles.input} />
                            <input type="text" placeholder="Memo / Description" value={keteranganIuran} onChange={e => setKeteranganIuran(e.target.value)} style={styles.input} />
                            <input type="number" step="0.0001" placeholder="Amount (ETH)" value={nominalIuran} onChange={e => setNominalIuran(e.target.value)} style={styles.input} />
                            <button className="btn-interactive" disabled={loading} style={{ width: '100%', backgroundColor: '#3B82F6', color: '#FFF' }}>{loading ? "PROCESSING..." : "RECORD TO BLOCKCHAIN"}</button>
                          </form>
                        </div>
                        <div style={styles.card}>
                          <h4 style={{ margin: '0 0 20px 0', color: '#E2E8F0' }}>NEW FUND PROPOSAL</h4>
                          <form onSubmit={ajukanDanaWeb3}>
                            <input type="text" placeholder="Purpose Title" value={judul} onChange={e => setJudul(e.target.value)} style={styles.input} />
                            
                            <textarea 
                              placeholder="Brief Details / Description (Required)" 
                              value={rincianSingkat} 
                              onChange={e => setRincianSingkat(e.target.value)} 
                              style={{ ...styles.input, resize: 'vertical', minHeight: '80px' }} 
                            />

                            <input type="number" step="0.0001" placeholder="Requested Amount (ETH)" value={nominal} onChange={e => setNominal(e.target.value)} style={styles.input} />
                            <input type="text" placeholder="Destination Address (0x...)" value={tujuan} onChange={e => setTujuan(e.target.value)} style={styles.input} />
                            
                            <input type="file" id="file-proposal-upload" onChange={e => setFileProposal(e.target.files[0])} style={{ display: 'none' }} />
                            <label htmlFor="file-proposal-upload" className="file-drop-zone">
                              
                              {fileProposal && (
                                <button 
                                  className="btn-remove-file"
                                  onClick={(e) => {
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    setFileProposal(null);
                                    document.getElementById('file-proposal-upload').value = ""; 
                                  }}
                                  title="Remove File"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              )}

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div className={`file-icon-wrapper ${fileProposal ? 'file-icon-success' : ''}`}>
                                  {fileProposal ? (
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))' }}>
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                      <polyline points="14 2 14 8 20 8"></polyline>
                                      <path d="M9 15l2 2 4-4"></path>
                                    </svg>
                                  ) : (
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="17 8 12 3 7 8"></polyline>
                                      <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                  )}
                                </div>
                                <span style={{ fontSize: '13px', color: fileProposal ? '#34D399' : '#94A3B8', fontWeight: '500', transition: 'color 0.3s', padding: '0 16px' }}>
                                  {fileProposal ? fileProposal.name : 'Select or Drop Document File (Optional)'}
                                </span>
                              </div>
                            </label>

                            <button className="btn-interactive" disabled={loading} style={{ width: '100%', backgroundColor: '#3B82F6', color: '#FFF' }}>{loading ? "CREATING DRAFT..." : "SEND TO QUEUE"}</button>
                          </form>
                        </div>
                      </div>
                    )}
                    <div style={{ ...styles.card, border: '1px solid rgba(245, 158, 11, 0.2)', backgroundColor: 'rgba(245, 158, 11, 0.03)' }}>
                      <h4 style={{ margin: '0 0 24px 0', color: '#FCD34D' }}>PENDING MULTI-SIG QUEUE</h4>
                      {antreanPengajuan.length === 0 ? <div style={{ color: '#94A3B8' }}>No pending proposals.</div> : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                          {antreanPengajuan.map((prop) => (
                            <div key={prop.id} style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
                              <h4 style={{ color: '#FFFFFF', margin: '0 0 16px 0' }}>{prop.judul} <span style={{ float: 'right', fontSize: '12px', color: '#93C5FD' }}>SIG: {prop.approvalCount}/2</span></h4>
                              
                              <div style={{ marginBottom: '24px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                                  <span style={{ color: '#64748B' }}>Amount:</span>
                                  <span translate="no" className="notranslate" style={{ fontWeight: '600', color: '#FCA5A5' }}>{prop.nominal} ETH</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                                  <span style={{ color: '#64748B' }}>To:</span>
                                  <span style={{ fontFamily: 'monospace', color: '#93C5FD' }}>{sensorAlamat(prop.tujuan)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: '#64748B' }}>Document:</span>
                                  {prop.adaBerkas ? <a href={`http://127.0.0.1:8000/api/v1/dokumen/${prop.judul}`} target="_blank" rel="noreferrer" style={{ color: '#60A5FA', textDecoration: 'none' }}>Available</a> : <span style={{ color: '#475569' }}>None</span>}
                                </div>
                              </div>

                              <button className="btn-interactive" onClick={() => setujuiPencairanWeb3(prop.id)} disabled={loading || proposalSudahDiTTD.includes(prop.id)} style={{ width: '100%', backgroundColor: proposalSudahDiTTD.includes(prop.id) ? 'rgba(255,255,255,0.05)' : '#2563EB', color: proposalSudahDiTTD.includes(prop.id) ? '#64748B' : 'white' }}>
                                {loading ? "PROCESSING..." : proposalSudahDiTTD.includes(prop.id) ? "APPROVED" : "AUTHORIZE TRANSACTION"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ ...styles.card, border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#FCA5A5', fontSize: '15px', fontWeight: '500', textTransform: 'uppercase' }}>Emergency Override</h4>
                      <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#F87171', opacity: 0.8, lineHeight: '1.5' }}>Initiate wallet recovery for a compromised admin account. Requires 2/3 active board consensus.</p>
                      
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <select value={targetPemulihan} onChange={e => setTargetPemulihan(e.target.value)} style={{ ...styles.input, flex: 1, minWidth: '150px', marginBottom: 0 }}>
                          <option value="1">Key 1 (Chairman)</option>
                          <option value="2">Key 2 (Vice Chairman)</option>
                          <option value="3">Key 3 (Treasurer)</option>
                        </select>
                        <input type="text" placeholder="New Wallet (0x...)" value={dompetPemulihanBaru} onChange={e => setDompetPemulihanBaru(e.target.value)} style={{ ...styles.input, flex: 2, minWidth: '200px', marginBottom: 0 }} />
                        <button className="btn-interactive" onClick={eksekusiPemulihan} disabled={loading} style={{ backgroundColor: '#EF4444', color: '#FFF', flex: '0 1 auto', fontSize: '13px' }}>
                          {loading ? "PROCESSING..." : "PROPOSE RESET"}
                        </button>
                      </div>

                      {[1, 2, 3].map(jab => statusPemulihan[jab] && (
                        <div key={jab} style={{ marginTop: '20px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', fontSize: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#94A3B8' }}>Active Recovery Process:</span>
                            <span style={{ color: '#FCA5A5', fontWeight: '500' }}>Key {NAMA_JABATAN[jab]}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#64748B' }}>Target New Wallet:</span>
                            <span style={{ fontFamily: 'monospace', color: '#E2E8F0' }}>{statusPemulihan[jab].dompet}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Current Consensus:</span>
                            <span style={{ color: '#F87171', fontWeight: '600' }}>{statusPemulihan[jab].count} / 2</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(viewMode === "publik" || (isFullyConnected && activeTab === 'laporan')) && (
                  <div className="content-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
                      <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} style={{ ...styles.input, marginBottom: 0, width: 'auto', padding: '10px' }} />
                      <button className="btn-outline" onClick={handleExportExcel} style={{ color: '#93C5FD', borderColor: '#60A5FA' }}>DOWNLOAD CSV</button>
                    </div>

                    <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><h4 style={{ margin: 0, color: '#60A5FA' }}>INCOMING TRANSFERS</h4></div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Timestamp</th>
                            <th style={styles.tableHeader}>Sender</th>
                            <th style={styles.tableHeader}>Memo</th>
                            <th style={styles.tableHeader}>Amount (ETH)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pemasukanBulanIni.length === 0 ? (
                            <tr><td colSpan="4" style={{...styles.tableCell, textAlign: 'center', color: '#64748B'}}>No incoming data.</td></tr>
                          ) : (
                            pemasukanBulanIni.map((item, idx) => (
                              <tr key={idx}>
                                <td style={styles.tableCell}>{formatWaktu(item.waktu)}</td>
                                <td style={styles.tableCell}>{item.nama}</td>
                                <td style={styles.tableCell}>{item.keterangan}</td>
                                <td translate="no" className="notranslate" style={{ ...styles.tableCell, color: '#34D399' }}>+ {item.nominal}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><h4 style={{ margin: 0, color: '#FCA5A5' }}>OUTGOING TRANSFERS</h4></div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Timestamp</th>
                            <th style={styles.tableHeader}>Contract/Memo</th>
                            <th style={styles.tableHeader}>Destination</th>
                            <th style={styles.tableHeader}>Amount (ETH)</th>
                            <th style={styles.tableHeader}>Proof</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pengeluaranBulanIni.length === 0 ? (
                            <tr><td colSpan="5" style={{...styles.tableCell, textAlign: 'center', color: '#64748B'}}>No outgoing data.</td></tr>
                          ) : (
                            pengeluaranBulanIni.map((item, idx) => (
                              <tr key={idx}>
                                <td style={styles.tableCell}>{formatWaktu(item.waktu)}</td>
                                
                                <td style={{ ...styles.tableCell, maxWidth: '250px' }}>
                                  <strong style={{ display: 'block', marginBottom: '4px' }}>{item.judul}</strong>
                                  <div style={{ fontSize: '12px', color: '#94A3B8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }} title={item.rincian}>
                                    {item.rincian}
                                  </div>
                                </td>
                                
                                <td style={{ ...styles.tableCell, fontFamily: 'monospace' }}>{sensorAlamat(item.tujuan)}</td>
                                <td translate="no" className="notranslate" style={{ ...styles.tableCell, color: '#F87171' }}>- {item.nominal}</td>
                                <td style={styles.tableCell}>
                                  {item.adaBerkas ? <a href={`http://127.0.0.1:8000/api/v1/dokumen/${item.judul}`} target="_blank" rel="noreferrer" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 'bold' }}>📄 OPEN</a> : <span style={{color: '#64748B'}}>-</span>}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}
                
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  )
}

export default App