// ============================================================
//  HAAR. Voedingsadvies — backend
//  Run: node server.js  (or: npm run server)
// ============================================================

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || '').trim();
const STRIPE_WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const ROOT_DIR = __dirname;
// On Vercel serverless, use /tmp for ephemeral runtime storage
const RUNTIME_DIR = process.env.VERCEL ? '/tmp/haar-runtime' : path.join(ROOT_DIR, '.runtime');
const DRAFT_STORE_FILE = path.join(RUNTIME_DIR, 'draft-store.json');
const CSV_DIR = path.join(ROOT_DIR, 'Voeding prijzen en afbeeldingen', 'CSV files');
const BROK_CSV_FILE = path.join(CSV_DIR, 'brok-voerlijst-2026-03-11.csv');
const NATVOER_CSV_FILE = path.join(CSV_DIR, 'natvoer-voerlijst-2026-03-11.csv');

const STATIC_DIRS = [
  ['assets', path.join(ROOT_DIR, 'assets')],
  ['css', path.join(ROOT_DIR, 'css')],
  ['js', path.join(ROOT_DIR, 'js')],
  ['voeding-afbeeldingen', path.join(ROOT_DIR, 'Voeding prijzen en afbeeldingen', "Afbeeldingen 21 SKU's")],
];

const HTML_ROUTES = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/betaling.html': 'betaling.html',
  '/voedingsadvies-app.html': 'voedingsadvies-app.html',
  '/voerlijst.html': 'voerlijst.html',
};

const MAX_DRAFT_AGE_MS = 45 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_STATE = new Map();
const SAFE_ENUMS = {
  geslacht: ['kater', 'poes'],
  leefstijl: ['binnen', 'buiten', 'both'],
  activiteit: ['actief', 'gemiddeld', 'inactief'],
  eetgedrag: ['rustig', 'snel', 'kieskeurig'],
  drinkgedrag: ['weinig', 'gemiddeld', 'veel'],
  ontlasting: ['goed', 'wisselend', 'gevoelig'],
  vachtbeeld: ['glanzend', 'normaal', 'dof', 'klitten'],
  foodType: ['brok', 'natvoer', 'both'],
  primaryProfile: ['basis', 'kitten', 'sterilised', 'gevoelig', 'overgewicht', 'haarbal', 'vacht', 'senior', 'actief'],
  decisionProfile: ['kitten', 'balanced', 'sterilised', 'sensitive', 'hairball', 'actief', 'senior'],
  doelen: ['overgewicht', 'ondergewicht', 'vacht', 'gevoelig', 'keuze', 'haarbal'],
  vachtProbs: ['schilfers', 'haaruitval', 'dof', 'krabben'],
  textuurPref: ['Vleesreepjes', 'Fijne vleesreepjes', 'Paté', 'Mousse', 'Ragout', 'Saus', 'Fillet/gelei'],
};
const ALLOWED_ORIGINS = new Set(
  String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);

ensureRuntimeStore();
pruneDraftStore();

// ----------------------------------------------------------------
//  Helpers
// ----------------------------------------------------------------
function ensureRuntimeStore() {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
  if (!fs.existsSync(DRAFT_STORE_FILE)) {
    fs.writeFileSync(DRAFT_STORE_FILE, '{}\n', 'utf8');
  }
}

function safeText(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

function safeChoice(value, allowed = [], maxLength = 80) {
  const text = safeText(value, maxLength);
  return allowed.includes(text) ? text : '';
}

function safeEmail(value) {
  const text = safeText(value, 200).toLowerCase();
  if (!text) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : '';
}

function safeNumberText(value, { min = -Infinity, max = Infinity, integersOnly = false, maxLength = 40 } = {}) {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text) return '';
  if (integersOnly && !/^\d+$/.test(text)) return '';
  const num = Number(text);
  if (!Number.isFinite(num) || num < min || num > max) return '';
  return text.slice(0, maxLength);
}

function safeBoolean(value) {
  if (value === true || value === false) return value;
  return null;
}

function safeArray(value, maxItems = 8, maxLength = 80) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => safeText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function safeChoiceArray(value, allowed = [], maxItems = 8, maxLength = 80) {
  return safeArray(value, maxItems, maxLength).filter(item => allowed.includes(item));
}

function sanitizeDraftPayload(raw = {}) {
  return {
    draftId: safeText(raw.draftId, 120),
    ownerName: safeText(raw.ownerName, 160),
    catName: safeText(raw.catName, 160),
    catEmail: safeEmail(raw.catEmail),
    catRas: safeText(raw.catRas, 160),
    catLeeftijd: safeNumberText(raw.catLeeftijd, { min: 0, max: 30, integersOnly: true }),
    geslacht: safeChoice(raw.geslacht, SAFE_ENUMS.geslacht, 30),
    leefstijl: safeChoice(raw.leefstijl, SAFE_ENUMS.leefstijl, 40),
    castrated: safeBoolean(raw.castrated),
    gewicht: safeNumberText(raw.gewicht, { min: 0.5, max: 20 }),
    bcs: safeChoice(raw.bcs, ['2', '3', '5', '7', '8'], 20),
    activiteit: safeChoice(raw.activiteit, SAFE_ENUMS.activiteit, 40),
    eetgedrag: safeChoice(raw.eetgedrag, SAFE_ENUMS.eetgedrag, 40),
    drinkgedrag: safeChoice(raw.drinkgedrag, SAFE_ENUMS.drinkgedrag, 40),
    ontlasting: safeChoice(raw.ontlasting, SAFE_ENUMS.ontlasting, 40),
    vachtbeeld: safeChoice(raw.vachtbeeld, SAFE_ENUMS.vachtbeeld, 40),
    doelen: safeChoiceArray(raw.doelen, SAFE_ENUMS.doelen),
    vachtProbs: safeChoiceArray(raw.vachtProbs, SAFE_ENUMS.vachtProbs),
    bijzonderheden: safeText(raw.bijzonderheden, 1500),
    foodType: safeChoice(raw.foodType, SAFE_ENUMS.foodType, 40),
    textuurPref: safeChoiceArray(raw.textuurPref, SAFE_ENUMS.textuurPref),
    budgetMax: safeNumberText(raw.budgetMax, { min: 0, max: 10 }),
    primaryProfile: safeChoice(raw.primaryProfile, SAFE_ENUMS.primaryProfile, 80),
    decisionProfile: safeChoice(raw.decisionProfile, SAFE_ENUMS.decisionProfile, 80),
  };
}

function readDraftStore() {
  ensureRuntimeStore();
  try {
    const raw = fs.readFileSync(DRAFT_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.error('[DraftStore] Kon store niet lezen:', err.message);
    return {};
  }
}

function writeDraftStore(store) {
  ensureRuntimeStore();
  fs.writeFileSync(DRAFT_STORE_FILE, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function pruneDraftStore(store = readDraftStore()) {
  const cutoff = Date.now() - MAX_DRAFT_AGE_MS;
  let changed = false;
  const nextStore = {};

  for (const [draftId, record] of Object.entries(store || {})) {
    const timestamp = new Date(record?.updatedAt || record?.createdAt || 0).getTime();
    if (Number.isFinite(timestamp) && timestamp >= cutoff) {
      nextStore[draftId] = record;
    } else {
      changed = true;
    }
  }

  if (changed) {
    writeDraftStore(nextStore);
  }

  return nextStore;
}

function getDraftRecord(draftId) {
  if (!draftId) return null;
  const store = pruneDraftStore();
  return store[draftId] || null;
}

function upsertDraftRecord(draftId, updater) {
  const cleanDraftId = safeText(draftId, 120);
  if (!cleanDraftId) {
    throw new Error('Ontbrekend concept-ID.');
  }

  const store = pruneDraftStore();
  const now = new Date().toISOString();
  const existing = store[cleanDraftId] || {
    draftId: cleanDraftId,
    createdAt: now,
    data: {},
    payment: {},
  };
  const nextValue = updater(existing);
  store[cleanDraftId] = {
    ...existing,
    ...nextValue,
    draftId: cleanDraftId,
    updatedAt: now,
  };
  writeDraftStore(store);
  return store[cleanDraftId];
}

function getMailer() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildRecommendationLines(items) {
  const labels = ['Prijstip', 'Premium', 'Luxe'];
  return safeArray(items, 6, 180)
    .map((item, index) => `  ${labels[index] || `Optie ${index + 1}`}: ${item}`)
    .join('\n');
}

function buildSalonMailBody(data = {}) {
  const aanbevelingen = buildRecommendationLines(data.aanbevelingen || []);

  return `
HAAR. Voedingsadvies — Intake betaald / rapport ontgrendeld
===========================================================

Klantgegevens:
  Concept-ID:   ${data.draftId || ''}
  Eigenaar:     ${data.ownerName || ''}
  E-mail:       ${data.catEmail || '(niet ingevuld)'}
  Naam kat:     ${data.catName || ''}
  Ras:          ${data.catRas || ''}
  Leeftijd:     ${data.catLeeftijd || ''}
  Geslacht:     ${data.geslacht || ''}
  Gewicht:      ${data.gewicht || ''} kg
  Lichaamsconditie: ${data.bcs || ''}
  Gecastreerd:  ${data.castrated === true ? 'Ja' : data.castrated === false ? 'Nee' : ''}
  Leefstijl:    ${data.leefstijl || ''}
  Activiteit:   ${data.activiteit || ''}
  Eetgedrag:    ${data.eetgedrag || ''}
  Drinkgedrag:  ${data.drinkgedrag || ''}
  Ontlasting:   ${data.ontlasting || ''}
  Vachtbeeld:   ${data.vachtbeeld || ''}
  Doelen:       ${(data.doelen || []).join(', ')}
  Voertype:     ${data.foodType || ''}
  Textuur:      ${(data.textuurPref || []).join(', ')}
  Budget:       ${data.budgetMax || ''}
  Profiel copy: ${data.primaryProfile || ''}
  Profiel app:  ${data.decisionProfile || ''}

Bijzonderheden:
${data.bijzonderheden || '(geen bijzonderheden ingevuld)'}

${aanbevelingen ? `Aanbevolen voedingen:\n${aanbevelingen}\n\n` : ''}---
Verstuurd via de HAAR. Voedingsadvies app
  `.trim();
}

async function sendSalonNotification(data = {}) {
  const transporter = getMailer();
  if (!transporter) {
    console.warn('[Email] SMTP_USER of SMTP_PASS ontbreekt. Salonnotificatie overgeslagen.');
    return { skipped: true };
  }

  await transporter.sendMail({
    from: `"HAAR. Voedingsadvies" <${process.env.SMTP_USER}>`,
    to: 'haarkattentrimsalon@gmail.com',
    subject: `Voedingsadvies: ${data.catName || 'kat'} van ${data.ownerName || 'klant'}`,
    text: buildSalonMailBody(data),
  });

  return { skipped: false };
}

async function maybeNotifySalonForDraft(draftId) {
  const record = getDraftRecord(draftId);
  if (!record || !record.payment?.paidAt || record.salonNotifiedAt) {
    return false;
  }

  await sendSalonNotification({
    draftId,
    ...(record.data || {}),
  });

  upsertDraftRecord(draftId, existing => ({
    ...existing,
    salonNotifiedAt: new Date().toISOString(),
  }));
  return true;
}

function markDraftPaymentStatus(draftId, paymentIntent) {
  if (!draftId || !paymentIntent) return null;
  return upsertDraftRecord(draftId, existing => ({
    ...existing,
    payment: {
      ...(existing.payment || {}),
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      paidAt: paymentIntent.status === 'succeeded'
        ? ((existing.payment || {}).paidAt || new Date().toISOString())
        : (existing.payment || {}).paidAt,
      lastStripeUpdateAt: new Date().toISOString(),
      receiptEmail: safeText(paymentIntent.receipt_email, 200),
    },
  }));
}

function sendHtmlPage(res, fileName) {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(ROOT_DIR, fileName));
}

function getRequestFingerprint(req) {
  return String(req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
}

function cleanupRateLimitState(now = Date.now()) {
  for (const [key, entry] of RATE_LIMIT_STATE.entries()) {
    if (entry.resetAt <= now) {
      RATE_LIMIT_STATE.delete(key);
    }
  }
}

function rateLimit({ keyPrefix, windowMs, max, message }) {
  return (req, res, next) => {
    const now = Date.now();
    cleanupRateLimitState(now);

    const key = `${keyPrefix}:${getRequestFingerprint(req)}`;
    const existing = RATE_LIMIT_STATE.get(key);
    if (!existing || existing.resetAt <= now) {
      RATE_LIMIT_STATE.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((existing.resetAt - now) / 1000))));
      return res.status(429).json({
        error: message || 'Er worden tijdelijk te veel aanvragen verstuurd. Probeer het zo opnieuw.',
      });
    }

    existing.count += 1;
    RATE_LIMIT_STATE.set(key, existing);
    next();
  };
}

function isAllowedOrigin(req) {
  const origin = req.get('origin');
  if (!origin) return true;

  try {
    const parsedOrigin = new URL(origin);
    const requestHost = req.get('host');
    if (requestHost && parsedOrigin.host === requestHost) {
      return true;
    }
    return ALLOWED_ORIGINS.has(parsedOrigin.origin);
  } catch (err) {
    return false;
  }
}

function requireSameOrigin(req, res, next) {
  if (isAllowedOrigin(req)) {
    return next();
  }
  return res.status(403).json({ error: 'Deze aanvraag is niet toegestaan vanaf deze herkomst.' });
}

function setSecurityHeaders(req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "connect-src 'self' https://*.stripe.com https://m.stripe.network",
      "frame-src 'self' https://*.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.stripe.com",
      "frame-ancestors 'self'",
    ].join('; ')
  );
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

// ----------------------------------------------------------------
//  Stripe Webhook
//  Moet voor express.json() staan zodat Stripe de raw body krijgt
// ----------------------------------------------------------------
app.use(setSecurityHeaders);
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook is niet geconfigureerd.' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Webhook] Verificatie mislukt:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.processing') {
      const paymentIntent = event.data.object;
      const draftId = safeText(paymentIntent.metadata?.draftId, 120);
      markDraftPaymentStatus(draftId, paymentIntent);

      if (event.type === 'payment_intent.succeeded' && draftId) {
        await maybeNotifySalonForDraft(draftId);
      }

      console.log(`[Webhook] Stripe update: ${paymentIntent.id} (${paymentIntent.status})`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Verwerking mislukt:', err.message);
    res.status(500).json({ error: 'Webhook kon niet worden verwerkt.' });
  }
});

// JSON parser pas na de webhook
app.use(express.json({ limit: '1mb' }));

// ----------------------------------------------------------------
//  Publieke statische bestanden: alleen whitelisted mappen / bestanden
// ----------------------------------------------------------------
STATIC_DIRS.forEach(([mountPath, dirPath]) => {
  if (fs.existsSync(dirPath)) {
    app.use(`/${mountPath}`, express.static(dirPath));
  }
});

app.get('/vendor/html2canvas.min.js', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'node_modules', 'html2canvas', 'dist', 'html2canvas.min.js'));
});

app.get('/vendor/jspdf.umd.min.js', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'node_modules', 'jspdf', 'dist', 'jspdf.umd.min.js'));
});

Object.entries(HTML_ROUTES).forEach(([route, fileName]) => {
  app.get(route, (req, res) => sendHtmlPage(res, fileName));
});

// ----------------------------------------------------------------
//  POST /api/save-draft
//  Body: intakegegevens uit de wizard
// ----------------------------------------------------------------
app.post('/api/save-draft', requireSameOrigin, rateLimit({
  keyPrefix: 'save-draft',
  windowMs: 15 * 60 * 1000,
  max: 80,
}), async (req, res) => {
  try {
    const payload = sanitizeDraftPayload(req.body || {});
    if (!payload.draftId) {
      return res.status(400).json({ error: 'Ontbrekend concept-ID.' });
    }

    const saved = upsertDraftRecord(payload.draftId, existing => ({
      ...existing,
      data: {
        ...(existing.data || {}),
        ...payload,
      },
    }));

    res.json({
      ok: true,
      draftId: payload.draftId,
      updatedAt: saved.updatedAt,
    });
  } catch (err) {
    console.error('[DraftStore] Opslaan mislukt:', err.message);
    res.status(500).json({ error: 'Concept kon niet worden opgeslagen.' });
  }
});

// ----------------------------------------------------------------
//  POST /api/create-payment-intent
//  Body: { email, ownerName, catName, draftId }
// ----------------------------------------------------------------
app.post('/api/create-payment-intent', requireSameOrigin, rateLimit({
  keyPrefix: 'create-payment-intent',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Er zijn tijdelijk te veel betaalpogingen gestart. Wacht heel even en probeer het opnieuw.'
}), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is op dit moment niet beschikbaar.' });
    }

    const email = safeEmail(req.body?.email);
    const ownerName = safeText(req.body?.ownerName, 160);
    const catName = safeText(req.body?.catName, 160);
    const draftId = safeText(req.body?.draftId, 120);

    if (!draftId) {
      return res.status(400).json({ error: 'Intake niet gevonden. Vul eerst de vragen in.' });
    }

    upsertDraftRecord(draftId, existing => ({
      ...existing,
      data: {
        ...(existing.data || {}),
        draftId,
        ...(ownerName ? { ownerName } : {}),
        ...(catName ? { catName } : {}),
        ...(email ? { catEmail: email } : {}),
      },
      payment: {
        ...(existing.payment || {}),
        lastIntentRequestedAt: new Date().toISOString(),
      },
    }));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1499,
      currency: 'eur',
      payment_method_types: ['ideal', 'card'],
      description: 'HAAR. Voedingsadviesplan — persoonlijk kattenvoeradvies',
      ...(email && { receipt_email: email }),
      metadata: {
        product: 'voedingsadviesplan',
        prijs: '14.99',
        website: 'haar-voedingsadvies',
        ...(ownerName ? { ownerName } : {}),
        ...(catName ? { catName } : {}),
        draftId,
      },
    });

    upsertDraftRecord(draftId, existing => ({
      ...existing,
      payment: {
        ...(existing.payment || {}),
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        lastStripeUpdateAt: new Date().toISOString(),
      },
    }));

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[Stripe] Fout bij aanmaken PaymentIntent:', err.message);
    res.status(500).json({ error: err.message || 'PaymentIntent kon niet worden aangemaakt.' });
  }
});

// ----------------------------------------------------------------
//  POST /api/confirm-payment
//  Body: { draftId, paymentIntentId }
//  Verifieert server-side dat de betaling is geslaagd
// ----------------------------------------------------------------
app.post('/api/confirm-payment', requireSameOrigin, rateLimit({
  keyPrefix: 'confirm-payment',
  windowMs: 15 * 60 * 1000,
  max: 20,
}), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is op dit moment niet beschikbaar.' });
    }

    const draftId = safeText(req.body?.draftId, 120);
    const paymentIntentId = safeText(req.body?.paymentIntentId, 120);

    if (!draftId || !paymentIntentId) {
      return res.status(400).json({ error: 'Betaling kan niet worden bevestigd zonder concept-ID en PaymentIntent-ID.' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const linkedDraftId = safeText(paymentIntent.metadata?.draftId, 120);

    if (!linkedDraftId || linkedDraftId !== draftId) {
      return res.status(400).json({ error: 'Deze betaling hoort niet bij deze intake.' });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(409).json({
        error: paymentIntent.status === 'processing'
          ? 'Deze betaling wordt nog verwerkt.'
          : 'De betaling is nog niet afgerond.',
        status: paymentIntent.status,
      });
    }

    markDraftPaymentStatus(draftId, paymentIntent);
    await maybeNotifySalonForDraft(draftId);

    res.json({
      ok: true,
      status: paymentIntent.status,
      unlocked: true,
    });
  } catch (err) {
    console.error('[Stripe] Betaling bevestigen mislukt:', err.message);
    res.status(500).json({ error: 'Betaling kon niet server-side worden bevestigd.' });
  }
});

// ----------------------------------------------------------------
//  GET /api/preview-data
//  Publieke previewdata voor de zichtbare voerkaarten in stap 6
// ----------------------------------------------------------------
app.get('/api/preview-data', rateLimit({
  keyPrefix: 'preview-data',
  windowMs: 15 * 60 * 1000,
  max: 120,
}), async (req, res) => {
  try {
    const brokText = fs.readFileSync(BROK_CSV_FILE, 'utf8');
    const natvoerText = fs.readFileSync(NATVOER_CSV_FILE, 'utf8');

    res.json({
      brokText,
      natvoerText,
    });
  } catch (err) {
    console.error('[PreviewData] Laden mislukt:', err.message);
    res.status(500).json({ error: 'Previewdata kon niet worden geladen.' });
  }
});

// ----------------------------------------------------------------
//  GET /api/report-data?draftId=...
//  Alleen beschikbaar na bevestigde betaling
// ----------------------------------------------------------------
app.get('/api/report-data', rateLimit({
  keyPrefix: 'report-data',
  windowMs: 15 * 60 * 1000,
  max: 60,
}), async (req, res) => {
  try {
    const draftId = safeText(req.query?.draftId, 120);
    if (!draftId) {
      return res.status(400).json({ error: 'Ontbrekend concept-ID.' });
    }

    const record = getDraftRecord(draftId);
    if (!record || !record.payment?.paidAt) {
      return res.status(403).json({ error: 'Rapportdata is pas beschikbaar na een bevestigde betaling.' });
    }

    const brokText = fs.readFileSync(BROK_CSV_FILE, 'utf8');
    const natvoerText = fs.readFileSync(NATVOER_CSV_FILE, 'utf8');

    upsertDraftRecord(draftId, existing => ({
      ...existing,
      reportAccessedAt: new Date().toISOString(),
    }));

    res.json({
      brokText,
      natvoerText,
    });
  } catch (err) {
    console.error('[ReportData] Laden mislukt:', err.message);
    res.status(500).json({ error: 'Rapportdata kon niet worden geladen.' });
  }
});

// ----------------------------------------------------------------
//  POST /api/email-report
//  Stuur het rapport als PDF-bijlage naar de klant
// ----------------------------------------------------------------
app.post('/api/email-report', requireSameOrigin, rateLimit({
  keyPrefix: 'email-report',
  windowMs: 15 * 60 * 1000,
  max: 6,
}), async (req, res) => {
  try {
    const catEmail  = String(req.body?.catEmail  || '').trim();
    const ownerName = String(req.body?.ownerName || 'Klant').trim().slice(0, 120);
    const catName   = String(req.body?.catName   || 'uw kat').trim().slice(0, 120);
    const pdfBase64 = String(req.body?.pdfBase64 || '').trim();

    if (!catEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(catEmail)) {
      return res.status(400).json({ error: 'Ongeldig e-mailadres.' });
    }
    if (!pdfBase64 || pdfBase64.length < 100) {
      return res.status(400).json({ error: 'Geen geldig PDF-bestand ontvangen.' });
    }
    // Reject unreasonably large payloads (~5 MB decoded = ~7 MB base64)
    if (pdfBase64.length > 7 * 1024 * 1024) {
      return res.status(400).json({ error: 'PDF te groot.' });
    }

    const transporter = getMailer();
    if (!transporter) {
      return res.status(503).json({ error: 'E-mail is momenteel niet beschikbaar.' });
    }

    const safeFileName = `Voedingsadvies-${catName.replace(/[^a-z0-9\-]/gi, '-')}.pdf`;
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    await transporter.sendMail({
      from: `"HAAR. Centrum voor kattenwelzijn" <${process.env.SMTP_USER}>`,
      to: catEmail,
      bcc: 'haarkattentrimsalon@gmail.com',
      subject: `Uw persoonlijk voedingsadvies voor ${catName}`,
      text: [
        `Beste ${ownerName},`,
        '',
        `Bijgaand ontvangt u het persoonlijk voedingsadviesplan voor ${catName}, opgesteld door HAAR. Centrum voor kattenwelzijn.`,
        '',
        'Het rapport bevat:',
        '- Uw persoonlijk profiel',
        '- Voedingsaanbevelingen (Prijstip, Premium en Luxe)',
        '- Een praktisch voer- en overstapplan',
        '',
        'Voor vragen kunt u altijd contact opnemen.',
        '',
        'Met vriendelijke groet,',
        'HAAR. Centrum voor kattenwelzijn',
      ].join('\n'),
      attachments: [{
        filename: safeFileName,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[EmailReport] Fout:', err.message);
    res.status(500).json({ error: 'PDF-mail kon niet worden verzonden.' });
  }
});

// ----------------------------------------------------------------
//  POST /api/send-report-email
//  Handmatige fallback / update vanuit de client
// ----------------------------------------------------------------
app.post('/api/send-report-email', requireSameOrigin, rateLimit({
  keyPrefix: 'send-report-email',
  windowMs: 15 * 60 * 1000,
  max: 12,
}), async (req, res) => {
  try {
    const payload = sanitizeDraftPayload(req.body || {});
    const draftId = payload.draftId;
    const aanbevelingen = safeArray(req.body?.aanbevelingen, 6, 180);
    const forceResend = req.body?.forceResend === true;

    if (!draftId) {
      return res.status(400).json({ error: 'Ontbrekend concept-ID.' });
    }

    const saved = upsertDraftRecord(draftId, existing => ({
      ...existing,
      data: {
        ...(existing.data || {}),
        ...payload,
        ...(aanbevelingen.length ? { aanbevelingen } : {}),
      },
    }));

    if (saved.salonNotifiedAt && !forceResend) {
      return res.json({ ok: true, skipped: true });
    }

    await sendSalonNotification({
      draftId,
      ...(saved.data || {}),
      ...(aanbevelingen.length ? { aanbevelingen } : {}),
    });

    upsertDraftRecord(draftId, existing => ({
      ...existing,
      salonNotifiedAt: new Date().toISOString(),
    }));

    res.json({ ok: true, skipped: false });
  } catch (err) {
    console.error('[Email] Fout:', err.message);
    res.status(500).json({ error: 'E-mail kon niet worden verzonden.' });
  }
});

// ----------------------------------------------------------------
//  Start server (lokaal) of exporteer voor Vercel serverless
// ----------------------------------------------------------------
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\nHAAR. server actief op http://localhost:${PORT}`);
    console.log(`Stripe modus: ${STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'TEST'}\n`);
  });
}

module.exports = app;
