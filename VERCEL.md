# Vercel production checklist (images, sign-in, Google Maps)

Use this when the site works on **localhost** but not on **Vercel** (`*.vercel.app` or your custom domain).

---

## 1. Images not loading

### A. Git LFS (this repo tracks `images/**` with LFS)

- **Push from a machine with Git LFS installed** so real image binaries are on GitHub, not tiny pointer files:
  ```bash
  git lfs install
  git add images/
  git commit -m "Ensure LFS images pushed"
  git push origin main
  ```
- **Vercel** fetches Git LFS files when it clones your GitHub repo—do **not** set `buildCommand` to `git lfs pull` (that command often fails in Vercel’s build environment and breaks the whole deploy).
- In the browser: open DevTools → **Network** → click a broken image. If the response is a **few lines of text** starting with `version https://git-lfs.github.com/spec/v1`, LFS files were not fetched on deploy—fix push/LFS and redeploy.

### B. Branch and root directory

- Vercel must deploy the branch that **contains** `images/` (same branch as `index.html`).
- **Project → Settings → General → Root Directory**: leave empty if `index.html` is at the repo root, or set it to your subfolder (e.g. `deploy`) if the site lives there.

### C. Case-sensitive paths (Linux on Vercel vs Windows locally)

Windows/macOS often treat `photo.jpg` and `Photo.jpg` as the same file; **Linux does not**. Your `src` / `url()` must match **exact** folder and file names in the repo.

**Checklist (in order):**

1. **File names** — e.g. repo has `IMG_1328.jpg` → use `images/bags/IMG_1328.jpg`, not `img_1328.jpg`.
2. **Folder names** — e.g. `images/fragrances/` not `images/Fragrances/`.
3. **Renamed files** — if you replaced `black coach 1.jpg` with `black-coach-1.jpg`, update every HTML/CSS/JS reference (hero backgrounds, data files).
4. **Mixed casing in one folder** — e.g. `Sundays-in-rio-1.jpg` vs `sundays-in-rio-2.jpg` must each be referenced with the same casing as on disk.
5. **HTML in subfolders** — if you ever move pages under `about/index.html`, use `../images/...` from there, not `./images/...` (this site keeps flat HTML at root, so `images/...` is correct).

On GitHub: open the `images/` folder in the web UI and copy path segments exactly when in doubt.

---

## 2. Sign-in / Google sign-in (Firebase Auth)

Firebase only allows sign-in from **authorized domains**.

1. Open [Firebase Console](https://console.firebase.google.com/) → your project (**must match** `firebase.js`: `slay-station-9cad9`).
2. **Authentication** → **Settings** → **Authorized domains**.
3. Add:
   - `slaystation-ke.vercel.app` (or your exact Vercel hostname)
   - Your **custom domain** if you use one (e.g. `www.slaystation.co.ke`)
4. Save, wait a minute, try again in an incognito window.

**Google sign-in (popup):** In the same Firebase project, enable **Google** under **Sign-in method**. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → your **Web client** (OAuth 2.0): add **Authorized JavaScript origins** for `https://your-project.vercel.app` and your custom domain.

---

## 3. Google Maps / Places (checkout, track order)

The Maps key is set in `checkout.html` and `track-order.html` as `SLAYSTATION_GOOGLE_MAPS_KEY`.

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → your API key.
2. Under **Application restrictions** → **HTTP referrers**, add (replace with your real host):
   - `http://localhost/*`
   - `http://127.0.0.1/*`
   - `https://slaystation-ke.vercel.app/*`
   - `https://*.vercel.app/*` (optional, for preview deployments)
   - Your production custom domain: `https://www.yourdomain.com/*`
3. Enable APIs: **Maps JavaScript API**, **Places API** (and **Geocoding** if you use it).

If referrers only list `localhost`, Maps will work locally but **fail on Vercel**.

---

## 4. Password reset links

Reset emails should use your **live site origin** (handled in code via `window.location.origin` on login/rider-login). If you still use a fixed URL, update it to match wherever `reset-password.html` is hosted.

---

## Quick debug

| Symptom | Likely cause |
|--------|----------------|
| Broken images, tiny “version…” response | Git LFS not pulled / not pushed correctly |
| `auth/unauthorized-domain` in console | Add Vercel domain in Firebase **Authorized domains** |
| “This page can’t load Google Maps correctly” | API key HTTP referrer restrictions |
| Google popup closes / `auth/popup-blocked` | Popup blocker; or wrong OAuth origins |

After any Firebase or Google Cloud change, **hard refresh** or use a private window.
