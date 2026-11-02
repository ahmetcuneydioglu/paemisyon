/**
 * Merkez konu kodu → PAEMİSYON konusu tohumu (Doc 55). Üretildiği yer: soru-merkezi data/import/taxonomy.json
 * (S2 paemisyonTopics) + 20261102-0224 anlık görüntüsündeki soru sayıları. hub_topic_map satırı ilk taksonomi
 * olayında bu tohumla açılır; sonrası elle (panel/SQL) düzenlenir. Birden çok PAEMİSYON konusuna düşen merkez
 * konusunda (Anayasa) en çok sorulu konu varsayılandır; madde aralığı satırları ELLE girilir (karar 2 Kas 2026).
 */
export interface HubTopicSeedEntry {
  topicId: string;
  topicName: string | null;
  alternatives: Array<{ topicId: string; name: string | null; questions: number }>;
}

export const HUB_TOPIC_SEED: Record<string, HubTopicSeedEntry> = {
  "anayasa-hukuku-2709": {
    "topicId": "716f57ed-9618-41e0-8079-74d264f33abc",
    "topicName": "T.C. Anayasası",
    "alternatives": [
      {
        "topicId": "fd9cde85-9b6f-46a4-a596-0605705aa098",
        "name": "Temel Kavramlar",
        "questions": 4
      },
      {
        "topicId": "9fe88aa6-2451-48fd-b02e-2fbbfbd262d8",
        "name": "Temel Hak ve Hürriyetler",
        "questions": 1
      },
      {
        "topicId": "66144598-212c-44de-9b16-6f33c60b093a",
        "name": "Yasama",
        "questions": 2
      },
      {
        "topicId": "c1176836-cfa4-429d-b758-c7a70967d038",
        "name": "Anayasa",
        "questions": 56
      }
    ]
  },
  "kolluk-mevzuati-7068": {
    "topicId": "a9e2a110-a63e-4cfa-91f2-25c187d0c3e6",
    "topicName": "7068 Sayılı Genel Kolluk Disiplin Hükümleri Kanunu",
    "alternatives": []
  },
  "ceza-hukuku-3713": {
    "topicId": "c345c19d-c850-4798-b194-d552edf39708",
    "topicName": "3713 Sayılı Terörle Mücadele Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-1774": {
    "topicId": "14c06c01-9386-40c3-b566-766f8f344bfc",
    "topicName": "1774 Sayılı Kimlik Bildirme Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-5395": {
    "topicId": "48443974-0207-4ac2-b51a-34ba2a7b8070",
    "topicName": "5395 Sayılı Çocuk Koruma Kanunu",
    "alternatives": []
  },
  "ceza-muhakemesi-adli-ve-onleme-aramalari-yonetmeligi-003fcf": {
    "topicId": "980956db-8563-41cc-b9f1-e409a5d4e283",
    "topicName": "Adli ve Önleme Aramaları Yönetmeliği",
    "alternatives": []
  },
  "idare-hukuku-genel": {
    "topicId": "b396a7c3-6f30-490e-9401-4be88e87a91b",
    "topicName": "İdare Hukuku",
    "alternatives": []
  },
  "ceza-hukuku-5237": {
    "topicId": "81500d64-b141-4d67-a1cc-f34f42b5869b",
    "topicName": "Türk Ceza Kanunu",
    "alternatives": []
  },
  "genel-kultur-protokol": {
    "topicId": "b37b5366-0ae9-4172-90ab-edee5db20b1f",
    "topicName": "Protokol Bilgisi",
    "alternatives": []
  },
  "kolluk-mevzuati-silah-bilgisi": {
    "topicId": "6f0d2a35-5fb5-4223-99ea-8d4ac367b873",
    "topicName": "Silah Bilgisi",
    "alternatives": []
  },
  "idare-hukuku-5302": {
    "topicId": "cc810ce5-feac-47bd-b4f9-9a9edf7c4672",
    "topicName": "5302 İl Özel İdaresi Kanunu",
    "alternatives": []
  },
  "idare-hukuku-5393": {
    "topicId": "28eaa9b8-d646-4d32-af33-618d8e1c7ea7",
    "topicName": "5393 Belediye Kanunu",
    "alternatives": []
  },
  "idare-hukuku-5442": {
    "topicId": "4d185b8e-a24f-4f0e-8c29-d17e03eeec11",
    "topicName": "5442 İl İdaresi Kanunu",
    "alternatives": []
  },
  "idare-hukuku-2576": {
    "topicId": "b7a655d1-8b82-416d-bbdf-33d4d5679545",
    "topicName": "2576 Bölge İdare Mahkemeleri Kanunu",
    "alternatives": []
  },
  "idare-hukuku-2577": {
    "topicId": "e22d1f78-8191-4099-9134-044c59114bd7",
    "topicName": "2577 İdari Yargılama Usulü Kanunu (İYUK)",
    "alternatives": []
  },
  "kolluk-mevzuati-5901": {
    "topicId": "5f4ee087-a19b-4e99-84e6-aadc837acc77",
    "topicName": "5901 Sayılı Türk Vatandaşlığı Kanunu",
    "alternatives": []
  },
  "idare-hukuku-4982": {
    "topicId": "5c959129-bee5-4aca-bb94-c97fbc7eddf9",
    "topicName": "4982 Sayılı Bilgi Edinme Hakkı Kanunu",
    "alternatives": []
  },
  "trafik-ulastirma-2918": {
    "topicId": "3f91916c-8d15-40f4-bb20-5bcca9253c34",
    "topicName": "2918 Sayılı Karayolları Trafik Kanunu",
    "alternatives": []
  },
  "kamu-personel-3628": {
    "topicId": "726855b4-e896-4e23-b5f0-32975a8f6684",
    "topicName": "3628 Sayılı Mal Bildiriminde Bulunulması Kanunu",
    "alternatives": []
  },
  "ceza-muhakemesi-5726": {
    "topicId": "9d7f38f7-d135-4c23-aca4-1f4fd1e474f9",
    "topicName": "5726 Sayılı Tanık Koruma Kanunu",
    "alternatives": []
  },
  "kamu-personel-657": {
    "topicId": "8b68257c-bd1e-4a44-bb49-830ee4d8e4c9",
    "topicName": "657 Sayılı Devlet Memurları Kanunu",
    "alternatives": []
  },
  "kamu-personel-emniyet-rutbe-terfi": {
    "topicId": "4cb2184e-8718-4be0-b4db-453c8cf715f0",
    "topicName": "Emniyet Rütbe Terfileri ve Değerlendirme Kurulları",
    "alternatives": []
  },
  "ceza-muhakemesi-5271": {
    "topicId": "25ddf5a1-9364-4c66-bd74-5d5bb71b21ff",
    "topicName": "5271 Sayılı Ceza Muhakemesi Kanunu (CMK)",
    "alternatives": []
  },
  "ataturk-ilkeleri-genel": {
    "topicId": "23d22785-351b-4f39-8516-a419e2c254c0",
    "topicName": "Atatürk İlkeleri ve İnkılap Tarihi",
    "alternatives": []
  },
  "kolluk-mevzuati-3201": {
    "topicId": "9c9b822c-028f-4d9b-929f-ad8487d53db4",
    "topicName": "3201 Sayılı Emniyet Teşkilat Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-2559": {
    "topicId": "65aef8de-07cb-49f6-8665-00adc0ef5754",
    "topicName": "2559 Sayılı Polis Vazife ve Salâhiyet Kanunu (PVSK)",
    "alternatives": []
  },
  "kamu-personel-4483": {
    "topicId": "ad5ea381-8b05-403b-98ff-8d1158f0cf79",
    "topicName": "4483 Sayılı Memurların Yargılanması Hakkında Kanun",
    "alternatives": []
  },
  "ceza-hukuku-5326": {
    "topicId": "569628d2-5e1c-4788-ad66-1ef20d9374f6",
    "topicName": "5326 Sayılı Kabahatler Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-2911": {
    "topicId": "477f97e4-2862-4836-a40a-6812e0609898",
    "topicName": "2911 Sayılı Toplantı ve Gösteri Yürüyüşleri Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-6136": {
    "topicId": "c030675a-0fc7-434a-9d39-980eb0456196",
    "topicName": "6136 Sayılı Ateşli Silahlar ve Bıçaklar Hakkında Kanun",
    "alternatives": []
  },
  "kolluk-mevzuati-6222": {
    "topicId": "f8aedb6a-9fd5-436b-a51f-3a6f23805ee2",
    "topicName": "6222 Sayılı Sporda Şiddetin Önlenmesine Dair Kanun",
    "alternatives": []
  },
  "kolluk-mevzuati-6284": {
    "topicId": "6787ab70-76ef-4fcf-88a8-fbd3e0d7f563",
    "topicName": "6284 Sayılı Ailenin Korunması Kanunu",
    "alternatives": []
  },
  "ceza-muhakemesi-adli-kolluk-yonetmeligi-4f886d": {
    "topicId": "55edda12-a684-4664-9564-a9844de0b7f3",
    "topicName": "Adli Kolluk Yönetmeliği",
    "alternatives": []
  },
  "ceza-muhakemesi-yakalama-gozaltina-alma-ve-ifade-alma-yo-5d3959": {
    "topicId": "f50bc484-d0b4-490d-a104-ab1fc2166120",
    "topicName": "Yakalama, Gözaltına Alma ve İfade Alma Yönetmeliği",
    "alternatives": []
  },
  "kolluk-mevzuati-cocuk-koruma-kanununun-uygulanmasina-ili-6e88de": {
    "topicId": "7b47e1cc-1573-4cfc-99fa-6c82b73b88ec",
    "topicName": "Çocuk Koruma Kanunu Uygulama Yönetmeliği",
    "alternatives": []
  },
  "kolluk-mevzuati-emniyet-atama-ve-yer-degistirme-yonetmel-c93678": {
    "topicId": "ca720f44-72d7-4159-9c40-806f47ef136f",
    "topicName": "Emniyet Atama ve Yer Değiştirme Yönetmeliği",
    "alternatives": []
  },
  "insan-haklari-genel": {
    "topicId": "ae196a63-74dc-4f56-91de-83eb06fa008c",
    "topicName": "İnsan Hakları",
    "alternatives": []
  },
  "yabanci-dil-ingilizce": {
    "topicId": "ad13f7da-0fe4-4365-a33d-5896b59e5fde",
    "topicName": "İngilizce",
    "alternatives": []
  },
  "turkce-dil-bilgisi": {
    "topicId": "aa78db69-0ebc-4162-b113-93777c25c691",
    "topicName": "Türkçe / Dil Bilgisi",
    "alternatives": []
  },
  "kolluk-mevzuati-5682": {
    "topicId": "baaa49b6-e1cc-410a-9391-3ea8c36e2a49",
    "topicName": "5682 Sayılı Pasaport Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-5253": {
    "topicId": "92736577-adb7-4e81-8935-9eb3391f748e",
    "topicName": "5253 Sayılı Dernekler Kanunu",
    "alternatives": []
  },
  "anayasa-hukuku-298": {
    "topicId": "fc5b7d84-ad74-446c-9ac6-3d4172a04ccf",
    "topicName": "298 Sayılı Seçimlerin Temel Hükümleri Kanunu",
    "alternatives": []
  },
  "idare-hukuku-6698": {
    "topicId": "efcd80f1-04c1-42b1-90bc-2d6f22df40c2",
    "topicName": "6698 Sayılı Kişisel Verilerin Korunması Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-6458": {
    "topicId": "18c6184c-6f45-4501-a075-0614a48ab77e",
    "topicName": "6458 Sayılı Yabancılar ve Uluslararası Koruma Kanunu",
    "alternatives": []
  },
  "anayasa-hukuku-2935": {
    "topicId": "7a4fe4c4-711c-442e-90b1-471abdb8d11a",
    "topicName": "Olağanüstü Hâl ve Sıkıyönetim Mevzuatı",
    "alternatives": []
  },
  "kolluk-mevzuati-emniyet-performans-degerlendirme-yonetme-6f923b": {
    "topicId": "f614ccc4-e39b-4715-ba55-f8a621775354",
    "topicName": "Emniyet Performans Değerlendirme Yönetmeliği",
    "alternatives": []
  },
  "ceza-hukuku-1481": {
    "topicId": "fc4fcb4f-3d76-41b9-9597-556534fb098a",
    "topicName": "1481 Sayılı Asayişe Müessir Bazı Fiillerin Önlenmesi Hakkında Kanun",
    "alternatives": []
  },
  "genel-kultur-genel": {
    "topicId": "7f70be51-1ce0-4c2e-ac1c-56b8c034732f",
    "topicName": "Genel Kültür",
    "alternatives": []
  },
  "idare-hukuku-3071": {
    "topicId": "02899557-fb4b-4fa6-8fc7-6cbea966d191",
    "topicName": "3071 Sayılı Dilekçe Kanunu",
    "alternatives": []
  },
  "ceza-hukuku-5607": {
    "topicId": "1589379f-ddfe-4ce9-b572-543838b93032",
    "topicName": "5607 Sayılı Kaçakçılıkla Mücadele Kanunu",
    "alternatives": []
  },
  "idare-hukuku-7201": {
    "topicId": "fc664c8f-e47b-4601-a661-9b6c5bd06e97",
    "topicName": "7201 Sayılı Tebligat Kanunu",
    "alternatives": []
  },
  "anayasa-hukuku-584": {
    "topicId": "d4a6b734-0110-4c9e-ae57-8cc39091a369",
    "topicName": "Türkiye Büyük Millet Meclisi İçtüzüğü",
    "alternatives": []
  },
  "anayasa-hukuku-2820": {
    "topicId": "52223b97-98b3-408b-93f4-3e3a03bf509b",
    "topicName": "2820 Siyasi Partiler Kanunu",
    "alternatives": []
  },
  "anayasa-hukuku-2839": {
    "topicId": "fd517cd6-8889-4a46-b644-e6b156a5a9f3",
    "topicName": "2839 Milletvekili Seçimi Kanunu",
    "alternatives": []
  },
  "anayasa-hukuku-6271": {
    "topicId": "80c2d965-7e69-4c77-b67f-3a00043867e4",
    "topicName": "6271 Cumhurbaşkanı Seçimi Kanunu",
    "alternatives": []
  },
  "anayasa-hukuku-6216": {
    "topicId": "746633d6-5e90-404b-b0ea-ebcd670b4dc8",
    "topicName": "6216 Anayasa Mahkemesinin Kuruluşu ve Yargılama Usulleri Hakkında Kanun",
    "alternatives": []
  },
  "idare-hukuku-5233": {
    "topicId": "335363f4-e751-432d-9747-aea1edc32b39",
    "topicName": "5233 Sayılı Terör ve Terörle Mücadeleden Doğan Zararların Karşılanması Hakkında Kanun",
    "alternatives": []
  },
  "kamu-maliyesi-5018": {
    "topicId": "270990de-e156-4db0-b5fb-eb469562dd8a",
    "topicName": "5018 Sayılı Kamu Malî Yönetimi ve Kontrol Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-6284-sayili-ailenin-korunmasi-ve-kadina-914303": {
    "topicId": "61f85a6c-e9a1-4f19-85bc-dd8cbf04287e",
    "topicName": "6284 Sayılı Kanuna İlişkin Uygulama Yönetmeliği",
    "alternatives": []
  },
  "ceza-muhakemesi-teknik-yontemlerle-takip-sistemlerinin-k-26f648": {
    "topicId": "c245c059-861e-4c26-995a-f0518502cce8",
    "topicName": "Teknik Yöntemlerle Takip Sistemlerinin Kullanılmasına Dair Yönetmelik",
    "alternatives": []
  },
  "kolluk-mevzuati-cocuk-koruma-kanununa-gore-verilen-koruy-8bcad8": {
    "topicId": "3e609f93-00e7-42de-9c16-59d4d43d6a89",
    "topicName": "Koruyucu ve Destekleyici Tedbir Kararlarının Uygulanması Hakkında Yönetmelik",
    "alternatives": []
  },
  "diger-mevzuat-teror-ve-terorle-mucadeleden-dogan-zarar-9f425e": {
    "topicId": "931c3a08-1e30-40ec-bca4-0eb9fb75aa44",
    "topicName": "Terör ve Terörle Mücadeleden Doğan Zararların Karşılanması Hakkında Yönetmelik",
    "alternatives": []
  },
  "ceza-muhakemesi-5235": {
    "topicId": "5e2abdb1-eeb5-4fc0-8cb3-57b4aa6e07b2",
    "topicName": "5235 Sayılı Adlî Yargı İlk Derece Mahkemeleri Kuruluş, Görev ve Yetkileri Hakkında Kanun",
    "alternatives": []
  },
  "insan-haklari-avrupa-insan-haklari-sozlesmesi-b7376a": {
    "topicId": "8b991a24-eecf-48c9-a068-0aecfc65cfd1",
    "topicName": "Avrupa İnsan Hakları Sözleşmesi (AİHS)",
    "alternatives": []
  },
  "anayasa-hukuku-7062": {
    "topicId": "f9277971-f73f-4134-914d-0584c1190e6b",
    "topicName": "7062 Yüksek Seçim Kurulunun Teşkilat ve Görevleri Hakkında Kanun",
    "alternatives": []
  },
  "anayasa-hukuku-6085": {
    "topicId": "c8f4a045-6e4c-4fa6-b3a6-557cd0032d20",
    "topicName": "6085 Sayıştay Kanunu",
    "alternatives": []
  },
  "anayasa-hukuku-3376": {
    "topicId": "35a52e25-aef4-4ae2-b76f-9585db6ffd74",
    "topicName": "3376 Anayasa Değişikliklerinin Halkoyuna Sunulması Hakkında Kanun",
    "alternatives": []
  },
  "ceza-muhakemesi-6706": {
    "topicId": "8acb1d24-36dc-4517-89d0-68043758dcd1",
    "topicName": "6706 Cezai Konularda Uluslararası Adli İş Birliği Kanunu",
    "alternatives": []
  },
  "ceza-muhakemesi-5275": {
    "topicId": "3a7fb703-175b-4a01-a217-a00766c51d07",
    "topicName": "5275 Ceza ve Güvenlik Tedbirlerinin İnfazı Hakkında Kanun",
    "alternatives": []
  },
  "ceza-muhakemesi-5352": {
    "topicId": "96b6ca9d-9c80-4b37-8bba-ef13eef075e8",
    "topicName": "5352 Adli Sicil Kanunu",
    "alternatives": []
  },
  "idare-hukuku-2575": {
    "topicId": "be738fb3-fc30-4d1e-9306-c1cb2eb7d0c3",
    "topicName": "2575 Danıştay Kanunu",
    "alternatives": []
  },
  "insan-haklari-3686": {
    "topicId": "3a4a4920-5abf-48ac-8e49-4c409475d7e5",
    "topicName": "3686 Sayılı İnsan Haklarını İnceleme Komisyonu Kanunu",
    "alternatives": []
  },
  "insan-haklari-6328": {
    "topicId": "387f7067-fbf4-4f00-876c-e9cdc903039a",
    "topicName": "6328 Sayılı Kamu Denetçiliği Kurumu Kanunu",
    "alternatives": []
  },
  "insan-haklari-6701": {
    "topicId": "a0798f24-de4a-42a3-95aa-ef133be3d387",
    "topicName": "6701 Sayılı Türkiye İnsan Hakları ve Eşitlik Kurumu Kanunu",
    "alternatives": []
  },
  "turkce-sozel-yetenek": {
    "topicId": "6cdbe5f7-2150-4e02-be9e-0a596fcd7882",
    "topicName": "Sözel Yetenek",
    "alternatives": []
  },
  "genel-kultur-muhakeme": {
    "topicId": "3c617401-410a-4ecd-a4be-676004e1e06d",
    "topicName": "Analitik Akıl Yürütme",
    "alternatives": []
  },
  "genel-kultur-sayisal": {
    "topicId": "631a488e-318e-498c-969c-f5157783e5d5",
    "topicName": "Matematik ve Sayısal Mantık",
    "alternatives": []
  },
  "kolluk-mevzuati-2860": {
    "topicId": "11f0f172-a435-4a78-97bc-9815f65f7e1c",
    "topicName": "2860 Sayılı Yardım Toplama Kanunu",
    "alternatives": []
  },
  "kolluk-mevzuati-5188": {
    "topicId": "b451923e-eac4-44f2-9d0b-49d741cb0cfc",
    "topicName": "5188 Sayılı Özel Güvenlik Hizmetlerine Dair Kanun",
    "alternatives": []
  },
  "kolluk-mevzuati-ozel-guvenlik-hizmetlerine-dair-kanunun-c6efce": {
    "topicId": "0334bf9e-f6c1-4073-89cf-f82d02b3bfa3",
    "topicName": "Özel Güvenlik Hizmetlerine Dair Kanunun Uygulanmasına İlişkin Yönetmelik",
    "alternatives": []
  },
  "genel-kultur-guncel-konular": {
    "topicId": "a2442666-6bb1-49e5-9ff5-292717202201",
    "topicName": "Güncel ve Kültürel Olaylar",
    "alternatives": []
  }
};
