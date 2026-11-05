// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../lib/forge-std/src/Test.sol";
import "../src/KasOrganisasi.sol";

contract KasOrganisasiTest is Test {
    KasOrganisasi public kas;

    // Membuat akun palsu untuk simulasi
    address public ketua = address(0x1);
    address public wakil = address(0x2);
    address public bendahara = address(0x3);
    address public tujuanCair = address(0x4);
    address public hacker = address(0x5);

    function setUp() public {
        // 1. Deploy kontrak seolah-olah kita di mainnet
        kas = new KasOrganisasi(ketua, wakil, bendahara);
        
        // 2. Suntikkan dana fiktif 10 Ether ke dalam brankas kas (Simulasi Jalur A)
        vm.deal(address(kas), 10 ether);
    }

    // =========================================================
    // SKENARIO 1: Pencairan SUKSES (Ketua + Bendahara Setuju)
    // =========================================================
    function test_PencairanSukses_AdaKetua() public {
        // Bendahara mengajukan proposal 1 Ether
        vm.prank(bendahara);
        kas.ajukanProposal("Biaya Rapat Bulanan", 1 ether, payable(tujuanCair));

        // Bendahara memberikan tanda tangan persetujuan
        vm.prank(bendahara);
        kas.setujuiProposal(1);

        // Ketua memberikan tanda tangan persetujuan (Mandatory Signer)
        vm.prank(ketua);
        kas.setujuiProposal(1);

        // Validasi: Dana 1 Ether harus berhasil masuk ke dompet tujuan
        assertEq(tujuanCair.balance, 1 ether);
    }

    // =========================================================
    // SKENARIO 2: Pencairan GAGAL (Koalisi Wakil + Bendahara Tanpa Ketua)
    // =========================================================
    function test_PencairanGagal_TanpaKetua() public {
        vm.prank(bendahara);
        kas.ajukanProposal("Biaya Gelap", 1 ether, payable(tujuanCair));

        // Bendahara setuju
        vm.prank(bendahara);
        kas.setujuiProposal(1);

        // Wakil Ketua setuju
        vm.prank(wakil);
        kas.setujuiProposal(1);

        // Validasi: Walaupun sudah 2 tanda tangan, karena KETUA tidak ikut, 
        // uang HARUS tetap 0 di dompet tujuan (Gagal Cair)
        assertEq(tujuanCair.balance, 0 ether);
    }

    // =========================================================
    // SKENARIO 3: Peretasan GAGAL (Hacker Mencoba Mengajukan Proposal)
    // =========================================================
    function test_HackerGagal_AksesDitolak() public {
        // Hacker mencoba memanggil fungsi ajukanProposal
        vm.prank(hacker);
        vm.expectRevert("Akses ditolak: Bukan pengurus sah");
        kas.ajukanProposal("Masukin ke dompet hacker", 10 ether, payable(hacker));
    }

    // =========================================================
    // SKENARIO 4: Pemulihan Kunci Ketua SUKSES (Konsensus Wakil + Bendahara)
    // =========================================================
    function test_PemulihanKunci_Darurat() public {
        address ketuaBaru = address(0x99);

        // Wakil Ketua mengajukan pergantian kunci
        vm.prank(wakil);
        kas.pulihkanKunciKetua(ketuaBaru);

        // Bendahara menyetujui pergantian kunci yang sama
        vm.prank(bendahara);
        kas.pulihkanKunciKetua(ketuaBaru);

        // Validasi: Alamat ketua di dalam sistem harus sudah berubah menjadi ketuaBaru
        assertEq(kas.ketua(), ketuaBaru);
    }
}