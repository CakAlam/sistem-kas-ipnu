// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../lib/forge-std/src/Script.sol";
import "../src/KasOrganisasi.sol";

contract DeployKas is Script {
    function run() external {
        // Mengambil private key deployer dari environment (bukan hardcode)
        // Default ini adalah kunci Anvil Akun 0, tapi bisa diganti via terminal
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        // Mengambil alamat pengurus dari environment variable.
        // Jika tidak ada di .env, fallback ke akun test Anvil untuk kemudahan testing lokal.
        address ketua = vm.envOr("ADDR_KETUA", address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8));
        address wakil = vm.envOr("ADDR_WAKIL", address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC));
        address bendahara = vm.envOr("ADDR_BENDAHARA", address(0x90F79bf6EB2c4f870365E785982E1f101E93b906));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy kontrak dengan parameter dinamis
        KasOrganisasi kas = new KasOrganisasi(ketua, wakil, bendahara);

        vm.stopBroadcast();

        // Print hasil
        console.log("-----------------------------------------");
        console.log("Kontrak KasOrganisasi Deployed: ", address(kas));
        console.log("Alamat Ketua       : ", ketua);
        console.log("Alamat Wakil       : ", wakil);
        console.log("Alamat Bendahara   : ", bendahara);
        console.log("-----------------------------------------");
    }
}