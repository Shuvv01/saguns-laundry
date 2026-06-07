import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';
const whatsappNumber = '9779851332353';
const displayPhone = '+977 9851332353';
const imadolMapUrl = 'https://www.google.com/maps/place/Sagun%E2%80%99s+Laundry+(Imadole+Branch)/@27.6535661,85.2990485,14z/data=!4m10!1m2!2m1!1ssagun+laundry+imadol+branch!3m6!1s0x39eb17003e6c4097:0xfcb8501b58837524!8m2!3d27.6535661!4d85.3371573!15sChtzYWd1biBsYXVuZHJ5IGltYWRvbCBicmFuY2haHSIbc2FndW4gbGF1bmRyeSBpbWFkb2wgYnJhbmNokgEPbGF1bmRyeV9zZXJ2aWNlmgFEQ2k5RFFVbFJRVU52WkVOb2RIbGpSamx2VDJ4U00xUlZWWGhVYmxKTVkyNUZlbVJ0Um5saVYxWndWVEJuTW1SVlJSQULgAQD6AQQIABAT!16s%2Fg%2F11m754jd9x?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D';
const pickupMessage = "Hello Sagun's Laundry, I want to book a pickup. Please confirm pickup and delivery availability within 3 km of my nearest branch.";
const signupMessage = "Hello Sagun's Laundry, I want to create/verify my account through WhatsApp. Please confirm my signup and pickup availability.";

const homeServices = [
  ['&#x1F455;', 'Daily Wearable Clothes', 'NPR&nbsp;100', 'per&nbsp;kg', 'Regular everyday clothes washed, dried and folded for students, families and working professionals.', ['Machine Wash', 'Daily Wear', 'Neatly Folded', '24hr Turnaround']],
  ['&#x1F9FA;', 'Blanket Wash & Dry', 'NPR&nbsp;100', 'per&nbsp;kg', 'Heavy blankets and bedding washed and dried with practical machine support.', ['Blankets', 'Bedding', 'Wash & Dry', 'Seasonal Care']],
  ['&#x1F9E5;', 'Down Jacket Wash & Dry', 'From NPR&nbsp;150', 'per&nbsp;piece', 'Small, big and feather down jackets cleaned with extra care.', ['Small Jackets', 'Big Jackets', 'Feather Jackets', 'Winter Wear']]
];

const features = [
  ['&#x1F697;', 'Pickup & Delivery Nearby', 'Pickup and delivery are available within 3 km of each branch in Imadol, Nakhu and Hattiban.'],
  ['&#x26A1;', 'Fast 24hr Turnaround', 'Most orders returned within 24 hours. Express same-day service available on request.'],
  ['&#x1F48E;', 'Quality Guaranteed', 'Professional-grade equipment and premium detergents ensure clothes look their best.'],
  ['&#x1F4F1;', 'WhatsApp Updates', 'Booking, confirmation and order updates can be handled directly through WhatsApp.']
];

const pricingServices = [
  ['&#x1F455;', 'Daily Wearable Clothes', 'NPR 100', 'per kg', 'Everyday clothes washed, dried and folded for regular use.', ['Shirts', 'Pants', 'T-shirts', 'Daily Wear', 'Wash & Dry']],
  ['&#x1F9FA;', 'Blanket Wash & Dry', 'NPR 100', 'per kg', 'Blankets and bedding washed and dried with machine support.', ['Blankets', 'Bedding', 'Wash & Dry', 'Seasonal Care']],
  ['&#x1F9FA;', 'Fiber Blanket Wash & Dry', 'NPR 150', 'per kg', 'Fiber blankets cleaned and dried with extra care.', ['Fiber Blankets', 'Wash & Dry', 'Machine Support']],
  ['&#x1F6CC;', 'Sleeping Bags', 'NPR 500', 'per piece', 'Sleeping bags washed and dried for travel or seasonal use.', ['Sleeping Bags', 'Travel Gear', 'Deep Wash']],
  ['&#x1F9E5;', 'Down Jacket Wash & Dry', 'From NPR 150', 'per piece', 'Down jackets priced by size and material type.', ['Small - NPR 150', 'Big - NPR 170', 'Feather - NPR 200']]
];

const pricingRows = [
  ['Daily Wearable Clothes', 'NPR 100 / kg'],
  ['Blanket Wash & Dry', 'NPR 100 / kg'],
  ['Fiber Blanket Wash & Dry', 'NPR 150 / kg'],
  ['Sleeping Bags', 'NPR 500 / piece'],
  ['Down Jacket Wash & Dry - Small', 'NPR 150 / piece'],
  ['Down Jacket Wash & Dry - Big', 'NPR 170 / piece'],
  ['Down Jacket Wash & Dry - Feather', 'NPR 200 / piece']
];

const faqs = [
  ['Is there a minimum order?', 'For wash services, the minimum is 1&nbsp;kg. For ironing, even a single item is welcome.'],
  ['How long does it take?', 'Most regular wash and ironing orders are returned within 24&nbsp;hours. Express same-day service is available on request.'],
  ['Is pickup really free?', 'Pickup and delivery are available within 3&nbsp;km of each branch: Imadol, Nakhu and Hattiban. The team confirms availability on WhatsApp before pickup.'],
  ['Do you have current offers?', 'Yes. Orders of 20&nbsp;kg or above can receive a 10% discount, and eligible first visits or coupon bookings can also receive 10% off. Please confirm the offer on WhatsApp before pickup.'],
  ['How do I pay?', 'We accept cash on delivery. Online payment options are coming soon. You can also pay in-store at our Imadol location.'],
  ['Can I track my order?', 'Yes. For launch, orders are confirmed and updated through WhatsApp so you do not need a separate account system or database.'],
  ['What if my clothes are damaged?', 'We handle all garments with utmost care. In the rare event of any issue, please contact us within 24&nbsp;hours of delivery and we will resolve it immediately.']
];

function notFound(req, res) {
  res.status(404).send('Not found');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use((req, res, next) => {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "font-src 'self' https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "form-action 'self'"
  ];
  if (isProduction) csp.push('upgrade-insecure-requests');
  res.setHeader('Content-Security-Policy', csp.join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

const staticOptions = {
  dotfiles: 'ignore',
  index: false,
  maxAge: isProduction ? '1d' : 0
};
app.use('/css', express.static(path.join(__dirname, 'css'), staticOptions));
app.use('/js', express.static(path.join(__dirname, 'js'), staticOptions));
app.use('/assets', express.static(path.join(__dirname, 'assets'), staticOptions));
app.get(/^\/([^/\\]+\.(?:png|jpg|jpeg|webp|gif|svg|ico))$/i, (req, res) => {
  const fileName = path.basename(req.params[0]);
  const assetPath = path.join(__dirname, 'assets', fileName);
  if (!fs.existsSync(assetPath)) return notFound(req, res);
  res.sendFile(assetPath);
});

app.use((req, res, next) => {
  res.locals.csrf = crypto.randomBytes(16).toString('hex');
  res.locals.year = new Date().getFullYear();
  res.locals.today = new Date().toISOString().slice(0, 10);
  res.locals.isLoggedIn = false;
  res.locals.homeServices = homeServices;
  res.locals.features = features;
  res.locals.pricingServices = pricingServices;
  res.locals.pricingRows = pricingRows;
  res.locals.faqs = faqs;
  res.locals.stripTags = (value) => String(value ?? '').replace(/<[^>]*>/g, '');
  res.locals.whatsappNumber = whatsappNumber;
  res.locals.displayPhone = displayPhone;
  res.locals.imadolMapUrl = imadolMapUrl;
  res.locals.whatsappPickupUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(pickupMessage)}`;
  res.locals.whatsappSignupUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(signupMessage)}`;
  next();
});

app.get(['/', '/index.php'], (req, res) => {
  res.render('index', { userName: '', firstName: 'Guest' });
});
app.get(['/pricing', '/pricing.php'], (req, res) => res.render('pricing'));
app.get('/register.php', (req, res) => res.render('register'));

app.get(['/login.php', '/forgot-password.php', '/dashboard.php'], notFound);

app.use('/admin', notFound);
app.use('/php', (req, res) => {
  res.status(404).json({ error: 'Backend API disabled. Public launch flow uses WhatsApp.' });
});

app.use(notFound);

app.listen(PORT, () => {
  console.log(`Sagun's Laundry public site running at http://localhost:${PORT}`);
  console.log('Admin panel, customer dashboard, and backend APIs are disabled.');
  console.log('Customer bookings are handed off through WhatsApp.');
});
