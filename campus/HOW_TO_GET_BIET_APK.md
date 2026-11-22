# Official Ways to Generate & Install the BIET Android App

Because manual binary patching of third-party template APKs fails strict Android 12-15 security checks (`INSTALL_PARSE_FAILED`), here are the **3 official, 100% Google-certified methods** to get the genuine **BIET** Android App on your phone:

---

## 🥇 Method 1: Automated Official Google Cloud Compiler (GitHub Actions) - Recommended!

We have already configured an automated GitHub Actions pipeline in [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml).

### How it works:
1. **Push your code to GitHub**:
   - Create a GitHub repository named `biet`.
   - Upload the project files from this folder.
2. **Automated Cloud Build**:
   - Go to the **"Actions"** tab on your GitHub repository.
   - You will see the workflow: **"Build Official BIET Android APK"**.
   - GitHub uses official **Google Android SDK, OpenJDK 17, Gradle, and AAPT2** to compile the clean native APK.
3. **Download**:
   - Once the build finishes (~2 minutes), click on the completed run.
   - Under **"Artifacts"**, click **`BIET-Official-Android-APK`** to download `BIET.apk`!
   - This APK is 100% official, signed, and installs on any phone without any error!

---

## 🥈 Method 2: Microsoft PWABuilder (1-Click APK in 30 Seconds)

Once your web service is hosted on Render (`https://biet.onrender.com`):

1. Go to **[https://www.pwabuilder.com](https://www.pwabuilder.com)**.
2. Enter your live Render URL: `https://biet.onrender.com`.
3. Click **"Start"** (PWABuilder will analyze your PWA manifest and service worker).
4. Click **"Package for Stores"** → Select **"Android"**.
5. Click **"Generate APK / Package"**!
6. Download the resulting `.apk` and install it on your phone!

---

## 🥉 Method 3: 1-Tap Native WebAPK (Direct on Phone Right Now - 5 Seconds!)

Modern Android phones (Android 9 to Android 15) have built-in **Google Play Services WebAPK Minting**:

1. Make sure your phone is connected to the same WiFi or hotspot as your PC.
2. On your phone, open Google Chrome and visit:
   `http://<YOUR_PC_IP>:8000` (or `https://biet.onrender.com`)
3. Tap the green **"Install APK / Add to Home screen"** button at the top (or open the Chrome menu ⋮ and tap **"Install app"**).
4. Tap **"Install"**.
5. **Google Play Services will automatically build and install the native BIET app** directly on your phone!
   - Appears in your App Drawer with the official BIET logo
   - Runs in fullscreen without browser navigation bars
   - Works offline with cached campus maps & faculty directory
   - Supports emergency notifications & audio alarms
