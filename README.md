# 🚀 ODTÜ Makina Mühendisliği Ders Programı & ME4 Varyasyon Optimizatörü

Bu proje, **[robotdegilim.xyz](https://www.robotdegilim.xyz/)** projesinin veri mimarisi ve ODTÜ Öğrenci İşleri Bilgi Sistemi (SIS) altyapısını kullanarak **ODTÜ Makina Mühendisliği (ME - Kod: 569)** öğrencileri için geliştirilmiş, yüksek performanslı ve modern bir haftalık ders programı planlayıcısıdır.

---

## 🌟 Temel Özellikler

1. **ODTÜ SIS & Robotdeğilim Entegre Veritabanı:**
   - ME kodlu tüm lisans (ME 1xx, 2xx, 3xx, 4xx) ve lisansüstü dersleri, aktif section'ları, öğretim üyeleri, derslikleri ve saatleri eksiksiz içerir.
   - Arayüzden tek tıkla canlı CDN üzerinden verileri güncelleme desteği (`Veri Güncelle` butonu).
   - ODTÜ SIS'ten doğrudan veri çekmek için bağımsız Python scraper (`scraper/scrape_sis_me.py`).

2. **Haftalık Ders Takvimi (08:40 - 17:30):**
   - Pazartesi - Cuma günleri arası.
   - Her ders 50 dakika olacak şekilde günde 9 ders bloğu:
     - 1. Ders: `08:40 - 09:30`
     - 2. Ders: `09:40 - 10:30`
     - 3. Ders: `10:40 - 11:30`
     - 4. Ders: `11:40 - 12:30`
     - 5. Ders (Öğle): `12:40 - 13:30`
     - 6. Ders: `13:40 - 14:30`
     - 7. Ders: `14:40 - 15:30`
     - 8. Ders: `15:40 - 16:30`
     - 9. Ders: `16:40 - 17:30`

3. **Saat Bloklama (Kullanıcı Tercihli Boş Zamanlar):**
   - Takvimdeki herhangi bir kutucuğa tıklayarak o saati kapatabilme.
   - **Hızlı Butonlar:**
     - ☀️ *Sabah 08:40'ları Kapat* (Tüm hafta sabah ilk dersleri engeller)
     - 🌴 *Cuma Gününü Boşalt* (3 günlük hafta sonu yaratır)
     - ☕ *Öğle Arasını Koru (12:40)*
     - 🌅 *Pazartesi Sabahını Kapat*
   - Optimizasyon motoru bloklu saatlere **asla** ders yerleştirmez.

4. **Section Bazlı Ders Seçimi & Anlık Çakışma Kontrolü:**
   - ME derslerini arama ve sınıflara göre (1., 2., 3., 4. sınıf) filtreleme.
   - İstenilen spesifik bir section (Örn: Section 1) veya *"Herhangi Bir Section"* seçebilme.
   - Çakışan section'lar anında kırmızı uyarı rozetiyle ve gerekçesiyle gösterilir.
   - Takvim üzerinde hover ile anlık saat önizleme.

5. **Hedef Toplam Ders Sayısı Belirleme:**
   - Örneğin 3 sabit zorunlu ders seçip hedefi `5` yaptığınızda, sistem gereken 2 seçmeli dersi otomatik tespit eder.

6. **ME4 Teknik Seçmeli Varyasyon & Optimizasyon Motoru:**
   - 25 farklı 4. sınıf teknik seçmeli ME dersi (ME 402, 403, 407, 410, 411, 413, 414, 415, 423, 429, 431, 432, 434, 438, 442, 455, 461, 463, 464, 465, 474, 485, 493, 497...) arasından çakışmasız tüm kombinasyonları milisaniyeler içinde türetir.
   - **Sıralama Kriterleri:**
     - 🌴 **En Çok Boş Gün (Tatil Odaklı):** Hafta içi tam boş gün bırakan varyasyonları en başa alır.
     - ⏱️ **En Az Boşluklu (Kompakt):** Dersler arasındaki bekleme saatlerini minimize eder.
     - ☀️ **En Geç Başlayanlar (8:40 Yok):** Sabah erken dersleri olmayan programları öne çıkarır.
     - ⚖️ **Dengeli Dağılım:** Dersleri haftaya eşit yayar.
   - Varyasyonları tek tek takvimde gezebilme, beğendiğiniz varyasyonu tek tıkla takvime sabitleyebilme.

7. **Dışa Aktarma & Paylaşma:**
   - 📷 **PNG / Yüksek Çözünürlüklü Görsel İndir:** Programı görsel olarak kaydeder.
   - 🖨️ **Yazdır / PDF:** Temiz baskı formatı.
   - 📋 **Metin Olarak Kopyala:** Ders, derslik, saat ve hoca listesini panoya kopyalar.
   - 💾 **LocalStorage:** Sayfayı yenileseniz bile seçimleriniz ve bloklarınız kaybolmaz.

---

## 🛠️ Yerel Kurulum & Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için:

```bash
# Proje klasörüne girin
cd metu-me-scheduler

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda açın: `http://localhost:5173`

Üretim derlemesi (Production build) almak için:
```bash
npm run build
```
Derleme çıktısı `dist/` klasörüne oluşturulur.

---

## 🌐 Ücretsiz Sağlayıcılarla Anında Yayınlama (Deployment)

Bu uygulama %100 istemci tarafında (Client-Side) çalıştığı için herhangi bir sunucu maliyeti gerektirmez ve aşağıdaki ücretsiz platformlarda ömür boyu ücretsiz yayınlanabilir:

### 1. GitHub Pages (Otomatik CI/CD)
Projede `.github/workflows/deploy.yml` GitHub Actions iş akışı kuruludur:
1. Kodları GitHub'a gönderin:
   ```bash
   git push -u origin main
   ```
2. GitHub'da **eyuphanaydin3051/ME4XX** reposuna gidin -> **Settings** -> **Pages**.
3. **Build and deployment** > **Source** kısmında **"GitHub Actions"** seçeneğini seçin.
4. Kodları her push ettiğinizde siteniz otomatik derlenip şu adreste yayınlanacaktır:
   👉 **`https://eyuphanaydin3051.github.io/ME4XX/`**

### 2. Vercel ile Yayınlama (Önerilen - En Kolay ve Hızlı)
1. [vercel.com](https://vercel.com) adresine gidip GitHub hesabınızla giriş yapın.
2. **Add New Project** butonuna tıklayın.
3. Listeden **`eyuphanaydin3051/ME4XX`** reposunu seçip **Import** deyin.
4. Framework olarak Vite ve `vercel.json` otomatik algılanacaktır.
5. **Deploy** butonuna tıklayın. 20-30 saniye içinde siteniz `https://me4xx.vercel.app` (veya istediğiniz özel isim) adresinde yayında!

### 3. Netlify ile Yayınlama
* **GitHub Entegrasyonu:** [netlify.com](https://netlify.com) adresinde **Add new site** -> **Import an existing project** -> **GitHub** -> **ME4XX** seçip Deploy deyin (`netlify.toml` hazırdır).
* **Manuel Sürükle-Bırak:** [app.netlify.com/drop](https://app.netlify.com/drop) adresine girip projedeki `dist` klasörünü sürükleyip bırakarak 5 saniyede anında yayına alabilirsiniz.

### 4. Cloudflare Pages ile Yayınlama
1. [dash.cloudflare.com](https://dash.cloudflare.com) adresinde **Workers & Pages** -> **Create application** -> **Pages** sekmesine gidin.
2. GitHub reponuzu bağlayın: **`eyuphanaydin3051/ME4XX`**.
3. Framework preset: **Vite**, Build command: `npm run build`, Output directory: `dist`.
4. Deploy! Siteniz Cloudflare'in küresel CDN ağı üzerinde sınırsız bant genişliği ile yayınlanır.

---

## 🐍 ODTÜ SIS Doğrudan Kazıyıcı (Scraper)

Gelecek dönemlerde ODTÜ SIS'ten yeni ders verilerini çekmek isterseniz:

```bash
cd scraper
pip install requests beautifulsoup4
python scrape_sis_me.py
```
Bu script `https://sis.metu.edu.tr` adresine bağlanarak güncel ME derslerini `me_scraped_live.json` olarak kaydeder.

---

## 📄 Lisans
MIT - Açık kaynak ve ücretsiz.
