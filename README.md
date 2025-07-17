# Energy Shop - Netlify Deployment Guide

Vollständiges Energy Shop mit Discord OAuth2 Integration für Netlify deployment.

## 🚀 Deployment auf Netlify

### 1. Voraussetzungen
- GitHub Repository mit dem Code
- Netlify Account
- Discord Application mit Bot

### 2. Netlify Deployment Steps

1. **GitHub Repository verbinden:**
   - Gehe zu [Netlify](https://netlify.com)
   - Klicke auf "Add new site" → "Import an existing project"
   - Verbinde dein GitHub Repository

2. **Build Einstellungen:**
   - **Build command:** `npm install`
   - **Publish directory:** `.`
   - **Functions directory:** `netlify/functions`

### 3. Environment Variables konfigurieren

Gehe zu Site Settings → Environment variables und füge hinzu:

```
BOT_TOKEN=MTIwNzc0OTE3MzQ3MDgzMDY4Mg.GvMi-q.V_Lo24I4AiBryD59CtCCwnplHwPTBeOK72CoTA
APPLICATION_ID=1207749173470830682
GUILD_ID=1182713836327936131
TICKET_CATEGORY_ID=1277869770682662922
LOG_CHANNEL_ID=1388247027971915897
CLIENT_SECRET=8IfexDxTIA5SeR1BGGzCEOGTkKIOrSc1
SESSION_SECRET=energy-shop-secret-key-production
NODE_ENV=production
```

### 4. Discord OAuth2 Redirect URI anpassen

In der Discord Developer Console:
- Gehe zu deine Application → OAuth2 → General
- Füge die Netlify URL hinzu: `https://DEINE-NETLIFY-SITE.netlify.app/.netlify/functions/server/auth/discord/callback`

### 5. Deploy

- Pushe den Code zum GitHub Repository
- Netlify wird automatisch deployen
- Die Website ist unter `https://DEINE-NETLIFY-SITE.netlify.app` verfügbar

## 📂 Projektstruktur

```
Energy Shop/
├── index.html              # Hauptwebsite
├── package.json            # Dependencies
├── netlify.toml            # Netlify Konfiguration
└── netlify/
    └── functions/
        └── server.js       # Serverless Function für Discord Integration
```

## 🛠️ Features

- ✅ Responsive Energy Shop Website
- ✅ Discord OAuth2 Authentication
- ✅ Automatische Ticket-Erstellung
- ✅ Serverless Functions für Netlify
- ✅ VBucks Calculator mit Tier-Pricing
- ✅ Alle Service-Modals mit Preisen

## 🔧 Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Lokalen Server starten (für Tests)
npm start

# Website läuft auf http://localhost:8080
```

## Services Offered

- **IPTV** (from 5€) - International TV channels, movies, and series
- **Spotify Premium** (from 4€) - Unlimited music streaming
- **YouTube Premium** (4€/35€) - Ad-free videos and YouTube Music
- **Paramount+** (€3) - Exclusive movies and series
- **NordVPN** (€3) - Secure internet browsing
- **Discord Nitro** - Enhanced chat features
- **PayPal to Crypto** - Currency exchange service
- **GTA V - PC** (8€) - 100 Million in-game money
- **Fortnite VBucks** - Calculator with tier pricing

## 📞 Support

Bei Problemen mit dem Deployment:
- Überprüfe die Netlify Function Logs
- Stelle sicher, dass alle Environment Variables gesetzt sind
- Prüfe die Discord OAuth2 Callback URL

## 🌐 Live Website

Nach dem Deployment ist die Website unter deiner Netlify URL verfügbar mit:
- Discord Login/Logout
- Automatische Ticket-Erstellung
- Alle Service-Bestellungen funktional
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icons
- **Responsive Design** - Mobile-first approach

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── components/
    └── (future components)
```

## Contact

For support and inquiries, visit our Discord server: [https://discord.gg/qvduG3wB8v](https://discord.gg/qvduG3wB8v)

## License

© 2025 Energy Shop. All rights reserved.
