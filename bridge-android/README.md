# YonuKom Print Bridge (Android)

A tiny native Android app that runs a **localhost HTTP server** on the phone and forwards
raw **ESC/POS bytes** received via HTTP to a paired **Bluetooth Classic** thermal receipt
printer (58mm AliExpress type, e.g. Goojprt / ZK-58 / XPrinter 58).

It is the companion to the **YonuKom** web app: when both run on the same phone, the web
app (opened in Chrome) can call `http://localhost:47822/print` to push a receipt to the
physical Bluetooth printer.

```
┌─────────────────┐   fetch(localhost:47822)   ┌──────────────────┐   RFCOMM/SPP   ┌────────────────┐
│   YonuKom PWA   │ ─────────────────────────▶ │  Print Bridge    │ ────────────▶ │ 58mm thermal   │
│  (Chrome)       │   CORS, octet-stream body  │  (Android app)   │   ESC/POS     │ BT printer     │
└─────────────────┘                            └──────────────────┘                └────────────────┘
```

---

## What the app does

- Runs as a **foreground service** (`PrintService`) that:
  - Hosts a NanoHTTPD HTTP server on `127.0.0.1:47822`.
  - Holds a single `BluetoothPrinterManager` (shared with the activity) that manages the
    RFCOMM socket to the chosen printer.
- Exposes 4 HTTP endpoints (see **Protocol** below) with full CORS so the HTTPS web app
  can fetch them from Chrome.
- UI to list paired Bluetooth printers, start/stop the bridge, and tap a printer to connect.

---

## HTTP protocol (port 47822)

All responses include CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Content-Length
```

`OPTIONS` preflight → **204 No Content** with the CORS headers above (no body).

### `GET /health`
```json
{"ok":true,"version":"1.0.0","printer":{"name":"<printer name or null>","address":"<mac or null>","connected":<true|false>}}
```

### `GET /printers`
```json
{"printers":[{"address":"<mac>","name":"<name>"}, ...]}
```
Returns all bonded (paired) Bluetooth Classic devices.

### `POST /connect`
Body: `{"address":"<mac>"}` (JSON).
```json
{"ok":true}     |   {"ok":false,"error":"<message>"}
```
Opens an RFCOMM socket to the device using the standard SPP UUID
`00001101-0000-1000-8000-00805f9b34fb`.

### `POST /print`
Body: raw ESC/POS bytes (`Content-Type: application/octet-stream`).
Writes the bytes to the connected printer's output stream and flushes.
```json
{"ok":true}     |   {"ok":false,"error":"<message>"}
```
If no printer is connected, returns:
```json
{"ok":false,"error":"Aucune imprimante connectée"}
```

---

## Build

### From Android Studio
1. `File → Open…` → select the `bridge-android/` directory.
2. Let Gradle sync (it will download AGP 8.5, Kotlin 1.9.24, AndroidX, NanoHTTPD).
3. Select a device or emulator (min API 23).
4. `Run ▶` or `Build → Build Bundle(s)/APK(s) → Build APK(s)`.

### From the command line
```bash
cd bridge-android
./gradlew assembleDebug     # produces an installable, debug-signed APK
# or
./gradlew assembleRelease   # also installable: release build type is signed with the debug key in this project
```

> The project ships no `gradlew` wrapper in this repo. Open it once in Android Studio
> (which generates the wrapper) **or** use the provided GitHub Action
> (`.github/workflows/build-bridge-apk.yml`) which uses `gradle/actions/setup-gradle@v3`
> to inject a `gradle` binary on PATH.

### APK output path
- Debug: `bridge-android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `bridge-android/app/build/outputs/apk/release/app-release.apk`
  (debug-signed — fine for sideloading)

---

## Install on a phone

```bash
adb install -r bridge-android/app/build/outputs/apk/debug/app-debug.apk
```
or transfer the APK to the phone (e.g. via file manager, USB, or a download link) and tap
**Install** (you will be prompted to allow installs from unknown sources for that file).

---

## Pair the Bluetooth printer first

The bridge only talks to **paired** printers (no scanning/discovery). Pair the printer
once via Android's Settings:

1. **Settings → Bluetooth → turn Bluetooth ON**.
2. Power on the printer (usually it auto-pairs or shows up as `BlueTooth Printer`,
   `RPP02N`, `ZK-58`, `Goojprt-…`, etc.).
3. Tap the printer in the list to pair. If asked for a PIN, try `0000` or `1234`.
4. Once "Paired", return to the YonuKom Print Bridge app and tap **Rafraîchir les
   imprimantes**.

---

## Usage

1. Open the **YonuKom Print Bridge** app on the phone.
2. Tap **Démarrer le pont** — the foreground notification appears and the status line
   reads **"Pont actif — port 47822"**.
3. Tap a paired printer in the list to connect. The status line updates with the printer
   name once connected.
4. Open **YonuKom in Chrome** on the same phone. The "Imprimer Bluetooth" button now
   works — Chrome will `POST http://localhost:47822/print` with the ESC/POS bytes and
   the receipt prints.

> Tip: keep the bridge app in the foreground (or at least the notification visible) so
> Android doesn't kill the foreground service.

---

## Permissions

| Permission | Why |
|---|---|
| `BLUETOOTH`, `BLUETOOTH_ADMIN` | Legacy (API ≤ 30) — bonded devices / SPP connect. |
| `BLUETOOTH_CONNECT` (runtime, API 31+) | `bondedDevices()`, `createRfcommSocketToServiceRecord()`. |
| `BLUETOOTH_SCAN` | Declared for completeness — never used (no discovery). |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_CONNECTED_DEVICE` | Run the HTTP server + BT socket from a foreground service. |
| `INTERNET` | NanoHTTPD localhost listener. |
| `POST_NOTIFICATIONS` (runtime, API 33+) | Foreground notification. |

---

## Project layout

```
bridge-android/
├── build.gradle.kts                  (root — plugins only)
├── settings.gradle.kts
├── gradle.properties
├── README.md                         (this file)
└── app/
    ├── build.gradle.kts              (minSdk 23, targetSdk 34, Kotlin 1.9, AGP 8.5)
    └── src/main/
        ├── AndroidManifest.xml
        ├── res/
        │   ├── layout/activity_main.xml
        │   └── values/strings.xml
        └── java/com/yonukom/printbridge/
            ├── MainActivity.kt
            ├── PrintService.kt
            ├── HttpServer.kt
            └── BluetoothPrinterManager.kt
```

---

## Troubleshooting

- **`/health` returns "Pont injoignable"** in the web app → the bridge app isn't in
  foreground / the service was killed. Re-open the app and tap **Démarrer le pont**.
- **`/print` returns `"Aucune imprimante connectée"`** → tap a printer in the list to
  connect before printing.
- **List of paired printers is empty** → pair the printer in Android Settings →
  Bluetooth first, then tap **Rafraîchir**.
- **Connect fails with "Permission refusée"** → grant the runtime permission prompt that
  appears when you tap **Démarrer le pont** (or in Settings → Apps → YonuKom Print
  Bridge → Permissions).
- **Receipt prints garbage / cut mid-line** → ensure the printer is set to 58mm ESC/POS
  mode (most are by default). The bridge sends bytes verbatim; it doesn't reformat.
