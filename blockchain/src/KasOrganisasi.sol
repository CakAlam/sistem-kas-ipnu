// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KasOrganisasi {
    address public ketua;
    address public wakil;
    address public bendahara;

    struct Pengajuan {
        string judul;
        string rincianSingkat;
        uint256 nominal;
        address payable tujuan;
        bool executed;
        uint256 approvalCount;
        uint256 waktuCair;
        bool adaBerkas;
    }

    mapping(uint256 => Pengajuan) public daftarPengajuan;
    mapping(uint256 => mapping(address => bool)) public hasApproved;
    uint256 public pengajuanCount;

    struct Pemasukan {
        string namaPenyumbang;
        string keterangan;
        uint256 nominal;
        uint256 waktuSetor;
    }
    Pemasukan[] public riwayatPemasukan;

    constructor(address _ketua, address _wakil, address _bendahara) {
        ketua = _ketua;
        wakil = _wakil;
        bendahara = _bendahara;
    }

    modifier onlyPengurus() {
        require(msg.sender == ketua || msg.sender == wakil || msg.sender == bendahara, "Bukan Pengurus Inti");
        _;
    }

    // --- FUNGSI PEMASUKAN ---
    function setorKas(string memory _nama, string memory _keterangan) public payable {
        require(msg.value > 0, "Nominal harus > 0");
        riwayatPemasukan.push(Pemasukan({
            namaPenyumbang: _nama,
            keterangan: _keterangan,
            nominal: msg.value,
            waktuSetor: block.timestamp
        }));
    }

    // --- FUNGSI PENGAJUAN (BENDAHARA HANYA PEMBUAT DRAF) ---
    function ajukanDana(string memory _judul, string memory _rincianSingkat, uint256 _nominal, address payable _tujuan, bool _adaBerkas) public {
        require(msg.sender == bendahara, "Hanya bendahara yang bisa membuat draf");
        
        Pengajuan storage p = daftarPengajuan[pengajuanCount];
        p.judul = _judul;
        p.rincianSingkat = _rincianSingkat;
        p.nominal = _nominal;
        p.tujuan = _tujuan;
        p.executed = false;
        p.approvalCount = 0;
        p.waktuCair = 0;
        p.adaBerkas = _adaBerkas;
        
        pengajuanCount++;
    }

    // --- FUNGSI VOTING (EKSEKUSI ALGORITMA 2-OF-3) ---
    function setujuiPencairan(uint256 _id) public onlyPengurus {
        Pengajuan storage p = daftarPengajuan[_id];
        require(!p.executed, "Dana sudah cair");
        require(!hasApproved[_id][msg.sender], "Anda sudah memberikan TTD");

        // 🔥 UX GUARD: PUKUL MUNDUR WAKIL (SATPAM ANTI-BINGUNG)
        // Jika sudah ada 1 TTD (dari Bendahara) dan Ketua belum TTD, maka TTD selanjutnya HANYA BOLEH Ketua!
        if (p.approvalCount == 1 && !hasApproved[_id][ketua]) {
            require(msg.sender == ketua, "DITOLAK: TTD kedua WAJIB dari Ketua!");
        }

        hasApproved[_id][msg.sender] = true;
        p.approvalCount++;

        // LOGIKA SKRIPSI: Minimal 2 TTD TERKUMPUL + WAJIB ADA TTD KETUA
        if (p.approvalCount >= 2 && hasApproved[_id][ketua] == true) {
            p.executed = true;
            p.waktuCair = block.timestamp;
            p.tujuan.transfer(p.nominal);
        }
    }

    function getJumlahPemasukan() public view returns (uint256) {
        return riwayatPemasukan.length;
    }

    // ==========================================
    // FITUR DARURAT: PEMULIHAN KUNCI HILANG
    // 1 = Ketua, 2 = Wakil, 3 = Bendahara
    // ==========================================
    mapping(uint8 => address) public usulanDompetBaru;
    mapping(uint8 => mapping(address => bool)) public setujuPemulihan;
    mapping(uint8 => uint8) public pemulihanApprovalCount;

    function pulihkanKunci(uint8 _jabatanTarget, address _dompetBaru) public onlyPengurus {
        require(_dompetBaru != address(0), "Alamat tidak valid");
        require(_jabatanTarget >= 1 && _jabatanTarget <= 3, "Kode jabatan tidak valid");

        // Validasi: Orang yang kuncinya diklaim "hilang" tidak boleh ikut nge-vote dirinya sendiri
        if (_jabatanTarget == 1) require(msg.sender != ketua, "Ketua tidak bisa memvoting dirinya sendiri");
        if (_jabatanTarget == 2) require(msg.sender != wakil, "Wakil tidak bisa memvoting dirinya sendiri");
        if (_jabatanTarget == 3) require(msg.sender != bendahara, "Bendahara tidak bisa memvoting dirinya sendiri");

        // Reset usulan jika ada alamat baru yang dimasukkan
        if (usulanDompetBaru[_jabatanTarget] != _dompetBaru) {
            usulanDompetBaru[_jabatanTarget] = _dompetBaru;
            pemulihanApprovalCount[_jabatanTarget] = 0;
            setujuPemulihan[_jabatanTarget][ketua] = false;
            setujuPemulihan[_jabatanTarget][wakil] = false;
            setujuPemulihan[_jabatanTarget][bendahara] = false;
        }

        require(!setujuPemulihan[_jabatanTarget][msg.sender], "Anda sudah memvoting usulan ini");
        
        setujuPemulihan[_jabatanTarget][msg.sender] = true;
        pemulihanApprovalCount[_jabatanTarget]++;

        // Konsensus: Jika 2 sisa pengurus sepakat, Kunci diganti!
        if (pemulihanApprovalCount[_jabatanTarget] >= 2) {
            if (_jabatanTarget == 1) ketua = _dompetBaru;
            else if (_jabatanTarget == 2) wakil = _dompetBaru;
            else if (_jabatanTarget == 3) bendahara = _dompetBaru;

            // Reset state
            usulanDompetBaru[_jabatanTarget] = address(0);
            pemulihanApprovalCount[_jabatanTarget] = 0;
        }
    }

    function getStatusPemulihan(uint8 _jabatanTarget) public view returns (address, uint8) {
        return (usulanDompetBaru[_jabatanTarget], pemulihanApprovalCount[_jabatanTarget]);
    }
}