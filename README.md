# Civic Sathi Local Replica

This folder contains a locally hosted replica of the **Civic‑Sathi** web app.

## Files
- `index.html` – Main HTML page (links to external CSS/JS).
- `style.css` – All styles extracted from the original site.
- `script.js` – Original JavaScript logic (camera, GPS, voice input, form submission).

## Running a Local Server
The site must be served over HTTP for the camera, geolocation, and fetch APIs to work.

### Option 1: Node.js (`npx http-server` or `npx serve`)
1. Install Node.js if not already present: <https://nodejs.org/>.
2. Open a terminal in this folder and run:
   ```
   npx http-server -p 8000
   ```
   or
   ```
   npx serve -l 8000
   ```
3. Open <http://localhost:8000/> in a browser.

### Option 2: Python (if installed)
```powershell
python -m http.server 8000
```
Then navigate to <http://localhost:8000/>.

### Option 3: PHP (if installed)
```powershell
php -S localhost:8000
```

### Option 4: VS Code Live Server extension
1. Open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right‑click `index.html` → **Open with Live Server**.

## Next Steps
Once the site loads locally, let me know which server you used (or if you need help setting one up). After confirming the replica works, you can tell me any UI enhancements you’d like to apply.
