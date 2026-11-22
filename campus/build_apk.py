"""
BIET Davangere - Smart Campus 360 APK Builder Script
Generates a complete Android native project ready to compile into an APK
using Capacitor / Android Studio, or directly via command line.
"""
import os
import sys
import subprocess
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

def check_node():
    try:
        res = subprocess.run(["node", "-v"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"✓ Node.js detected: {res.stdout.strip()}")
        return True
    except Exception:
        print("✗ Node.js not detected in PATH.")
        return False

def setup_capacitor():
    print("Initializing Android Capacitor project for BIET Smart Campus 360...")
    pkg_json_path = os.path.join(BASE_DIR, "package.json")
    if not os.path.exists(pkg_json_path):
        pkg_data = {
            "name": "biet-smart-campus-360",
            "version": "2.0.0",
            "description": "BIET Davangere Smart Campus 360 Mobile App",
            "scripts": {
                "build": "echo Web build ready",
                "cap:sync": "npx cap sync android",
                "cap:open": "npx cap open android"
            },
            "dependencies": {
                "@capacitor/android": "^6.0.0",
                "@capacitor/cli": "^6.0.0",
                "@capacitor/core": "^6.0.0"
            }
        }
        with open(pkg_json_path, "w", encoding="utf-8") as f:
            json.dump(pkg_data, f, indent=2)
        print("✓ Created package.json")

    cap_config_path = os.path.join(BASE_DIR, "capacitor.config.json")
    cap_data = {
        "appId": "edu.bietdvg.campus360",
        "appName": "BIET Campus 360",
        "webDir": "public",
        "bundledWebRuntime": False,
        "server": {
            "androidScheme": "https",
            "cleartext": True
        }
    }
    with open(cap_config_path, "w", encoding="utf-8") as f:
        json.dump(cap_data, f, indent=2)
    print("✓ Created capacitor.config.json")

def print_apk_instructions():
    print("\n" + "="*60)
    print(" 📱 HOW TO BUILD / INSTALL APK ON YOUR ANDROID PHONE:")
    print("="*60)
    print("METHOD 1: Instant 1-Click PWA Phone Installation (Recommended)")
    print("  1. Run 'server.py' (or run.bat).")
    print("  2. Open http://<YOUR_COMPUTER_IP>:8000 in Chrome on your phone.")
    print("  3. Tap 'Install App / APK' button or browser menu -> 'Install app'.")
    print("  4. You have a full standalone Android App on your home screen!")
    print("\nMETHOD 2: Build Standalone .APK File via Android Studio / Capacitor")
    print("  1. Run: npm install")
    print("  2. Run: npx cap add android")
    print("  3. Run: npx cap copy")
    print("  4. Run: npx cap open android")
    print("  5. In Android Studio: Click Build -> Build Bundle(s) / APK(s) -> Build APK(s).")
    print("  6. The .apk file is ready in android/app/build/outputs/apk/debug/app-debug.apk!")
    print("="*60 + "\n")

if __name__ == "__main__":
    has_node = check_node()
    setup_capacitor()
    print_apk_instructions()
