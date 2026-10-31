# EduAttention
### Smart Online Learning and Student Attention Monitoring Application

> **Polytechnic & Engineering Final Year Demo Ready**  
> Complete responsive web application + Android Studio WebView wrapper with client-side AI attention estimation and real-time live classroom sync.

---

## 🌟 Live Demo & Instant Deployment
- **Vercel Deployment**: Configured via [`vercel.json`](vercel.json). Push to GitHub and deploy to Vercel in 1-click with zero configuration.
- **Zero Backend Setup Required**: Operates using robust client-side storage (`localStorage`) and inter-tab `BroadcastChannel` communication for instant live demonstrations without external database dependencies.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| **Teacher** | `teacher@eduattention.com` | `password123` | Start classes, generate codes/links, monitor student attention matrix, mute all, end class, view class analytics |
| **Student** | `student@eduattention.com` | `password123` | Join with code/link, live video feed, real-time AI Attention HUD, raise hand, class chat, personal progress reports |

*Or click the **Demo Teacher** or **Demo Student** buttons in the top banner for instant one-click login!*

---

## 🚀 Key Modules & Architecture

### 1. AI-Assisted Attention Estimation Module
- **Real-Time Computer Vision Engine**: Uses HTML5 Canvas and video pixel analysis (`js/attention.js`) to estimate face presence and gaze orientation at 10Hz.
- **Biometric Face Centroid & Orientation**: Tracks head-tilt, horizontal gaze deviation (looking away left/right), and downward gaze (looking down at mobile phone).
- **Smooth Scoring Index (0-100%)**:
  - 🟢 **80% - 100%**: High Focus
  - 🟡 **55% - 79%**: Moderate / Wandering Gaze
  - 🔴 **0% - 54%**: Distracted / Absent Face
- **HUD Technology Overlay**: Tech bounding box with glowing corner brackets, live score indicator, and gaze direction tags.
- **Ethical AI & Student Privacy Protection**:
  - All computer vision runs **100% locally** on device within the browser canvas.
  - No camera frames are stored, saved, or uploaded to any server.
  - Non-camera **Privacy Mode** available with one click.

### 2. Real-Time Online Classroom
- **WebRTC Camera & Audio Feeds**: Full access to webcam and microphone via `navigator.mediaDevices.getUserMedia`.
- **Screen Sharing**: Live display sharing with classroom participants via `getDisplayMedia`.
- **Cross-Tab Live Synchronization (`BroadcastChannel`)**:
  - Open Teacher in Tab 1 and Student in Tab 2.
  - Student joins class -> Teacher tab updates live in real time!
  - Student moves/looks away -> Teacher's student tile attention bar changes live!
  - Student raises hand -> Teacher receives audio chime and visual alert!
  - Teacher ends class -> Student screen automatically transitions to attention performance report!

### 3. Real-Time Chat & Discussion
- Classroom group public chat + Teacher-Student direct messaging.
- Real-time timestamped messages with sender role badges.
- Intelligent demo auto-responder so solo college demonstrations feel completely alive.

### 4. Attendance & Progress Analytics
- Automatically records entry timestamp, exit timestamp, session duration, and calculated focus score.
- **Interactive Chart.js Visualizations**:
  - Attention Timeline (Continuous focus trend line).
  - Attention Distribution Doughnut (Focus vs Distraction vs Absent).
  - Weekly Attendance Rate Bar Chart.
- One-click **Printable / Exportable Report Card**.

### 5. Android Application (Android Studio)
- Located in `/android`.
- Fully configured `WebView` with `WebChromeClient` granting `CAMERA` and `RECORD_AUDIO` permissions.
- Back-button navigation handling and full-screen immersive UI.

---

## 🛠️ Step-by-Step Vercel Deployment

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of EduAttention"
   ```
2. Link your GitHub repository:
   ```bash
   git remote add origin https://github.com/Alwardas/edu-attention.git
   git branch -M main
   git push -u origin main
   ```
3. Open [Vercel Dashboard](https://vercel.com/new).
4. Click **Import** next to `edu-attention`.
5. Leave Framework preset as **Other** (Static Site) and click **Deploy**.
6. Your live demo URL will be available immediately!

---

## 📱 Compiling Android Studio APK

1. Launch **Android Studio**.
2. Select **Open** and choose the `android` folder from this repository (`c:\Edu attention\android`).
3. In `android/app/src/main/java/com/eduattention/app/MainActivity.java`, update `APP_URL` with your deployed Vercel URL.
4. Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Transfer the generated `app-debug.apk` to an Android phone or run directly in the Android Emulator.
