# BIET - Render.com 24/7 Cloud Hosting Guide

This guide explains how to deploy the **BIET** full-stack campus web app and API to **[Render.com](https://render.com)** for **free 24/7 cloud hosting**.

---

## 🚀 Quick Setup (Under 3 Minutes)

### Option A: 1-Click Render Blueprint (Recommended)

1. **Upload your code to GitHub**:
   - Go to [github.com](https://github.com) and create a new repository named `biet`.
   - Upload the files from this folder (`c:\Users\lenovo\Downloads\campus`) to the repository.
   - Make sure `data/biet_campus.db` and `public/` are included in the upload.

2. **Connect to Render**:
   - Log in to **[dashboard.render.com](https://dashboard.render.com)** (sign up with GitHub).
   - Click the **"New +"** button in the top right and select **"Blueprint"**.
   - Connect your GitHub repository (`biet`).
   - Render will automatically detect [`render.yaml`](render.yaml) and configure:
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `python server.py`
     - **Health Check**: `/healthz`
   - Click **"Apply"**!

---

### Option B: Manual Web Service Setup on Render

If you prefer setting up manually without Blueprint:
1. In Render Dashboard, click **"New +"** → **"Web Service"**.
2. Select your GitHub repository.
3. Configure the fields:
   - **Name**: `biet`
   - **Region**: `Singapore` (or nearest region)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python server.py`
   - **Instance Type**: `Free`
4. Click **"Advanced"** → Set **Health Check Path** to `/healthz`.
5. Click **"Create Web Service"**.

Render will build and give you an SSL-secured live domain like:
👉 `https://biet.onrender.com`

---

## ⚡ Keeping Render Active 24/7 (Prevent Free Sleep)

Render's Free Tier spins down web services after 15 minutes of inactivity to save resources, and takes ~30 seconds to wake up on the next request.

To keep it **100% awake 24/7 with zero downtime**:

1. Go to **[cron-job.org](https://cron-job.org)** or **[uptimerobot.com](https://uptimerobot.com)** (both 100% free forever).
2. Create a free account and click **"Create Cronjob"** or **"Add New Monitor"**.
3. Set URL to:
   `https://biet.onrender.com/healthz`
4. Set execution interval to:
   **Every 10 minutes** (`*/10 * * * *`).
5. Save!

Now the monitor will ping your server every 10 minutes, keeping your BIET campus app awake **24 hours a day, 7 days a week, 365 days a year**! 🎉
