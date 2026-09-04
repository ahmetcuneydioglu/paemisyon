import Foundation
import Vision
import AppKit

// macOS Vision ile Türkçe OCR (yerel, ücretsiz, token yakmaz).
//
// Kitapçık iki sütuna dizili. Vision her metin parçasını ayrı gözlem olarak
// döndürüyor; iki yana yaslı satırlarda tek satır birden çok gözleme bölünüyor.
// Bu yüzden: önce sütuna ayır, sonra y yakınlığına göre SATIR kümele, satır
// içinde x'e göre sırala. Aksi hâlde kelimeler satır başına kaçıyor.
struct Parca { let metin: String; let x: CGFloat; let y: CGFloat; let h: CGFloat }

func satirlaraDiz(_ parcalar: [Parca]) -> [String] {
    guard !parcalar.isEmpty else { return [] }
    let ortalamaYukseklik = parcalar.map { $0.h }.reduce(0, +) / CGFloat(parcalar.count)
    let tolerans = ortalamaYukseklik * 0.6
    var kalan = parcalar.sorted { $0.y > $1.y }
    var satirlar: [String] = []
    while !kalan.isEmpty {
        let ilk = kalan.removeFirst()
        var kume = [ilk]
        kalan.removeAll { p in
            if abs(p.y - ilk.y) <= tolerans { kume.append(p); return true }
            return false
        }
        satirlar.append(kume.sorted { $0.x < $1.x }.map { $0.metin }.joined(separator: " "))
    }
    return satirlar
}

let tekSutun = ProcessInfo.processInfo.environment["TEK_SUTUN"] == "1"
for path in CommandLine.arguments.dropFirst() {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["tr-TR"]
    req.usesLanguageCorrection = true
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    let parcalar: [Parca] = (req.results ?? []).compactMap { o in
        guard let t = o.topCandidates(1).first?.string else { return nil }
        return Parca(metin: t, x: o.boundingBox.minX, y: o.boundingBox.minY, h: o.boundingBox.height)
    }
    print("===== SAYFA \(URL(fileURLWithPath: path).deletingPathExtension().lastPathComponent) =====")
    if tekSutun {
        for s in satirlaraDiz(parcalar) { print(s) }
    } else {
        for s in satirlaraDiz(parcalar.filter { $0.x < 0.48 }) { print(s) }
        for s in satirlaraDiz(parcalar.filter { $0.x >= 0.48 }) { print(s) }
    }
}

// Derleme:  swiftc -O -o pdf-ocr pdf-ocr.swift
// Kullanım: ./pdf-ocr sayfa/*.png > cikti.txt
//           TEK_SUTUN=1 ./pdf-ocr anahtar.png   (tablo/tek sütun sayfalar)
