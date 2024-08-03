// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract FileSharing {

    struct FileShare {
        address sender;
        address receiver;
        string ipfsHash;
        bool isShared;
    }

    mapping(address => FileShare[]) private fileShares;

    // Dosya sahibinden gelen bir IPFS karmasını alan ve belirtilen kullanıcıya paylaşan fonksiyon
    function shareFile(address _receiver, string memory _ipfsHash) external {
        // msg.sender, fonksiyonu çağıran adresi temsil eder (dosya sahibi)
        // _receiver, dosyanın paylaşılacağı adresi temsil eder (dosyayı alan kullanıcı)
        // _ipfsHash, IPFS karmasını temsil eder

        // Dosya paylaşımını kaydetmek için yeni bir FileShare struct oluşturulur
        FileShare memory newShare = FileShare({
            sender: msg.sender,
            receiver: _receiver,
            ipfsHash: _ipfsHash,
            isShared: true

        });

        // FileShare struct'ı fileShares mapping'ine eklenir
        fileShares[_receiver].push(newShare);
        fileShares[msg.sender].push(newShare);
    }

    // Paylaşılan dosyaları görüntülemesine olanak tanıyan fonksiyon
    function getSharedFiles() external view returns (FileShare[] memory) {
        // Fonksiyon, tüm dosya paylaşımlarını içeren fileShares mapping'inden çağıran kullanıcının dosyalarını döndürür
        return fileShares[msg.sender];
    }
}