import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import express from 'express';
import session from 'express-session';
import { DataStore } from './lib/dataStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3001);
const store = new DataStore(path.join(__dirname, 'data', 'db.json'));
const logsDir = path.join(__dirname, 'logs');
const whatsappNumber = '9779851302350';
const pickupMessage = "Hello Sagun's Laundry, I want to book a pickup. Please confirm pickup and delivery availability within 3 km of my nearest branch.";
const signupMessage = "Hello Sagun's Laundry, I want to create/verify my account through WhatsApp. Please confirm my signup and pickup availability.";

fs.mkdirSync(logsDir, { recursive: true });

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
  ['&#x1F9CC;', 'Fiber Blanket Wash & Dry', 'NPR 150', 'per kg', 'Fiber blankets cleaned and dried with extra care.', ['Fiber Blankets', 'Wash & Dry', 'Machine Support']],
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

const adminStatDefs = [
  ['&#x1F4B0;', 'Today Revenue'],
  ['&#x1F4C5;', 'Month Revenue'],
  ['&#x1F48E;', 'Total Revenue'],
  ['&#x1F4CB;', 'Total Orders'],
  ['&#x1F4E6;', 'Today Orders'],
  ['&#x23F3;', 'Pending'],
  ['&#x1F465;', 'Customers']
];

const statuses = ['pending', 'confirmed', 'picked_up', 'in_process', 'ready', 'delivered', 'cancelled'];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'saguns-laundry-local-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get(/^\/(.+\.(?:png|jpg|jpeg|webp|gif|svg|ico))$/i, (req, res) => {
  res.sendFile(path.join(__dirname, req.params[0]));
});

app.use((req, res, next) => {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(32).toString('hex');
  res.locals.csrf = req.session.csrf;
  res.locals.year = new Date().getFullYear();
  res.locals.today = new Date().toISOString().slice(0, 10);
  res.locals.isLoggedIn = Boolean(req.session.user);
  res.locals.homeServices = homeServices;
  res.locals.features = features;
  res.locals.pricingServices = pricingServices;
  res.locals.pricingRows = pricingRows;
  res.locals.faqs = faqs;
  res.locals.adminStatDefs = adminStatDefs;
  res.locals.stripTags = (value) => String(value ?? '').replace(/<[^>]*>/g, '');
  res.locals.whatsappNumber = whatsappNumber;
  res.locals.whatsappPickupUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(pickupMessage)}`;
  res.locals.whatsappSignupUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(signupMessage)}`;
  next();
});

function json(res, body, status = 200) {
  res.status(status).json(body);
}

function clean(value, max = 2000) {
  return String(value ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max);
}

function email(value) {
  const text = String(value ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : '';
}

function requireCsrf(req, res, next) {
  const token = req.body.csrf_token || req.get('x-csrf-token');
  if (!token || token !== req.session.csrf) return json(res, { error: 'Invalid security token. Refresh and try again.' }, 403);
  next();
}

function requireUser(req, res, next) {
  if (!req.session.user) return res.redirect('/login.php');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect('/admin/login.php');
  next();
}

function requireUserApi(req, res, next) {
  if (!req.session.user) return json(res, { error: 'Authentication required' }, 401);
  next();
}

function requireAdminApi(req, res, next) {
  if (!req.session.admin) return json(res, { error: 'Admin authentication required' }, 401);
  next();
}

function orderNumber() {
  return `SGL-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`;
}

function otp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function isExpired(date) {
  return !date || new Date(date).getTime() < Date.now();
}

function logMail(subject, to, message) {
  const line = `${new Date().toISOString()} | ${to} | ${subject} | ${message}\n`;
  fs.appendFileSync(path.join(logsDir, 'mail.log'), line);
  console.log(`[mail] ${subject} for ${to}: ${message}`);
}

function userPayload(user) {
  return { id: user.id, name: user.full_name, email: user.email };
}

function adminPayload(admin) {
  return { id: admin.id, name: admin.username };
}

function publicOrder(order) {
  return {
    ...order,
    item_count: store.data.order_items.filter((item) => item.order_id === order.id).length
  };
}

function orderDetails(order) {
  const items = store.data.order_items
    .filter((item) => item.order_id === order.id)
    .map((item) => ({
      ...item,
      service_name: store.data.services.find((svc) => svc.id === item.service_id)?.name || 'Service'
    }));
  const history = store.data.order_status_history.filter((item) => item.order_id === order.id);
  return { ...order, items, history };
}

function renderHome(req, res) {
  const name = req.session.user?.name || '';
  res.render('index', {
    userName: name,
    firstName: (name || 'User').split(' ')[0]
  });
}

app.get(['/', '/index.php'], renderHome);
app.get(['/pricing', '/pricing.php'], (req, res) => res.render('pricing'));

app.get('/login.php', (req, res) => {
  res.redirect('/register.php');
});

app.get('/register.php', (req, res) => {
  res.render('register');
});

app.get('/forgot-password.php', (req, res) => {
  res.redirect('/register.php');
});

app.get('/dashboard.php', requireUser, (req, res) => {
  const tabs = ['overview', 'order', 'orders', 'profile', 'password'];
  const activeTab = tabs.includes(req.query.tab) ? req.query.tab : 'overview';
  const pageTitles = { overview: 'Overview', order: 'New Order', orders: 'My Orders', profile: 'My Profile', password: 'Change Password' };
  const userName = req.session.user.name || 'User';
  res.render('dashboard', {
    activeTab,
    pageTitle: pageTitles[activeTab],
    userName,
    userEmail: req.session.user.email,
    firstName: userName.split(' ')[0],
    userInitial: userName.slice(0, 1).toUpperCase()
  });
});

app.get('/admin/login.php', (req, res) => {
  if (req.session.admin) return res.redirect('/admin/index.php');
  res.render('admin/login');
});

app.get(['/admin', '/admin/'], (req, res) => {
  res.redirect(req.session.admin ? '/admin/index.php' : '/admin/login.php');
});

app.get('/admin/index.php', requireAdmin, (req, res) => {
  const tabs = ['dashboard', 'orders', 'messages', 'password'];
  const activeTab = tabs.includes(req.query.tab) ? req.query.tab : 'dashboard';
  const titles = { dashboard: 'Dashboard', orders: 'All Orders', messages: 'Messages', password: 'Change Password' };
  const adminName = req.session.admin.name || 'Admin';
  res.render('admin/index', {
    activeTab,
    pageTitle: titles[activeTab],
    adminName,
    adminInit: adminName.slice(0, 1).toUpperCase()
  });
});

app.post('/php/auth.php', (req, res) => {
  const action = req.body.action || '';
  if (action === 'logout') {
    req.session.user = null;
    return json(res, { success: true, redirect: 'login.php' });
  }
  requireCsrf(req, res, () => handleAuth(req, res, action));
});

function handleAuth(req, res, action) {
  if (action === 'register') {
    const fullName = clean(req.body.full_name, 100);
    const userEmail = email(req.body.email);
    const phone = clean(req.body.phone, 20);
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirm_password || '');
    if (!fullName || !userEmail || !password) return json(res, { error: 'All required fields must be filled' }, 400);
    if (password.length < 8) return json(res, { error: 'Password must be at least 8 characters' }, 400);
    if (password !== confirm) return json(res, { error: 'Passwords do not match' }, 400);

    let user = store.data.users.find((item) => item.email === userEmail);
    if (user?.is_verified) return json(res, { error: 'An account with this email already exists. Please login or use forgot password.' }, 409);

    const code = otp();
    const patch = {
      full_name: fullName,
      email: userEmail,
      phone,
      password_hash: bcrypt.hashSync(password, 12),
      is_verified: 0,
      otp_code: code,
      otp_expires_at: minutesFromNow(15)
    };
    user = user ? store.update('users', user.id, patch) : store.insert('users', patch);
    logMail('OTP', userEmail, code);
    return json(res, { success: true, message: 'Registration successful. OTP generated for local development only.', email: userEmail, dev_otp: code });
  }

  if (action === 'verify_otp') {
    const userEmail = email(req.body.email);
    const code = String(req.body.otp || '').replace(/\D/g, '');
    const user = store.data.users.find((item) => item.email === userEmail);
    if (!user || user.is_verified) return json(res, { error: 'Verification failed. Please re-register.' }, 400);
    if (isExpired(user.otp_expires_at)) return json(res, { error: 'OTP expired. Request a new one.' }, 400);
    if (user.otp_code !== code) return json(res, { error: 'Invalid OTP. Please try again.' }, 400);
    store.update('users', user.id, { is_verified: 1, otp_code: null, otp_expires_at: null });
    return json(res, { success: true, message: 'Email verified! You can now login.' });
  }

  if (action === 'resend_otp') {
    const userEmail = email(req.body.email);
    const user = store.data.users.find((item) => item.email === userEmail);
    if (!user || user.is_verified) return json(res, { success: true, message: 'If applicable, a new OTP has been sent.' });
    const code = otp();
    store.update('users', user.id, { otp_code: code, otp_expires_at: minutesFromNow(15) });
    logMail('OTP', userEmail, code);
    return json(res, { success: true, message: 'New OTP sent to your email.', dev_otp: code });
  }

  if (action === 'login') {
    const userEmail = email(req.body.email);
    const password = String(req.body.password || '');
    const user = store.data.users.find((item) => item.email === userEmail);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return json(res, { error: 'Invalid email or password' }, 401);
    if (!user.is_verified) return json(res, { error: 'Please verify your email before logging in.', needs_verification: true, email: userEmail }, 403);
    req.session.user = userPayload(user);
    return json(res, { success: true, message: 'Login successful!', redirect: 'dashboard.php' });
  }

  if (action === 'forgot') {
    const userEmail = email(req.body.email);
    const user = store.data.users.find((item) => item.email === userEmail && item.is_verified);
    if (user) {
      const code = otp();
      store.update('users', user.id, { otp_code: code, otp_expires_at: minutesFromNow(15) });
      logMail('Password reset OTP', userEmail, code);
    }
    return json(res, { success: true, message: 'If that email is registered and verified, a reset OTP has been sent.', email: userEmail });
  }

  if (action === 'reset') {
    const userEmail = email(req.body.email);
    const code = String(req.body.otp || '').replace(/\D/g, '');
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirm_password || '');
    const user = store.data.users.find((item) => item.email === userEmail);
    if (password !== confirm) return json(res, { error: 'Passwords do not match' }, 400);
    if (password.length < 8) return json(res, { error: 'Password must be at least 8 characters' }, 400);
    if (!user || isExpired(user.otp_expires_at) || user.otp_code !== code) return json(res, { error: 'Invalid or expired OTP. Please request a new one.' }, 400);
    store.update('users', user.id, { password_hash: bcrypt.hashSync(password, 12), otp_code: null, otp_expires_at: null });
    return json(res, { success: true, message: 'Password reset successful! You can now login.' });
  }

  return json(res, { error: 'Invalid action' }, 400);
}

app.post('/php/contact.php', requireCsrf, (req, res) => {
  const name = clean(req.body.name, 100);
  const message = clean(req.body.message, 2000);
  if (name.length < 2) return json(res, { error: 'Name is required' }, 400);
  if (message.length < 5) return json(res, { error: 'Message is required' }, 400);
  store.insert('contact_messages', {
    name,
    email: email(req.body.email) || '',
    phone: clean(req.body.phone, 20),
    message,
    is_read: 0
  });
  json(res, { success: true, message: "Message sent! We'll get back to you soon." });
});

app.get('/php/orders.php', requireUserApi, (req, res) => {
  const action = req.query.action || '';
  const userId = req.session.user.id;
  if (action === 'get_services') {
    return json(res, { success: true, services: store.data.services.filter((svc) => svc.is_active) });
  }
  if (action === 'get_orders') {
    const orders = store.data.orders
      .filter((order) => order.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(publicOrder);
    return json(res, { success: true, orders, total: orders.length, pages: 1 });
  }
  if (action === 'get_order') {
    const order = store.data.orders.find((item) => item.id === Number(req.query.id) && item.user_id === userId);
    if (!order) return json(res, { error: 'Order not found' }, 404);
    return json(res, { success: true, order: orderDetails(order) });
  }
  json(res, { error: 'Invalid action' }, 400);
});

app.post('/php/orders.php', requireUserApi, requireCsrf, (req, res) => {
  if (req.body.action !== 'place') return json(res, { error: 'Invalid action' }, 400);
  const items = JSON.parse(req.body.items || '[]');
  if (!Array.isArray(items) || !items.length) return json(res, { error: 'No items in order' }, 400);
  const validated = [];
  let total = 0;
  for (const item of items) {
    const service = store.data.services.find((svc) => svc.id === Number(item.service_id) && svc.is_active);
    const quantity = Number(item.quantity || 0);
    if (!service || quantity <= 0 || quantity > 500) continue;
    const subtotal = Number((quantity * service.price).toFixed(2));
    total += subtotal;
    validated.push({ service_id: service.id, quantity, unit_price: service.price, subtotal });
  }
  if (!validated.length) return json(res, { error: 'No valid items in order' }, 400);

  const pickup = clean(req.body.pickup_address, 500);
  if (!pickup) return json(res, { error: 'Pickup address is required' }, 400);

  const order = store.insert('orders', {
    order_number: orderNumber(),
    user_id: req.session.user.id,
    total_amount: Number(total.toFixed(2)),
    status: 'pending',
    pickup_address: pickup,
    delivery_address: clean(req.body.delivery_address, 500),
    pickup_date: clean(req.body.pickup_date, 20) || null,
    delivery_date: clean(req.body.delivery_date, 20) || null,
    notes: clean(req.body.notes, 1000),
    payment_method: ['cash', 'online'].includes(req.body.payment_method) ? req.body.payment_method : 'cash',
    payment_status: 'pending'
  });

  for (const item of validated) {
    store.insert('order_items', { order_id: order.id, ...item });
  }
  store.insert('order_status_history', { order_id: order.id, status: 'pending', note: 'Order placed by customer', changed_at: new Date().toISOString() });
  logMail('Order status', req.session.user.email, `${order.order_number} is pending`);
  json(res, { success: true, message: 'Order placed successfully!', order_number: order.order_number, order_id: order.id, total: order.total_amount });
});

app.get('/php/profile.php', requireUserApi, (req, res) => {
  if (req.query.action !== 'get') return json(res, { error: 'Invalid action' }, 400);
  const user = store.data.users.find((item) => item.id === req.session.user.id);
  if (!user) return json(res, { error: 'User not found' }, 404);
  json(res, { success: true, user: { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone, address: user.address || '', created_at: user.created_at } });
});

app.post('/php/profile.php', requireUserApi, requireCsrf, (req, res) => {
  const user = store.data.users.find((item) => item.id === req.session.user.id);
  if (!user) return json(res, { error: 'User not found' }, 404);
  if (req.body.action === 'update') {
    const fullName = clean(req.body.full_name, 100);
    if (!fullName) return json(res, { error: 'Name is required' }, 400);
    const updated = store.update('users', user.id, { full_name: fullName, phone: clean(req.body.phone, 20), address: clean(req.body.address, 500) });
    req.session.user = userPayload(updated);
    return json(res, { success: true, message: 'Profile updated successfully!' });
  }
  if (req.body.action === 'change_password') {
    const current = String(req.body.current_password || '');
    const nextPassword = String(req.body.new_password || '');
    const confirm = String(req.body.confirm_password || '');
    if (!bcrypt.compareSync(current, user.password_hash)) return json(res, { error: 'Current password is incorrect' }, 400);
    if (nextPassword !== confirm) return json(res, { error: 'New passwords do not match' }, 400);
    if (nextPassword.length < 8) return json(res, { error: 'Password must be at least 8 characters' }, 400);
    store.update('users', user.id, { password_hash: bcrypt.hashSync(nextPassword, 12) });
    return json(res, { success: true, message: 'Password changed successfully!' });
  }
  json(res, { error: 'Invalid action' }, 400);
});

app.post('/php/admin_api.php', (req, res) => {
  const action = req.body.action || '';
  if (action === 'admin_logout') {
    req.session.admin = null;
    return json(res, { success: true, redirect: 'login.php' });
  }
  if (action === 'admin_login') {
    return requireCsrf(req, res, () => {
      const username = clean(req.body.username, 150);
      const password = String(req.body.password || '');
      const admin = store.data.admins.find((item) => item.username === username || item.email === username.toLowerCase());
      if (!admin || !bcrypt.compareSync(password, admin.password_hash)) return json(res, { error: 'Invalid credentials' }, 401);
      req.session.admin = adminPayload(admin);
      json(res, { success: true, redirect: 'index.php' });
    });
  }
  requireAdminApi(req, res, () => requireCsrf(req, res, () => handleAdminPost(req, res, action)));
});

function handleAdminPost(req, res, action) {
  if (action === 'update_status') {
    const order = store.data.orders.find((item) => item.id === Number(req.body.order_id));
    const status = clean(req.body.status, 30);
    if (!order) return json(res, { error: 'Order not found' }, 404);
    if (!statuses.includes(status)) return json(res, { error: 'Invalid status' }, 400);
    store.update('orders', order.id, { status });
    store.insert('order_status_history', { order_id: order.id, status, note: clean(req.body.note, 500), changed_at: new Date().toISOString() });
    const user = store.data.users.find((item) => item.id === order.user_id);
    if (user) logMail('Order status', user.email, `${order.order_number} is ${status}`);
    return json(res, { success: true, message: 'Status updated and customer notified.' });
  }
  if (action === 'change_password') {
    const admin = store.data.admins.find((item) => item.id === req.session.admin.id);
    const current = String(req.body.current_password || '');
    const nextPassword = String(req.body.new_password || '');
    const confirm = String(req.body.confirm_password || '');
    if (!bcrypt.compareSync(current, admin.password_hash)) return json(res, { error: 'Current password is incorrect' }, 400);
    if (nextPassword !== confirm) return json(res, { error: 'Passwords do not match' }, 400);
    if (nextPassword.length < 8) return json(res, { error: 'Min 8 characters' }, 400);
    store.update('admins', admin.id, { password_hash: bcrypt.hashSync(nextPassword, 12) });
    return json(res, { success: true, message: 'Password updated successfully!' });
  }
  json(res, { error: 'Invalid action' }, 400);
}

app.get('/php/admin_api.php', requireAdminApi, (req, res) => {
  const action = req.query.action || '';
  if (action === 'get_orders') {
    const search = clean(req.query.search, 120).toLowerCase();
    const status = statuses.includes(req.query.status) ? req.query.status : '';
    let orders = store.data.orders.map((order) => {
      const user = store.data.users.find((item) => item.id === order.user_id) || {};
      return {
        ...publicOrder(order),
        customer_name: user.full_name || '',
        customer_email: user.email || '',
        customer_phone: user.phone || ''
      };
    });
    if (status) orders = orders.filter((order) => order.status === status);
    if (search) {
      orders = orders.filter((order) => [order.order_number, order.customer_name, order.customer_email].some((value) => String(value).toLowerCase().includes(search)));
    }
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return json(res, { success: true, orders, total: orders.length, pages: 1 });
  }

  if (action === 'get_messages') {
    const messages = [...store.data.contact_messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
    return json(res, { success: true, messages });
  }

  if (action === 'get_dashboard') {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const validOrders = store.data.orders.filter((order) => order.status !== 'cancelled');
    const sum = (items) => items.reduce((total, order) => total + Number(order.total_amount || 0), 0);
    const statusCounts = statuses.map((status) => ({
      status,
      count: store.data.orders.filter((order) => order.status === status).length
    }));
    const recentRevenueMap = new Map();
    validOrders.forEach((order) => {
      const date = String(order.created_at).slice(0, 10);
      recentRevenueMap.set(date, (recentRevenueMap.get(date) || 0) + Number(order.total_amount || 0));
    });
    const serviceTotals = new Map();
    store.data.order_items.forEach((item) => {
      const service = store.data.services.find((svc) => svc.id === item.service_id);
      if (!service) return;
      const current = serviceTotals.get(service.name) || { name: service.name, total_qty: 0, total_rev: 0 };
      current.total_qty += Number(item.quantity || 0);
      current.total_rev += Number(item.subtotal || 0);
      serviceTotals.set(service.name, current);
    });
    return json(res, {
      success: true,
      stats: {
        today_revenue: sum(validOrders.filter((order) => String(order.created_at).startsWith(today))),
        month_revenue: sum(validOrders.filter((order) => String(order.created_at).startsWith(month))),
        total_revenue: sum(validOrders),
        total_orders: store.data.orders.length,
        today_orders: store.data.orders.filter((order) => String(order.created_at).startsWith(today)).length,
        pending_orders: store.data.orders.filter((order) => order.status === 'pending').length,
        total_users: store.data.users.filter((user) => user.is_verified).length
      },
      status_counts: statusCounts,
      recent_revenue: [...recentRevenueMap.entries()].slice(-7).map(([date, revenue]) => ({ date, revenue })),
      top_services: [...serviceTotals.values()].sort((a, b) => b.total_rev - a.total_rev).slice(0, 5)
    });
  }

  json(res, { error: 'Invalid action' }, 400);
});

app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Sagun's Laundry Node app running at http://localhost:${PORT}`);
  console.log('Customer bookings are handed off through WhatsApp.');
  console.log('Admin password is configured with ADMIN_PASSWORD on first setup; logs are not public.');
});
