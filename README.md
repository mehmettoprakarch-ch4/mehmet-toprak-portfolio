# Mehmet Toprak — mimarlık portfolyosu

Statik, build gerektirmeyen portfolyo. `index.html` doğrudan tarayıcıda veya Live Server ile çalışır.

- `index.html`: büyük isim tipografisi, etkileşimli çizim/reveal alanı ve 11 çalışmalık proje ızgarası.
- `profil.html`: profil ve özgeçmiş.
- `iletisim.html`: iletişim sayfası.
- `projeler/`: mimari projeler, yarışmalar, yapı çizimleri, fotoğraf ve grafik tasarım için ayrı çalışma sayfaları.
- `architecture.css`: `#fa3600`, `#f3f3ec`, `#282828` paleti, responsive düzen ve hareket dili.
- `navigation.css`: sabit üst navigasyon ve tam ekran çalışma indeksi.
- `architecture.js`: mimari hedef imleci ve kısa turuncu çizim izi, proje kartı etkileşimleri, scroll sahneleri, çizgili sayfa geçişleri, galeriler ve görsel büyütme.
- `assets/`: web için optimize edilmiş proje görselleri.

Ana sayfa yalnızca büyük isim tipografisiyle açılır; mimari plan çizgileri imlecin yakınında belirginleşir. Proje ızgarası seçili işleri büyük, diğerlerini küçük gösterir ve kart görselleri kaydırmada hafif paralaks yapar. Üst menü açıldığında tam ekran proje dizinine dönüşür.

Proje sayfalarında kapak, kısa bilgiler, plan, kesit, detay ve süreç paftaları öne çıkar. Pafta büyütme penceresinde masaüstünde tekerlekle iki yönde ölçekleme ve yakınlaştırılmış görseli basılı tutup sürükleyerek gezme kullanılabilir. Dokunmatik ekranda görsele dokunarak yakınlaştırma yapılabilir; kapatma ve gezinme kontrolleri görünür kalır. Profil sayfası biyografi ve kronolojik deneyim zaman çizgisini, iletişim sayfası tek tıklamalı telefon ve e-posta bağlantılarını sunar.

İmleç mimari hedef işaretini, kısa turuncu çizim izini ve ekranı izleyen X/Y kılavuzlarını taşır; görsel alanlarda yüzde cinsinden ölçü notları gösterir. Fareyle boş bir alana veya büyütülmüş paftaya çift tıklayıp ikinci tıklamayı basılı tutarak sürüklemek geçici, şeffaf turuncu bir ölçü dikdörtgeni çizer. Dikdörtgen fare bırakıldıktan kısa süre sonra silinir; kaydedilmez. İmleç ve hareketler `prefers-reduced-motion` ayarına uyar; dokunmatik cihazlarda özel imleç kapalıdır. Harici sunucu, hesap veya paket kurulumu gerekmez.

`hareket.js` sitenin hareket katmanıdır: oturumda bir kez gösterilen topoğrafik açılış ekranı (soyadına gönderme: eş yükselti eğrileri çizilir, KOT ±0.00'dan +100.00'e sayar, A—A kesit çizgisiyle ikiye ayrılıp sayfayı açar), Yaklaşım ve Süreç bölümlerinde kaydırdıkça çizilen eş yükselti eğrileri, kelime kelime koyulaşan metin, kaydırma hızına ve yönüne göre hızlanan kayan şerit ve ekrana girince bulanıktan nete gelen görseller. Masaüstünde sayfa 1280 px genişliğinde ortalanır. Yazı tipleri Archivo ve IBM Plex Mono'dur; internet erişimi olmadığında yerel yedek fontlar kullanılır.
