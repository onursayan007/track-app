# Servisim Geliyor — Filo & Servis Takip Platformu

Personel ve öğrenci servislerinin canlı takibi için yazılmış çok kiracılı (multi-tenant)
bir B2B platform. Temel derdi basit: **yolcu, servisin şu an nerede olduğunu ve kendi
durağına yaklaşık kaç dakikada geleceğini görebilsin.** Bunun etrafına da servis
şirketinin ihtiyaç duyduğu operasyon araçları (filo, sürücü, rota, alarm, bakım,
faturalandırma) örülmüş durumda.

> **Durum: yarım.** Bu proje aktif geliştirme sırasında bırakıldı. Çekirdek akış —
> cihazdan konum al, işle, haritada göster — uçtan uca çalışıyor; ama ETA hesabı,
> altyapı tanımları ve bazı protokol detayları hâlâ taslak seviyesinde.
> Neyin eksik olduğunu [Bilinen eksikler](#bilinen-eksikler) bölümünde dürüstçe
> listeledim.

---

## Neden var

Servis şirketleri araçlarına GPS takip cihazı (Teltonika, Arvento vb.) taktırıyor ama
bu cihazların verisi genelde tedarikçinin kendi kapalı paneline düşüyor. Bu proje o
veriyi **doğrudan cihazdan** alıp kendi veritabanına yazıyor, sonra üç ayrı kitleye
üç ayrı arayüzle sunuyor:

| Kim | Ne görür |
|---|---|
| **Yolcu / personel** | Servisim nerede, durağıma kaç dakika kaldı, sürücü kim |
| **Servis şirketi** | Canlı harita, filo durumu, hız/rölanti/sanal çit ihlalleri, rota planı, cari & fatura |
| **Platform sahibi (SuperAdmin)** | Kiracı (tenant) yönetimi, abonelik planları, M2M SIM kartları, sistem sağlığı |

Ayrıca araç camına yapıştırılan bir QR kod ile **giriş yapmadan** takip
(`/track/:publicAccessId`) ve geri bildirim (`/report/:qrToken`) akışları var.

---

## Mimari

```
   GPS Cihazı                 Backend (Node.js)                  İstemci
   ─────────                  ─────────────────                  ───────

  Teltonika ──TCP:5001─┐
  NMEA/Arvento─UDP:5002┼──►  listener.ts  ──►  Redis Stream  ──►  worker.ts
  Mobil app ──REST─────┤     (parse YOK,        telemetry:raw      │  │
  Arvento  ──webhook───┘      sadece kuyruğa)                      │  │
                                                                   │  └─► TimescaleDB
                                                                   │      vehicle_telemetry
                                                                   │      (hypertable, toplu INSERT)
                                                                   │
                                                                   └─► Redis Pub/Sub
                                                                          │
                                                                          ▼
                                                                     Socket.io
                                                                   (tenant/vehicle/route
                                                                     bazlı odalar)
                                                                          │
                                                                          ▼
                                                                    Vue 3 + Leaflet
```

Tasarımın ana fikri: **dinleyici hiçbir şey parse etmez.** TCP/UDP soketine düşen ham
byte'lar olduğu gibi Redis Stream'e yazılır ve socket hemen serbest bırakılır. Parse,
cihaz→araç eşleme ve veritabanı yazımı ayrı worker'larda yapılır. Böylece binlerce
cihaz aynı anda ping atarken ingest tarafı tıkanmaz, worker'ları da consumer group ile
yatayda çoğaltabilirsiniz.

### Desteklenen konum kaynakları

| Kaynak | Taşıma | Format | Nerede |
|---|---|---|---|
| Teltonika FMB serisi | TCP `5001` | Codec 8 / 8E (binary, IMEI handshake + ACK) | `telemetry/listener.ts`, `parsers.ts` |
| Genel GPS tracker | UDP `5002` | NMEA 0183 (`$GPRMC`, `$GPGGA`) | `parsers.ts` |
| Arvento | UDP `5002` veya `POST /api/v1/telemetry/webhook/arvento` | JSON (`IMEI` alanına bakılır) | `telemetry.routes.ts` |
| Mobil uygulama | `POST /api/v1/telemetry/ingest` (JWT) | JSON `{lat,lng,speed,heading}` | `telemetry.routes.ts` |

UDP dinleyicisi gelen paketi sezgisel olarak ayırıyor: `{` ile başlıyorsa JSON
(Arvento mı app mı diye `IMEI` alanına bakıyor), `$G` ile başlıyorsa NMEA, geri kalanı
ham hex Teltonika kabul ediliyor.

Araç kaydındaki `hardwareType` alanı da bunu yansıtıyor: `ARVENTO | UDP | APP_ONLY`.

---

## Bileşenler

### `backend/` — Node.js + TypeScript + Express 5

Ana API ve telemetri hattı.

- **Prisma + PostgreSQL** — 27 model, 11 migration. Kiracı, araç, rota, durak, sefer,
  sürücü vardiyası, sanal çit, alarm, fatura, cari hareket, geri bildirim, denetim kaydı.
- **TimescaleDB** — konum geçmişi Prisma'dan değil, ham `pg` ile yazılıyor
  (`lib/timescale.ts`). Sebep: Prisma `create_hypertable()` / `time_bucket()` desteklemiyor.
- **Socket.io** — kiracı bazlı izole odalar (`tenant:*`, `vehicle:*`, `route:*`) ve
  giriş gerektirmeyen public namespace (`public:vehicle:*`, `public:trip:*`).
- **Redis** — hem Stream (ingest tamponu) hem Pub/Sub (worker → Socket.io köprüsü).
  Worker ayrı process'te çalışabilsin diye `io.emit()` yerine Pub/Sub kullanılıyor.
- **Cron işleri** — abonelik askıya alma (`billing.cron`), ihlal taraması
  (`violation.cron`), geri bildirim medyası temizliği.
- **Swagger** — `http://localhost:3000/api/docs`

Roller: `SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_OPERATOR`, `DRIVER`, `PASSENGER`.
Her router kendi auth + rol + tenant guard'ını uyguluyor; `tenant.middleware.ts`
kiracı sızıntısını engelliyor.

Otomatik üretilen alarmlar (`services/violation.service.ts`): Hız Sınırı Aşımı,
Sanal Çit İhlali, Cihaz Sinyali Kesildi, Rölanti İhlali, Mesai Dışı Kullanım.
Her biri araç+tip başına 5 dakikalık cooldown ile kaydediliyor.

### `shuttle-frontend/` — Vue 3 + Vite + Tailwind

Tek SPA içinde dört ayrı panel (layout başına bir rol) + iki public sayfa:

- `/super-admin/*` — kiracılar, araçlar, araç modelleri, M2M SIM, fiyatlandırma,
  faturalar, duyurular, denetim kayıtları, sistem sağlığı
- `/company/*` — canlı harita, planlama, rotalar, filo, sürücüler, yolcular,
  müşteriler, sevkiyat, raporlar, bakım, geri bildirim, alarmlar
- `/driver/*` — sefer başlat/bitir, rota, yolcu talepleri, rota kaydedici
- `/passenger/*` — servisim nerede, profil
- `/track/:publicAccessId` — QR ile giriş yapmadan canlı takip
- `/report/:qrToken` — QR ile geri bildirim / şikâyet formu

Harita **Leaflet** (`@vue-leaflet/vue-leaflet`), durum **Pinia**, canlı veri
`socket.io-client`.

### `ai-service/` — Python + FastAPI

Ağır işleri Node'dan ayırmak için yazılmış küçük mikroservis. `X-API-Key` ile korunuyor.

- **Ruhsat OCR** — araç ruhsatı fotoğrafından plaka / şasi no / model çıkarma
  (OpenCV + pytesseract)
- **Sürücü güvenlik skoru** — telemetri metriklerinden puan hesaplama
- **MCP manifest** — `/.well-known/mcp.json`, AI ajanlarının bu servisi araç olarak
  keşfedebilmesi için

---

## Kurulum

### Gereksinimler

- Node.js 20+
- Python 3.11+ (sadece `ai-service` için)
- PostgreSQL 15 + TimescaleDB eklentisi
- Redis 6+

### 1. Altyapı

Hazır compose dosyası (Postgres + Redis + Adminer) `shuttle-frontend/` altında duruyor —
biraz garip bir yerde, taşınması gerek:

```bash
docker compose -f shuttle-frontend/docker-compose.yml up -d
```

> Dikkat: bu dosya `postgis/postgis:15-3.3` imajını kullanıyor, TimescaleDB **yok**.
> Konum geçmişi hypertable'ı için `timescale/timescaledb:latest-pg15` imajına geçmeniz
> gerekiyor. Aksi halde sunucu açılırken `ensureTimescaleSchema()` uyarı basıp geçiyor
> ve canlı takip Socket.io üzerinden çalışmaya devam ediyor, ama geçmiş veri yazılmıyor.

### 2. Backend

```bash
cd backend
cp .env.example .env    # DATABASE_URL ve JWT_SECRET'i doldurun
npm install
npx prisma migrate deploy
npx prisma generate
npm run seed            # demo kiracı + kullanıcılar
npm run dev
```

Sunucu `http://localhost:3000` üzerinde; TCP dinleyici `5001`, UDP dinleyici `5002`.

### 3. Frontend

```bash
cd shuttle-frontend
npm install
npm run dev
```

`VITE_API_URL` (varsayılan `http://localhost:3000/api/v1`) ve `VITE_SOCKET_URL`
(varsayılan `http://localhost:3000`) ile backend adresini değiştirebilirsiniz.

### 4. AI servisi (opsiyonel)

```bash
docker compose up -d ai-service
# veya elle:
cd ai-service && pip install -r requirements.txt && python run.py
```

Ruhsat OCR için sistemde `tesseract` binary'sinin kurulu olması gerekiyor.

### 5. Elinizde cihaz yoksa

Beş sanal aracı gerçek Antalya rotaları üzerinde dolaştıran bir UDP simülatörü var:

```bash
node backend/gps-simulator.js --interval 3000 --port 5002
```

Arvento JSON, app JSON ve NMEA `$GPRMC` formatlarını dönüşümlü olarak gönderiyor —
yani parser hattının tamamını test ediyor. Simülatörün ürettiği `deviceId` değerlerini
veritabanındaki araçların `deviceId` alanına yazmayı unutmayın, yoksa worker paketleri
`unmappedDevices` sayacına atıp düşürür.

Pipeline'ın sağlığını `GET /api/v1/telemetry/stats` (SuperAdmin) ile izleyebilirsiniz:
işlenen paket, yazılan satır, parse hatası, eşleşmeyen cihaz sayıları.

---

## Bilinen eksikler

Projeyi devralacak biri için en faydalı bölüm burası.

**ETA hesabı gerçek anlamda yok.** Projenin vitrindeki özelliği olmasına rağmen en
ham parçası:
- `PassengerPortal.vue` içinde ETA = ilk durağa kuş uçuşu mesafe ÷ sabit 35 km/h.
  Yol geometrisi, trafik, mevcut hız, ara duraklardaki bekleme süresi hesaba katılmıyor.
- `stores/shuttle.js` içindeki `eta` ise düpedüz `ref(5)` — sabit beş dakika.
- Doğrusu: rota polyline'ı üzerinde kalan mesafeyi çıkarıp, aracın son N ping'inden
  gerçek ortalama hızı hesaplayıp, `RouteOptimizationService` zaten Google Directions
  API'sini konuştuğu için oradan trafikli süre çekmek. Altyapı hazır, hesap yazılmamış.

**Telemetri hattında pürüzler:**
- Teltonika TCP ACK'i frame'in 9. byte'ından kayıt sayısını okuyan bir kestirme
  (`listener.ts` içinde yorumla işaretli). Codec 8E'de bu yanlış sonuç verebilir.
- `readIoElements()` içindeki 16-bit ID okuma offset aritmetiği okunması zor ve
  gerçek bir 8E cihazıyla doğrulanmadı.
- UDP tarafında protokol tespiti tamamen sezgisel; cihaz başına açık protokol tanımı
  (`Vehicle.hardwareType` alanı zaten var) kullanılmıyor.
- UDP dinleyicide kimlik doğrulama yok — pakete yazdığınız `deviceId`'ye güveniliyor.
  Üretimde IP whitelist veya cihaz başına paylaşılan anahtar şart.

**Diğer:**
- `MockTelemetryService` üretim boot sırasında koşulsuz başlıyor (`index.ts`).
  Canlı haritayı demoda hareketli göstermek için eklenmişti; `NODE_ENV` kontrolüne
  bağlanması gerek.
- Kök dizindeki `server.js`, `app.js`, `index.js`, `database.js` dosyaları **Sequelize
  ile yazılmış ilk prototipin kalıntısı**. Hiçbir yerden çağrılmıyorlar, `backend/`
  içindeki Prisma tabanlı sürüm bunların yerini aldı. Temizlenebilir.
- Aynı şekilde kök dizindeki `api.js`, `auth.js`, `SuperAdminVehicles.vue` dosyaları
  `shuttle-frontend/src/` altındaki gerçek dosyaların geride kalmış sürümleri —
  üçü de asıllarından belirgin şekilde kısa (`auth.js` 65 satır, aslı 134). Build'e
  girmiyorlar, sadece kafa karıştırıyorlar.
- `login.json` ve `test-login.js` içinde açık test parolası duruyor
  (`admin@servisimgeliyor.com` / `password123`). Geliştirme fixture'ı, üretime gitmemeli.
- `docker-compose.yml` içinde backend servisi komple yorum satırında; sadece
  `ai-service` ayakta. Backend için Dockerfile henüz yazılmadı.
- Test yok. `ai-service/requirements.txt` içinde pytest duruyor ama test dosyası yok.

---

## Dizin yapısı

```
backend/
  prisma/          schema.prisma (27 model), 11 migration, seed
  src/
    telemetry/     listener · parsers · stream · worker · pubsub   ← konum hattı
    controllers/   19 controller (auth, gps, vehicle, finance, tenant-*, public-*)
    services/      15 servis (location, route-optimization, violation, billing, ...)
    routes/        superadmin (53 uç) · tenant (67 uç) · driver (14 uç) · public · telemetry
    middlewares/   auth · role · tenant · suspension · upload
    cron/          billing · violation · feedback-media-cleanup
    lib/           prisma · redis · timescale
  gps-simulator.js UDP test üreteci

shuttle-frontend/
  src/views/       48 sayfa (SuperAdmin* · Company* · Driver* · Passenger* · Public*)
  src/layouts/     rol başına bir layout
  src/stores/      auth · shuttle (Pinia)
  src/services/    api (axios) · socket (socket.io-client)

ai-service/
  app/routers/     health · ocr · driver_score
  app/services/    ocr_service · score_service
  app/mcp/         manifest (/.well-known/mcp.json)
```
