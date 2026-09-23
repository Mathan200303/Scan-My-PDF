# ScanFlow – Document Scanner & PDF Tools

A production-ready Android mobile application built with **React Native**, **TypeScript**, and **pdf-lib**. ScanFlow transforms any Android smartphone into a portable document workstation that works **100% offline**, guaranteeing total document privacy.

---

## 🌟 Core Features

### 📸 1. Camera Document Scanner
- Live camera viewfinder with aspect ratio guides.
- Flash controls: `On`, `Off`, and `Auto`.
- Batch scanning with live multi-page counter.
- Gallery import shortcut.

### 📐 2. Edge Detection & Perspective Crop
- 4-corner adjustable bounding anchors (Top Left, Top Right, Bottom Left, Bottom Right).
- Draggable handles with real-time SVG polygon overlay.
- 90° rotation and boundary reset.
- Perspective crop calculation.

### 🎨 3. Scan Enhancement & Filters
- **Document Mode**: High contrast, crisp black & white text enhancement.
- **Original**: Unaltered natural photo capture.
- **Grayscale**: Balanced smooth gray tones.
- **Color Boost**: Vibrant color document punch.
- Non-destructive adjustments.

### 📑 4. Multi-Page Document Pipeline
- Visual page thumbnails with page numbering.
- Drag-and-drop / single-tap page reordering.
- Rotate individual pages.
- Delete unwanted pages.
- Configurable PDF generation (A4, Letter, Fit to Image, margins, Low/Medium/High compression).

### 🔄 5. Image & PDF Conversions
- **Image to PDF**: Select multiple images from the photo library, reorder, and export to PDF.
- **PDF to Image**: Select any PDF on the device, choose individual or all pages, and export to crisp `JPG` or `PNG` images.

### 🛠️ 6. Comprehensive PDF Tools
- **Merge PDF**: Combine multiple PDFs into a single file with custom page ordering.
- **Split PDF**: Extract specific pages or custom ranges (e.g. `1-3, 5`).
- **Page Manager**: Reorder, rotate, or delete specific pages from existing PDFs.
- **Cover Page Generator**: Academic assignment and business report cover sheets (Academic & Modern templates) with student name, ID, course, lecturer, date, and institution. Prepend directly to any PDF.
- **Add Watermark**: Stamp custom security text (`DRAFT`, `CONFIDENTIAL`, `SAMPLE`) with customizable opacity, rotation angle (diagonal 45°, 0°), font size, and page scope.
- **Add Page Numbers**: Number pages with customizable positions (Bottom Center, Bottom Left, Bottom Right, Top Center) and formats (`Page X of Y`, `Page X`, `1`).

### 📂 7. Document Management & Storage
- Local document repository (`documentRepository.ts`) using scoped sandbox storage.
- Search, filter by type (`All`, `PDF`, `Image`), and sort by `Newest`, `Oldest`, `Name (A-Z)`, `Largest Size`.
- Rename, duplicate, delete with confirmation, and native Android sharing sheet.

### 🔒 8. Privacy & Security
- **100% On-Device**: All PDF operations and image processing are performed locally.
- **No Remote Tracking**: Zero third-party telemetry, analytics, or background uploads.
- **Scoped Permissions**: Requests `CAMERA` and `READ_EXTERNAL_STORAGE` only when explicitly needed.

---

## 🏗️ Architecture & Project Structure

```text
scanflow/
├── android/                   # Native Android project configuration
│   └── app/src/main/java/.../ # Includes custom Kotlin PdfRendererModule.kt
├── assets/                    # App icons, adaptive icons, splash screens
├── src/
│   ├── components/            # Reusable UI components (Barrel exported)
│   │   ├── BannerAdView.tsx   # Google AdMob Adaptive Banner component
│   │   ├── Button.tsx
│   │   ├── Header.tsx
│   │   ├── DocumentCard.tsx
│   │   ├── DocumentCropBox.tsx # Interactive 8-handle & center-drag crop box
│   │   ├── ModernDialog.tsx   # Glassmorphism alert & action dialogs
│   │   ├── ToolCard.tsx
│   │   ├── PageThumbnail.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── EmptyState.tsx
│   │   └── index.ts
│   │
│   ├── constants/             # Design tokens & color system
│   │   └── theme.ts
│   │
│   ├── context/               # Theme context (Light / Dark / System)
│   │   └── ThemeContext.tsx
│   │
│   ├── navigation/            # Navigation routing & Modern Floating Dock
│   │   ├── AppNavigator.tsx
│   │   └── BottomTabs.tsx
│   │
│   ├── screens/               # Feature screens
│   │   ├── SplashScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── DocumentsScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── CropScreen.tsx
│   │   ├── ScanEditorScreen.tsx
│   │   ├── MultiPageScreen.tsx
│   │   ├── DocumentViewerScreen.tsx
│   │   ├── ImageToPdfScreen.tsx
│   │   ├── PdfToImageScreen.tsx
│   │   ├── PdfToolsScreen.tsx
│   │   ├── MergePdfScreen.tsx
│   │   ├── SplitPdfScreen.tsx
│   │   ├── PageManagerScreen.tsx
│   │   ├── CoverPageScreen.tsx
│   │   ├── WatermarkScreen.tsx
│   │   ├── PageNumberScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   ├── services/              # Pure business logic (Barrel exported)
│   │   ├── adService.ts       # Google AdMob service (Banner & Interstitials)
│   │   ├── fileService.ts
│   │   ├── imageService.ts
│   │   ├── pdfService.ts
│   │   ├── pdfRendererService.ts # Android native PDF renderer bridge
│   │   ├── shareService.ts
│   │   └── index.ts
│   │
│   ├── storage/               # Persistent data repositories (Barrel exported)
│   │   ├── documentRepository.ts
│   │   ├── settingsRepository.ts
│   │   └── index.ts
│   │
│   └── types/                 # TypeScript interfaces
│       └── index.ts
│
├── App.tsx                    # Root entry
├── app.json                   # Expo & Android Play Store config
├── privacy_policy.html        # Play Store compliant privacy policy
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Android Studio / Android SDK (for physical device / emulator runs)

### Installation
```bash
npm install
```

### Type Checking
```bash
npm run ts:check
```

### Running the App
```bash
# Start Metro bundler
npm start

# Run directly on connected Android device / emulator
npm run android
```

---

## 📦 Google Play Store Readiness

- **Package ID**: `com.scanflow.scanner`
- **Version**: `1.0.0` (Version code: `1`)
- **App Bundle**: Run `npx eas build -p android --profile production` or `./gradlew bundleRelease` in `android/`.

