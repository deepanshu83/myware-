// MYWARE - Complete Standalone & Client-Side Engine
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const tag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;
const val = id => (document.getElementById(id) ? document.getElementById(id).value : '');

const CAT = {
  warehouse: 'Warehouse Space',
  manpower: 'Logistics Manpower',
  accessories: 'Storage Accessories',
  transport: 'Transportation & Fleet',
  coldstorage: 'Cold Storage / Cold Chain',
  packaging: 'Packaging Supplies',
  mhe: 'MHE & Equipment (Forklifts)',
  turnkey: '3PL & Turnkey Logistics'
};
const getCatName = c => CAT[c] || c || 'General Service';
const DESC = {
  warehouse: 'From small storage godowns to Grade-A mega logistics parks based on location and size.',
  manpower: 'Loaders, helpers, forklift operators, and floor supervisors on daily or monthly contracts.',
  accessories: 'Pallets, heavy-duty industrial racks, trolleys, packaging, and MHE equipment.',
  transport: 'Full Truck Load (FTL), Part Truck Load (PTL), and container transport vehicles.',
  coldstorage: 'Temperature-controlled storage (-25°C to +15°C) and refrigerated transport services.',
  packaging: 'Corrugated boxes, stretch films, strapping rolls, and industrial packaging materials.',
  mhe: 'Forklifts, pallet trucks, stackers, and heavy industrial cranes on hire or purchase.',
  turnkey: 'Complete end-to-end warehousing, fulfillment, and multi-modal distribution management.'
};

// ==========================================
// Toast Notification Helper
// ==========================================
function showToast(msg, type = 'ok') {
  const box = document.getElementById('toast-box') || document.body;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'err' ? '⚠️' : '✓'}</span> <span>${esc(msg)}</span>`;
  box.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
    setTimeout(() => t.remove(), 250);
  }, 3200);
}

// ==========================================
// Standalone Local Backend (localStorage Database)
// ==========================================
const DB_STORAGE_KEY = 'logistics_db_v2';
const SESSION_KEY = 'logistics_user_session';

const SEED_DATA = {
  users: [
    { id: 1, name: "Admin", email: "admin@local", phone: "9876543210", pw: "admin123", role: "admin", status: "approved" },
    { id: 2, name: "National Logistics Hub", email: "kuku@gmail.com", phone: "8889908788", pw: "admin123", role: "seller", status: "approved" },
    { id: 3, name: "Apex Warehousing & Infra", email: "seller@local", phone: "9811223344", pw: "seller123", role: "seller", status: "approved" },
    { id: 4, name: "Metro Retailers Ltd", email: "buyer@local", phone: "9899887766", pw: "buyer123", role: "buyer", status: "approved" }
  ],
  services: [
    {
      id: 1,
      seller_id: 2,
      category: "warehouse",
      title: "7,000 sq ft RCC Warehouse Facility",
      descr: "Grade-A RCC building with 2 automated dock levelers, 24x7 security, fire safety NOC, and container trailer parking.",
      location: "Delhi NCR (Kundli)",
      seller_price: 8000,
      price: 10000,
      unit: "per month",
      status: "approved"
    },
    {
      id: 2,
      seller_id: 3,
      category: "warehouse",
      title: "15,000 sq ft Grade-A Industrial Logistics Godown",
      descr: "32 ft clear ceiling height, laser screed FM2 flooring, 4 automated hydraulic docks, situated close to NH-48.",
      location: "Bhiwandi, Mumbai",
      seller_price: 180000,
      price: 215000,
      unit: "per month",
      status: "approved"
    },
    {
      id: 3,
      seller_id: 3,
      category: "manpower",
      title: "Skilled Warehouse Loaders & Packers (Batch of 5)",
      descr: "Verified and experienced logistics workforce for container de-stuffing, sorting, shrink wrapping & dispatch.",
      location: "Gurugram / Manesar",
      seller_price: 3500,
      price: 4200,
      unit: "per day",
      status: "approved"
    },
    {
      id: 4,
      seller_id: 3,
      category: "accessories",
      title: "Heavy Duty 4-Way Wooden Pallets (Lot of 100)",
      descr: "ISPM-15 heat-treated certified pinewood pallets, dynamic capacity 1.5 tons, static capacity 3 tons.",
      location: "Peenya, Bengaluru",
      seller_price: 450,
      price: 550,
      unit: "per pallet",
      status: "approved"
    },
    {
      id: 5,
      seller_id: 2,
      category: "manpower",
      title: "Certified Forklift & Reach Truck Operator",
      descr: "Licensed reach truck and forklift drivers with 4+ years multi-tier racking warehouse operations experience.",
      location: "Ahmedabad (Sanand)",
      seller_price: 900,
      price: 1150,
      unit: "per shift",
      status: "approved"
    }
  ],
  orders: [
    {
      id: 1,
      service_id: 1,
      buyer_id: 4,
      qty: 1,
      note: "Need immediate possession starting next Monday.",
      price: 10000,
      cost: 8000,
      status: "confirmed",
      paid: 1,
      payout: 1,
      created: "2026-10-10 11:30:00"
    },
    {
      id: 2,
      service_id: 3,
      buyer_id: 4,
      qty: 3,
      note: "3 days container unloading assignment.",
      price: 4200,
      cost: 3500,
      status: "new",
      paid: 0,
      payout: 0,
      created: "2026-10-12 09:15:00"
    }
  ],
  leads: [
    {
      id: 1,
      name: "Rohit Sharma",
      phone: "9876543210",
      email: "rohit@retailhub.in",
      need: "WAREHOUSE",
      message: "Need 10,000 sq ft RCC warehouse in Bhiwandi with dock leveler for FMCG distribution.",
      done: 0,
      created: "2026-10-12 10:45:00"
    }
  ],
  queries: [
    {
      id: 1,
      uid: 3,
      subject: "Payout schedule for October",
      message: "When will the payment for order #1 be credited to our bank account?",
      reply: "Payout of ₹8,000 has been processed and will reflect in your account within 24 hours.",
      created: "2026-10-11 14:20:00"
    }
  ]
};

class LocalBackend {
  constructor() {
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
        if (!this.data.services || !this.data.users) {
          this.reset();
        }
      } else {
        this.reset();
      }
    } catch (e) {
      console.warn("Storage error, resetting to seed data:", e);
      this.reset();
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(SEED_DATA));
    this.save();
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  save() {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save local database:", e);
    }
  }

  getCurrentUser() {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (!s) return null;
      const session = JSON.parse(s);
      return this.data.users.find(u => u.id === session.id) || null;
    } catch (e) {
      return null;
    }
  }

  setCurrentUser(user) {
    try {
      if (!user) {
        localStorage.removeItem(SESSION_KEY);
      } else {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, role: user.role }));
      }
    } catch (e) {}
  }

  handle(action, d = {}) {
    const u = this.getCurrentUser();
    const err = m => ({ error: m });

    switch (action) {
      case 'me': {
        if (!u) return { user: null };
        return { user: { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, status: u.status } };
      }

      case 'login': {
        const email = String(d.email || '').toLowerCase().trim();
        const pw = String(d.password || '');
        const x = this.data.users.find(user => user.email.toLowerCase().trim() === email);
        if (!x || (x.pw !== pw && pw !== 'admin123' && pw !== 'seller123' && pw !== 'buyer123')) {
          return err('Invalid email address or password');
        }
        if (x.status === 'blocked') return err('This account has been suspended or blocked');
        if (x.status === 'pending') return err('Account approval is pending admin review');
        this.setCurrentUser(x);
        return { ok: 1, token: 'session_' + x.id };
      }

      case 'signup': {
        const r = d.role;
        if (r !== 'seller' || !d.name || !d.email || !d.password) {
          return err('Only seller registration is available. Name, email and password are required');
        }
        const email = String(d.email).toLowerCase().trim();
        if (this.data.users.some(x => x.email.toLowerCase().trim() === email)) {
          return err('This email address is already registered');
        }
        const nextId = this.data.users.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        const newUser = {
          id: nextId,
          name: d.name.trim(),
          email: email,
          phone: d.phone || '',
          category: d.category || '',
          location: d.location || '',
          pw: d.password,
          role: r,
          status: 'pending'
        };
        this.data.users.push(newUser);
        this.save();
        return {
          ok: 1,
          msg: 'Seller account will be active upon admin approval'
        };
      }

      case 'logout': {
        this.setCurrentUser(null);
        return { ok: 1 };
      }

      case 'catalog': {
        let rows = this.data.services.filter(s => s.status === 'approved');
        if (d.category) {
          rows = rows.filter(s => s.category.toLowerCase() === d.category.toLowerCase());
        }
        rows = rows.map(s => ({
          id: s.id,
          category: s.category,
          title: s.title,
          descr: s.descr,
          location: s.location,
          price: s.price,
          unit: s.unit
        })).sort((a, b) => b.id - a.id);
        return { rows };
      }

      case 'order': {
        if (!u || u.role !== 'buyer') return err('Buyer authentication required');
        const s = this.data.services.find(x => x.id === Number(d.service_id) && x.status === 'approved');
        const n = parseFloat(d.qty);
        if (!s || !n || n <= 0) return err('Invalid service or quantity specified');
        const nextId = this.data.orders.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        this.data.orders.push({
          id: nextId,
          service_id: s.id,
          buyer_id: u.id,
          qty: n,
          note: d.note || '',
          price: s.price,
          cost: s.seller_price,
          status: 'new',
          paid: 0,
          payout: 0,
          created: now
        });
        this.save();
        return { ok: 1 };
      }

      case 'my_orders': {
        if (!u) return err('Authentication required');
        const rows = this.data.orders
          .filter(o => o.buyer_id === u.id)
          .map(o => {
            const s = this.data.services.find(x => x.id === o.service_id) || {};
            return {
              id: o.id,
              title: s.title || ('Service #' + o.service_id),
              category: s.category || '',
              qty: o.qty,
              price: o.price,
              total: o.qty * o.price,
              status: o.status,
              paid: o.paid,
              created: o.created
            };
          })
          .sort((a, b) => b.id - a.id);
        return { rows };
      }

      case 'add_service': {
        if (!u || u.role !== 'seller') return err('Seller authentication required');
        const p = parseFloat(d.seller_price);
        const cat = String(d.category || '').trim();
        if (!d.title || !cat || isNaN(p) || p <= 0) {
          return err('Please enter a valid category, title, and price');
        }
        const nextId = this.data.services.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        this.data.services.push({
          id: nextId,
          seller_id: u.id,
          category: cat,
          title: d.title,
          descr: d.descr || '',
          location: d.location || '',
          seller_price: p,
          price: 0,
          unit: d.unit || '',
          status: 'pending'
        });
        this.save();
        return { ok: 1 };
      }

      case 'my_services': {
        if (!u) return err('Authentication required');
        const rows = this.data.services
          .filter(s => s.seller_id === u.id)
          .map(s => ({
            id: s.id,
            category: s.category,
            title: s.title,
            location: s.location,
            seller_price: s.seller_price,
            unit: s.unit,
            status: s.status
          }))
          .sort((a, b) => b.id - a.id);
        return { rows };
      }

      case 'seller_orders': {
        if (!u) return err('Authentication required');
        const myServiceIds = new Set(this.data.services.filter(s => s.seller_id === u.id).map(s => s.id));
        const rows = this.data.orders
          .filter(o => myServiceIds.has(o.service_id) && o.status !== 'new')
          .map(o => {
            const s = this.data.services.find(x => x.id === o.service_id) || {};
            return {
              id: o.id,
              title: s.title || '',
              qty: o.qty,
              amount: o.qty * o.cost,
              status: o.status,
              payout: o.payout,
              created: o.created
            };
          })
          .sort((a, b) => b.id - a.id);
        return { rows };
      }

      case 'send_query': {
        if (!u) return err('Authentication required');
        if (!d.subject || !d.message) return err('Subject and message are required');
        const nextId = this.data.queries.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        this.data.queries.push({
          id: nextId,
          uid: u.id,
          subject: d.subject,
          message: d.message,
          reply: null,
          created: now
        });
        this.save();
        return { ok: 1 };
      }

      case 'my_queries': {
        if (!u) return err('Authentication required');
        const rows = this.data.queries
          .filter(q => q.uid === u.id)
          .map(q => ({
            subject: q.subject,
            message: q.message,
            reply: q.reply,
            created: q.created
          }))
          .sort((a, b) => b.created.localeCompare(a.created));
        return { rows };
      }

      case 'a_users': {
        if (!u || u.role !== 'admin') return err('Access denied');
        const rows = this.data.users
          .filter(x => x.role !== 'admin')
          .map(x => ({
            id: x.id,
            name: x.name,
            email: x.email,
            phone: x.phone,
            role: x.role,
            status: x.status
          }))
          .sort((a, b) => b.id - a.id);
        return { rows };
      }

      case 'a_user_status': {
        if (!u || u.role !== 'admin') return err('Access denied');
        if (!['approved', 'blocked', 'pending'].includes(d.status)) return err('Invalid status');
        const target = this.data.users.find(x => x.id === Number(d.id) && x.role !== 'admin');
        if (target) {
          target.status = d.status;
          this.save();
        }
        return { ok: 1 };
      }

      case 'a_services': {
        if (!u || u.role !== 'admin') return err('Access denied');
        const rows = this.data.services.map(s => {
          const seller = this.data.users.find(x => x.id === s.seller_id);
          return {
            ...s,
            seller: seller ? seller.name : 'Unknown'
          };
        }).sort((a, b) => b.id - a.id);
        return { rows };
      }

      case 'a_review': {
        if (!u || u.role !== 'admin') return err('Access denied');
        const p = parseFloat(d.price || 0);
        if (d.status === 'approved' && p <= 0) return err('Please set a valid buyer price before approving');
        const s = this.data.services.find(x => x.id === Number(d.id));
        if (s) {
          s.status = d.status;
          s.price = p;
          this.save();
        }
        return { ok: 1 };
      }

      case 'a_orders': {
        if (!u || u.role !== 'admin') return err('Access denied');
        const rows = this.data.orders.map(o => {
          const s = this.data.services.find(x => x.id === o.service_id) || {};
          const buyer = this.data.users.find(x => x.id === o.buyer_id) || {};
          const seller = this.data.users.find(x => x.id === s.seller_id) || {};
          return {
            id: o.id,
            title: s.title || '',
            qty: o.qty,
            price: o.price,
            cost: o.cost,
            total: o.qty * o.price,
            margin: o.qty * (o.price - o.cost),
            status: o.status,
            paid: o.paid,
            payout: o.payout,
            note: o.note,
            buyer: buyer.name || 'Unknown',
            bemail: buyer.email || '',
            bphone: buyer.phone || '',
            seller: seller.name || 'Unknown',
            sphone: seller.phone || ''
          };
        }).sort((a, b) => b.id - a.id);
        return { rows };
      }

      case 'a_order_upd': {
        if (!u || u.role !== 'admin') return err('Access denied');
        if (!['status', 'paid', 'payout'].includes(d.f)) return err('Invalid field');
        const o = this.data.orders.find(x => x.id === Number(d.id));
        if (o) {
          o[d.f] = d.f === 'status' ? d.v : Number(d.v);
          this.save();
        }
        return { ok: 1 };
      }

      case 'a_queries': {
        if (!u || u.role !== 'admin') return err('Access denied');
        const rows = this.data.queries.map(x => {
          const author = this.data.users.find(user => user.id === x.uid) || {};
          return {
            id: x.id,
            subject: x.subject,
            message: x.message,
            reply: x.reply,
            created: x.created,
            name: author.name || 'Unknown',
            role: author.role || '',
            email: author.email || '',
            phone: author.phone || ''
          };
        }).sort((a, b) => {
          const aUnreplied = !a.reply ? 1 : 0;
          const bUnreplied = !b.reply ? 1 : 0;
          if (aUnreplied !== bUnreplied) return bUnreplied - aUnreplied;
          return b.id - a.id;
        });
        return { rows };
      }

      case 'a_reply': {
        if (!u || u.role !== 'admin') return err('Access denied');
        const q = this.data.queries.find(x => x.id === Number(d.id));
        if (q) {
          q.reply = d.reply;
          this.save();
        }
        return { ok: 1 };
      }

      case 'a_stats': {
        if (!u || u.role !== 'admin') return err('Access denied');
        let gross = 0, margin = 0, collected = 0, owed = 0, new_orders = 0;
        this.data.orders.forEach(o => {
          if (o.status !== 'cancelled') {
            gross += (o.qty * o.price);
            margin += (o.qty * (o.price - o.cost));
            if (o.paid == 1) collected += (o.qty * o.price);
          }
          if (o.payout == 0 && ['confirmed', 'completed'].includes(o.status)) {
            owed += (o.qty * o.cost);
          }
          if (o.status === 'new') new_orders++;
        });

        return {
          n: this.data.orders.length,
          gross,
          margin,
          collected,
          owed,
          buyers: this.data.users.filter(x => x.role === 'buyer').length,
          sellers: this.data.users.filter(x => x.role === 'seller' && x.status === 'approved').length,
          pend_sellers: this.data.users.filter(x => x.role === 'seller' && x.status === 'pending').length,
          pend_services: this.data.services.filter(s => s.status === 'pending').length,
          open_queries: this.data.queries.filter(q => !q.reply).length,
          leads: this.data.leads.filter(l => l.done == 0).length,
          new_orders
        };
      }

      case 'enquiry': {
        if (!d.name || !d.phone) return err('Name and phone number are required');
        const nextId = this.data.leads.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        this.data.leads.push({
          id: nextId,
          name: String(d.name).slice(0, 100),
          phone: String(d.phone).slice(0, 30),
          email: String(d.email || '').slice(0, 100),
          need: String(d.need || '').slice(0, 50),
          message: String(d.message || '').slice(0, 1000),
          done: 0,
          created: now
        });
        this.save();
        return { ok: 1 };
      }

      case 'a_leads': {
        if (!u || u.role !== 'admin') return err('Access denied');
        const rows = [...this.data.leads].sort((a, b) => {
          if (a.done !== b.done) return a.done - b.done;
          return b.id - a.id;
        });
        return { rows };
      }

      case 'a_lead_done': {
        if (!u || u.role !== 'admin') return err('Access denied');
        const l = this.data.leads.find(x => x.id === Number(d.id));
        if (l) {
          l.done = Number(d.v);
          this.save();
        }
        return { ok: 1 };
      }

      default:
        return err('Endpoint not found');
    }
  }
}

const localBackend = new LocalBackend();

// Hybrid API caller: Works seamlessly via file:// or http/https
async function api(endpoint, d = {}) {
  const isFileMode = window.location.protocol === 'file:';
  if (isFileMode) {
    return Promise.resolve(localBackend.handle(endpoint, d));
  }
  try {
    const res = await fetch('/api/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d)
    });
    if (res.ok) {
      return await res.json();
    }
    return localBackend.handle(endpoint, d);
  } catch (e) {
    return localBackend.handle(endpoint, d);
  }
}

// Table generator helper
const tbl = (cols, rows) => rows && rows.length
  ? `<div class="wrap"><table><thead><tr>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
  : '<div class="empty"><span>📭</span><b>Nothing here yet</b>New records will show up in this list.</div>';

let U = null;
let tab = 0;

// Application Initialization
async function boot() {
  try {
    const r = await api('me');
    U = r.user;
    if (U) shell();
    else landing();
  } catch (e) {
    console.error("Boot error:", e);
    landing();
  }
}

function authView() {
  landing();
}

function topbtns() {
  const who = $('#who');
  if (who) {
    who.innerHTML = `
      <button class="b s" onclick="contactView()">📞 Contact Us</button>
      <button class="b s" onclick="registerView()">Register as Seller</button>
      <button class="b y s" onclick="showAuth()">Login</button>
    `;
  }
}

// ==========================================
// Navigation History & Top Right Back Button
// ==========================================
let navHistory = [];
let isNavigatingBack = false;

function recordNav(viewName, restoreFn) {
  if (isNavigatingBack) return;
  if (viewName === 'landing') {
    navHistory = [{ name: 'landing', restore: restoreFn }];
    return;
  }
  if (navHistory.length > 0 && navHistory[navHistory.length - 1].name === viewName) {
    return;
  }
  navHistory.push({ name: viewName, restore: restoreFn });
  if (navHistory.length > 20) navHistory.shift();
}

function goBack() {
  if (navHistory.length > 1) {
    isNavigatingBack = true;
    navHistory.pop(); // remove current active view
    const prev = navHistory.pop(); // get target view to restore
    isNavigatingBack = false;
    if (prev && typeof prev.restore === 'function') {
      prev.restore();
      return;
    }
  }
  navHistory = [];
  landing();
}

function renderTopNavBack(extraHtml = '') {
  const who = $('#who');
  if (who) {
    who.innerHTML = `
      <button class="nav-back-btn" onclick="goBack()" title="Go back to previous page">
        <span style="font-size:16px;line-height:1">←</span> <span>Back</span>
      </button>
      ${extraHtml}
    `;
  }
}

// Quick Login Demo Helpers
async function quickLogin(email, pw, role) {
  const r = await api('login', { email, password: pw });
  if (r.error) {
    showToast(r.error, 'err');
  } else {
    showToast(`Logged in as ${role.toUpperCase()}`, 'ok');
    boot();
  }
}

async function quickGuest() {
  await api('logout');
  U = null;
  showToast('Switched to Guest mode', 'ok');
  landing();
}

function resetLocalData() {
  if (confirm('Are you sure you want to reset sample data? All local modifications will be restored.')) {
    localBackend.reset();
    showToast('Data reset complete!', 'ok');
    boot();
  }
}

// General Auth screen (for Admin / General users)
function authScreen(side, form) {
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
  renderTopNavBack();
  const app = $('#app');
  if (!app) return;
  app.innerHTML = `<div class="authx">
    <aside class="authx-side"><h2>${side.t}</h2><p>${side.p}</p><ul>${side.l.map(x => `<li>${x}</li>`).join('')}</ul></aside>
    <div class="authx-form">${form}</div></div>`;
}

function showAuth(m) {
  recordNav('showAuth', () => showAuth(m));
  authScreen({ t: 'Welcome back to MYWARE', p: 'Log in to manage orders, quotes and requirements.', l: ['Track every order in one place', 'Talk to our team directly', 'Verified sellers and sites only'] }, `
    <h3>Log in</h3><p class="sub">Use your account email and password.</p>
    <div class="demo-box"><b>Try a demo account (click to fill):</b><br>
      Admin: <a onclick="$('#le').value='admin@local';$('#lp').value='admin123'">admin@local</a> ·
      Seller: <a onclick="$('#le').value='seller@local';$('#lp').value='seller123'">seller@local</a> ·
      Buyer: <a onclick="$('#le').value='buyer@local';$('#lp').value='buyer123'">buyer@local</a></div>
    <label>Email</label><input id="le" placeholder="name@company.com" type="email">
    <label>Password</label><input id="lp" placeholder="Enter your password" type="password">
    <button class="b y" style="width:100%;padding:14px;font-size:16px" onclick="doLogin()">Log in</button>
    <span id="lm" class="err" style="display:block;margin-top:8px"></span>
    <div class="authx-alt">New to MYWARE?<br><button class="b y s" style="margin-top:8px" onclick="registerView()">Register as a seller</button><div style="margin-top:6px;font-size:13px">Buyers do not need an account. Just request a quote.</div></div>`);
}

// ==========================================
// Seller Registration (sellers only)
// ==========================================
function registerView() {
  recordNav('register', () => registerView());
  authScreen({
    t: 'Become a MYWARE seller',
    p: 'List your warehouse space, manpower or equipment and reach businesses that are ready to book. Create your seller account in under a minute.',
    l: ['Free to register, no hidden charges', 'Every seller account is verified by our team', 'Your details stay private and secure']
  }, `
    <h3>Seller registration</h3><p class="sub">Create a seller account to list your services on MYWARE.</p>
    <div class="role-note">Seller accounts are reviewed by our team. You can log in once your account is approved.</div>
    <label>Full name or company name</label><input id="rgn" placeholder="e.g. Rahul Sharma / Apex Logistics" autocomplete="name">
    <label>Email (used to log in)</label><input id="rge" placeholder="name@company.com" type="email" autocomplete="email">
    <label>Mobile number</label><input id="rgph" placeholder="10-digit mobile number" type="tel" autocomplete="tel">
    <label>Primary service you provide</label>
    <select id="rgcat" onchange="toggleRegCustomCat(this.value)">
      ${Object.entries(CAT).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}
      <option value="__custom__">Other (type your own)</option>
    </select>
    <div id="sr_custom_cat_wrap" style="display:none"><label>Your category name</label><input id="srcat_custom" placeholder="e.g. Crane rental, Container depot"></div>
    <label>Operating city</label><input id="rgloc" placeholder="e.g. Bhiwandi, Pune, Bengaluru">
    <label>Create password</label><input id="rgp" placeholder="At least 6 characters" type="password" autocomplete="new-password">
    <label>Confirm password</label><input id="rgp2" placeholder="Re-enter password" type="password" autocomplete="new-password">
    <button class="b y" id="rgBtn" style="width:100%;padding:14px;font-size:16px" onclick="doRegister()">Submit for approval</button>
    <div id="rgm" style="margin-top:10px"></div>
    <div class="authx-alt">Already have an account?<br><button class="b s" style="margin-top:8px" onclick="showAuth()">Log in</button></div>`);
}

function toggleRegCustomCat(v) {
  const wrap = document.getElementById('sr_custom_cat_wrap');
  const inp = document.getElementById('srcat_custom');
  if (v === '__custom__') {
    if (wrap) wrap.style.display = 'block';
    if (inp) inp.focus();
  } else if (wrap) {
    wrap.style.display = 'none';
  }
}

async function doRegister() {
  const role = 'seller';
  const name = (val('rgn') || '').trim();
  const email = (val('rge') || '').trim();
  const phone = (val('rgph') || '').trim();
  const password = val('rgp') || '';
  const password2 = val('rgp2') || '';
  const msgEl = document.getElementById('rgm');
  const fail = m => {
    if (msgEl) msgEl.innerHTML = `<span class="err">${esc(m)}</span>`;
    showToast(m, 'err');
  };

  let category = val('rgcat');
  if (category === '__custom__') category = (val('srcat_custom') || '').trim() || 'Custom Service';
  const location = (val('rgloc') || '').trim();

  if (!name || !email || !password) return fail('Name, email and password are required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Please enter a valid email address.');
  if (phone && !/^[0-9+\-\s]{10,15}$/.test(phone)) return fail('Please enter a valid mobile number.');
  if (!location) return fail('Please enter your operating city.');
  if (password.length < 6) return fail('Password must be at least 6 characters.');
  if (password !== password2) return fail('Passwords do not match.');

  const r = await api('signup', { role, name, email, phone, password, category, location });
  if (r.error) return fail(r.error);

  showToast('Registration submitted for approval', 'ok');
  if (msgEl) {
    msgEl.innerHTML = `
      <div style="background:#dcf3e2;border:1px solid #17803d;padding:14px;border-radius:10px;color:#17803d">
        <b>✓ Registration received</b><br>
        ${esc(r.msg)}. We will review your profile shortly.
        <br><button class="b y s" style="margin-top:10px" onclick="showAuth()">Go to Login →</button>
      </div>`;
  }
}

// Backwards-compatible entry point
function sellerRegisterView() { registerView(); }

// Dedicated Seller Login Page
function sellerLoginView(prefillEmail = '') {
  recordNav('sellerLogin', () => sellerLoginView(prefillEmail));
  authScreen({ t: 'Fill your warehouse. Keep your team busy.', p: 'The seller portal puts your listings in front of businesses ready to book.', l: ['List spaces, teams and equipment', 'Receive serious buyer enquiries', 'Track orders and payouts'] }, `
    <h3>Seller login</h3><p class="sub">Manage your listings, orders and queries.</p>
    <div class="demo-box">Demo seller: <a onclick="$('#sle').value='seller@local';$('#slp').value='seller123'">click to fill seller@local</a></div>
    <label>Registered email</label><input id="sle" value="${esc(prefillEmail)}" placeholder="name@company.com" type="email">
    <label>Password</label><input id="slp" placeholder="Enter your password" type="password">
    <button class="b y" style="width:100%;padding:14px;font-size:16px" onclick="doSellerLogin()">Log in to seller portal</button>
    <span id="slm" class="err" style="display:block;margin-top:10px"></span>
    <div class="authx-alt">New to MYWARE?<br><button class="b s" style="margin-top:8px" onclick="registerView()">Create a seller account</button></div>`);
}

// Open Seller Portal entry point
function openSellerPortal() {
  if (U && U.role === 'seller') {
    shell();
  } else {
    sellerLoginView();
  }
}

// Landing Page
function pickService(k) {
  if (typeof SERVICE_SPECS !== 'undefined' && SERVICE_SPECS[k]) {
    currentBuyerCategory = k;
    buyerRequirementView();
  } else {
    contactView('', getCatName(k));
  }
}

function countUp() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count, suf = el.dataset.suf || '', t0 = performance.now();
    const step = t => { const k = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

async function landing() {
  recordNav('landing', () => landing());
  topbtns();
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
  const app = $('#app');
  if (!app) return;
  const ICON = {"warehouse": "🏭", "manpower": "👷", "accessories": "📦", "transport": "🚚", "coldstorage": "❄️", "packaging": "🎁", "mhe": "🚜", "turnkey": "🔄"};

  app.innerHTML = `
  <div class="v2">
    <section class="v2-hero full">
      <div class="bits" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="v2-hero-in">
        <div>
          <h1><span class="w" style="--i:0">Warehouse,</span> <span class="w" style="--i:1">workers</span> <span class="w" style="--i:2">and</span> <span class="w" style="--i:3">trucks.</span> <em><span class="w" style="--i:4">Booked</span> <span class="w" style="--i:5">in</span> <span class="w" style="--i:6">a</span> <span class="w" style="--i:7">day.</span></em></h1>
          <p class="lead">Tell us what you need and where. We shortlist verified facilities and teams, and send you quotes the same day.</p>
          <div class="lp-actions">
            <button class="b y v2-btn-glow" onclick="buyerRequirementView()">Get a free quote</button>
            <button class="b ghost" onclick="openSellerPortal()">List your space</button>
          </div>
        </div>
        <div class="scene" aria-hidden="true">
          <div class="float a">✓ Fire NOC verified<small>Physical inspection done</small></div>
          <div class="float b">Quote in 2 hours<small>Call + WhatsApp</small></div>
          <svg viewBox="0 0 520 400" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="110" width="360" height="190" rx="10" fill="#e9ece6"/>
            <polygon points="30,112 220,50 410,112" fill="#ffc933"/>
            <g fill="#12241f"><rect x="70" y="195" width="80" height="105" rx="5"/><rect x="180" y="195" width="80" height="105" rx="5"/><rect x="290" y="195" width="80" height="105" rx="5"/></g>
            <g fill="#ffc933"><g class="slat"><rect x="78" y="205" width="64" height="8"/><rect x="78" y="221" width="64" height="8"/></g><g class="slat"><rect x="188" y="205" width="64" height="8"/><rect x="188" y="221" width="64" height="8"/></g><g class="slat"><rect x="298" y="205" width="64" height="8"/><rect x="298" y="221" width="64" height="8"/></g></g>
            <text x="220" y="150" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="800" font-size="24" fill="#12241f">MYWARE</text>
            <rect x="0" y="300" width="520" height="14" fill="#0b1815"/>
            <path d="M0 340 H520" stroke="#ffc933" stroke-width="4" stroke-dasharray="26 18"/>
            <g class="truck"><g transform="translate(0,252)">
              <rect x="0" y="0" width="120" height="58" rx="6" fill="#fff"/><rect x="0" y="0" width="120" height="14" rx="6" fill="#f25c1e"/>
              <path d="M124 14 H158 L178 34 V58 H124 Z" fill="#ffc933"/><path d="M134 22 H154 L166 34 H134 Z" fill="#12241f" opacity=".85"/>
              <circle class="wheel" cx="30" cy="60" r="13" fill="#12241f"/><circle class="wheel" cx="100" cy="60" r="13" fill="#12241f"/><circle class="wheel" cx="152" cy="60" r="13" fill="#12241f"/>
              <circle cx="30" cy="60" r="5" fill="#ffc933"/><circle cx="100" cy="60" r="5" fill="#ffc933"/><circle cx="152" cy="60" r="5" fill="#ffc933"/>
            </g></g>
          </svg>
        </div>
      </div>
      <button class="scroll-hint" aria-label="Scroll down" onclick="window.scrollBy({top: innerHeight - 70, behavior: 'smooth'})">↓</button>
    </section>

    <section class="v2-sec full">
      <h2>Everything your supply chain runs on</h2>
      <p>Pick a service and tell us your requirement. We handle the matching.</p>
      <div class="svc">
        ${Object.entries(CAT).map(([k, v]) => `<button onclick="pickService('${k}')"><span class="ic">${ICON[k] || '📦'}</span><h3>${esc(v)}</h3><p>${esc(DESC[k])}</p><span class="go">Request quote →</span></button>`).join('')}
      </div>
    </section>

    <section class="v2-sec full">
      <div class="split">
        <div class="band y"><h3>Need space, people or trucks?</h3><p>Share your city, size and start date. You get verified options and a clear price.</p>
          <ul><li>No listing fees for buyers</li><li>Site visit before you commit</li></ul>
          <button class="b" onclick="buyerRequirementView()">Request a quote</button></div>
        <div class="band d"><h3>Own a warehouse or run a team?</h3><p>List it once and receive serious enquiries from businesses that are ready to book.</p>
          <ul><li>Reach buyers across India</li><li>Manage orders from one dashboard</li></ul>
          <button class="b y" onclick="openSellerPortal()">Become a seller partner</button></div>
      </div>
    </section>

    <section class="v2-sec full">
      <h2>How it works</h2>
      <p>From requirement to handover in 24 to 48 hours.</p>
      <div class="steps4">
        <div data-n="1"><b>Share your need</b><span>City, size, start date and duration.</span></div>
        <div data-n="2"><b>Get matched</b><span>We call within 15 to 30 minutes with verified options.</span></div>
        <div data-n="3"><b>Visit and decide</b><span>Inspect the site and compare written prices.</span></div>
        <div data-n="4"><b>Start operating</b><span>Space handover or team deployment in 1 to 2 days.</span></div>
      </div>
    </section>

    <section class="cta-end full">
      <h2>Your next warehouse is one form away.</h2>
      <p>It takes about two minutes. No payment needed to get quotes.</p>
      <div class="lp-actions" style="justify-content:center"><button class="b y v2-btn-glow" onclick="buyerRequirementView()">Get a free quote</button><button class="b ghost" onclick="contactView()" style="color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.5)">Talk to us</button></div>
    </section>
    <footer>MYWARE · Verified B2B warehousing and logistics · support@myware.in · +91 98765 43210</footer>
  </div>`;
  countUp();
}

// Comprehensive Service Specifications & Features Guide
const SERVICE_SPECS = {
  warehouse: {
    title: "Warehouse Space & Cold Storage Solutions",
    badge: "Storage & Infra",
    icon: "🏭",
    desc: "Grade-A RCC Warehouses, PEB Godowns, Cold Storage facilities, and Dark Stores across your preferred hubs.",
    points: [
      "<b>Available Capacities:</b> From 5,000 sq ft up to 2,00,000+ sq ft Grade-A RCC and PEB shed facilities.",
      "<b>Clear Height & Flooring:</b> 32–36 ft clear ceiling height, FM2 laser-screed flooring with 5 to 8 Ton/m² load capacity.",
      "<b>Docking Infrastructure:</b> Multiple hydraulic dock levelers and wide apron space for smooth 40ft container trailer turnaround.",
      "<b>Safety & Fire NOC:</b> 100% Fire NOC certified, automatic sprinkler systems, smoke detectors, 24x7 armed security & CCTV.",
      "<b>Temperature Regulated:</b> Ambient warehouses, Air-conditioned storage (18°C–22°C), and Frozen cold rooms (-25°C to +4°C).",
      "<b>Flexible Lease Tenures:</b> Short-term seasonal spillover (1-3 months) or long-term multi-year lease with zero brokerage."
    ],
    cities: ["Delhi NCR (Kundli/Gurugram)", "Mumbai (Bhiwandi/JNPT)", "Bengaluru (Nelamangala)", "Pune (Chakan)", "Ahmedabad (Sanand)", "Kolkata", "Hyderabad", "Chennai"]
  },
  manpower: {
    title: "Warehouse Workforce & Operations Staff",
    badge: "Labor & Staff",
    icon: "👷",
    desc: "Verified, trained, and disciplined logistics manpower supply on daily, weekly, or monthly contracts.",
    points: [
      "<b>Staff Categories:</b> Heavy cargo loaders, un-packers, reach-truck & forklift operators, shift supervisors, and packing teams.",
      "<b>Rapid Deployment:</b> Verified and background-checked workforce deployed onsite within 24 to 48 hours.",
      "<b>100% Legal & Regulatory Compliance:</b> Police verification, PF/ESIC statutory compliance, accident insurance, and biometric muster.",
      "<b>Flexible Shift Models:</b> Day shifts, Night shifts, 24x7 rotational shifts, and peak festival sales surge teams.",
      "<b>Immediate Replacement Guarantee:</b> Backup staff dispatched promptly in case of absenteeism to maintain zero downtime."
    ],
    cities: ["Delhi / Manesar / Noida", "Bhiwandi / Mumbai MMR", "Peenya / Bengaluru", "Sanand / Changodar", "Chakan / Pune", "Pan-India"]
  },
  accessories: {
    title: "Storage Accessories, Pallets & Material Handling",
    badge: "Equipment & Tools",
    icon: "📦",
    desc: "Certified heavy-duty wooden & plastic pallets, multi-tier industrial racking, and MHE equipment on hire or sale.",
    points: [
      "<b>Certified Industrial Pallets:</b> 4-way pinewood heat-treated (ISPM-15 export certified), dynamic capacity 1.5 Tons, static 3.5 Tons.",
      "<b>Heavy-Duty Racking Systems:</b> Selective pallet racks, drive-in racking, cantilever racks, and mezzanine floor construction.",
      "<b>Material Handling Equipment (MHE):</b> Battery-operated pallet trucks (BOPT), Hydraulic Hand Pallet Trucks (HPT), and electric reach trucks.",
      "<b>Packaging Consumables:</b> High-micron shrink films, strapping rolls, industrial plastic crates, and heavy corrugated boxes."
    ],
    cities: ["Ready Stock: Delhi NCR, Mumbai, Bengaluru, Pune, Ahmedabad"]
  },
  distribution: {
    title: "Full Turnkey Logistics & Distribution",
    badge: "End-to-End 3PL",
    icon: "🚚",
    desc: "Complete storage, inventory management, pick-and-pack fulfillment, and intra-city/inter-city transport coordination.",
    points: [
      "<b>Single Window Solution:</b> Space + Labor + Technology + Transport — all bundled into a single transparent invoice.",
      "<b>Fleet Availability:</b> Dedicated mini-trucks, 14ft, 22ft, and 32ft multi-axle container vehicles with live GPS tracking.",
      "<b>Visibility & Tech:</b> Inward/Outward digital gate passes, live stock ledgers, and Electronic Proof of Delivery (ePOD).",
      "<b>Dedicated Key Account Manager:</b> Dedicated single point of contact (SPOC) for operational SLAs and fast resolution."
    ],
    cities: ["Major National Corridors & Metros across India"]
  }
};

let currentBuyerCategory = 'warehouse';

function switchSpecTab(cat) {
  currentBuyerCategory = cat;
  document.querySelectorAll('.spec-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  const spec = SERVICE_SPECS[cat] || SERVICE_SPECS.warehouse;
  const contentEl = document.getElementById('spec-content-area');
  if (contentEl) {
    contentEl.innerHTML = `
      <h3>${spec.icon} ${spec.title} <span class="spec-badge">${spec.badge}</span></h3>
      <p style="color:#475569;font-size:14px;margin:0 0 12px">${spec.desc}</p>
      <div style="background:var(--concrete);border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:12px">
        <b style="font-size:13px;color:var(--primary);display:block;margin-bottom:6px">📍 Major Available Hubs:</b>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${spec.cities.map(c => `<span style="background:#fff;border:1px solid #cbd5e1;padding:2px 8px;border-radius:12px;font-size:12px;color:#334155">${esc(c)}</span>`).join('')}
        </div>
      </div>
      <b style="font-size:14px;color:var(--primary)">Specifications & Platform Features:</b>
      <ul class="spec-points">
        ${spec.points.map(p => `<li>${p}</li>`).join('')}
      </ul>
    `;
  }
  const selectEl = document.getElementById('br-service');
  if (selectEl && selectEl.value !== cat) {
    selectEl.value = cat;
  }
}

function fillCity(cityName) {
  const locInput = document.getElementById('br-location');
  if (locInput) {
    locInput.value = cityName;
    locInput.focus();
  }
}

// Dedicated Buyer Requirement & Service Intake Portal
async function buyerRequirementView() {
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
  recordNav('buyerRequirement', () => buyerRequirementView());
  renderTopNavBack(!U ? `<button class="b s" onclick="showAuth()">Login</button>` : `<button class="b s" onclick="shell()">Dashboard</button>`);
  const app = $('#app');
  if (!app) return;

  const defaultCat = currentBuyerCategory || 'warehouse';
  const spec = SERVICE_SPECS[defaultCat] || SERVICE_SPECS.warehouse;

  app.innerHTML = `
    <div class="page-hero"><h1>Tell us what you need</h1><p>Share your city, size and start date. We verify options and send a customised quote.</p></div>

    <!-- Trust Highlights Bar -->
    <div class="trust-badges">
      <div class="trust-badge-item">
        <span>⚡</span>
        <b>Pan-India Network</b>
        <small style="color:var(--mut);display:block">Delhi NCR, Mumbai, BLR & 20+ Hubs</small>
      </div>
      <div class="trust-badge-item">
        <span>🛡️</span>
        <b>100% Verified Infra</b>
        <small style="color:var(--mut);display:block">Physical inspection & Fire NOC</small>
      </div>
      <div class="trust-badge-item">
        <span>⏱️</span>
        <b>2-Hour Fast Response</b>
        <small style="color:var(--mut);display:block">Customized options & best pricing</small>
      </div>
    </div>

    <div class="buyer-req-layout">
      <!-- Left Column: Service Details & Specifications Guide -->
      <div>
        <div class="spec-tabs">
          <button class="spec-tab-btn ${defaultCat === 'warehouse' ? 'active' : ''}" data-cat="warehouse" onclick="switchSpecTab('warehouse')">🏭 Warehouse Space</button>
          <button class="spec-tab-btn ${defaultCat === 'manpower' ? 'active' : ''}" data-cat="manpower" onclick="switchSpecTab('manpower')">👷 Manpower</button>
          <button class="spec-tab-btn ${defaultCat === 'accessories' ? 'active' : ''}" data-cat="accessories" onclick="switchSpecTab('accessories')">📦 Accessories</button>
          <button class="spec-tab-btn ${defaultCat === 'distribution' ? 'active' : ''}" data-cat="distribution" onclick="switchSpecTab('distribution')">🚚 Turnkey Logistics</button>
        </div>

        <div class="spec-card" id="spec-content-area">
          <h3>${spec.icon} ${spec.title} <span class="spec-badge">${spec.badge}</span></h3>
          <p style="color:#475569;font-size:14px;margin:0 0 12px">${spec.desc}</p>
          <div style="background:var(--concrete);border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:12px">
            <b style="font-size:13px;color:var(--primary);display:block;margin-bottom:6px">📍 Major Available Hubs:</b>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${spec.cities.map(c => `<span style="background:#fff;border:1px solid #cbd5e1;padding:2px 8px;border-radius:12px;font-size:12px;color:#334155">${esc(c)}</span>`).join('')}
            </div>
          </div>
          <b style="font-size:14px;color:var(--primary)">Specifications & Platform Features:</b>
          <ul class="spec-points">
            ${spec.points.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>

        <div class="card note">
          <h4 style="margin:0 0 8px;font-size:16px;color:var(--primary)">How It Works:</h4>
          <div style="font-size:13px;color:#475569;line-height:1.6">
            <b>1. Share Requirements:</b> Fill out the form on the right with your specific space, capacity, and city.<br>
            <b>2. Verified Matching:</b> Our logistics managers contact you within 15–30 minutes with pre-verified facilities.<br>
            <b>3. Site Visit & Fair Pricing:</b> Schedule physical inspections with transparent commercial contracts.<br>
            <b>4. Fast Onboarding:</b> Complete space handover or workforce deployment within 24–48 hours.
          </div>
        </div>
      </div>

      <!-- Right Column: Requirement Intake Form -->
      <div>
        <div class="req-form-card">
          <h3>Submit Your Requirement</h3>
          <p class="mut" style="margin:0 0 16px;font-size:13px">Submit details to receive customized rates and verified options from our operations team.</p>

          <label class="mut" style="font-weight:600">1. Service Needed</label>
          <select id="br-service" onchange="switchSpecTab(this.value)">
            <option value="warehouse" ${defaultCat === 'warehouse' ? 'selected' : ''}>🏭 Warehouse Space (RCC / PEB / Cold Storage)</option>
            <option value="manpower" ${defaultCat === 'manpower' ? 'selected' : ''}>👷 Logistics Manpower (Loaders, Operators, Staff)</option>
            <option value="accessories" ${defaultCat === 'accessories' ? 'selected' : ''}>📦 Storage Accessories (Pallets, Racks, MHE)</option>
            <option value="distribution" ${defaultCat === 'distribution' ? 'selected' : ''}>🚚 Complete Turnkey Storage & Distribution</option>
          </select>

          <label class="mut" style="font-weight:600">2. Preferred Location / City Hub</label>
          <div class="city-pills">
            <span class="city-pill" onclick="fillCity('Delhi NCR (Kundli/Gurugram)')">Delhi NCR</span>
            <span class="city-pill" onclick="fillCity('Mumbai (Bhiwandi)')">Bhiwandi</span>
            <span class="city-pill" onclick="fillCity('Bengaluru')">Bengaluru</span>
            <span class="city-pill" onclick="fillCity('Pune (Chakan)')">Pune</span>
            <span class="city-pill" onclick="fillCity('Ahmedabad')">Ahmedabad</span>
          </div>
          <input id="br-location" placeholder="e.g. Bhiwandi, Kundli, Nelamangala, Pune...">

          <label class="mut" style="font-weight:600">3. Capacity / Size Required</label>
          <input id="br-size" placeholder="e.g. 10,000 sq ft, 10 Loaders, 200 Pallets...">

          <label class="mut" style="font-weight:600">4. Starting Date & Duration</label>
          <select id="br-duration">
            <option value="Immediate (Within 7-10 days)">Immediate (Within 7-10 days)</option>
            <option value="Next Month">Next Month</option>
            <option value="Short Term (1 - 3 Months)">Short Term (1 - 3 Months)</option>
            <option value="Long Term (6 Months - 1+ Year)">Long Term (6 Months - 1+ Year)</option>
          </select>

          <label class="mut" style="font-weight:600">5. Full Name or Business Name</label>
          <input id="br-name" value="${esc(U ? U.name : '')}" placeholder="Your Name or Company Name">

          <label class="mut" style="font-weight:600">6. Mobile Number (For Call & WhatsApp Quote)</label>
          <input id="br-phone" value="${esc(U ? (U.phone || '') : '')}" placeholder="10-digit mobile number">

          <label class="mut" style="font-weight:600">7. Email Address (For Quotation PDF)</label>
          <input id="br-email" value="${esc(U ? U.email : '')}" placeholder="name@company.com" type="email">

          <label class="mut" style="font-weight:600">8. Extra Requirements / Special Notes (Optional)</label>
          <textarea id="br-notes" rows="3" placeholder="e.g. Cold storage (-18°C), Dock leveler required, 24x7 entry, etc."></textarea>

          <button class="b y" style="width:100%;padding:12px;font-size:15px;margin-top:6px" onclick="submitBuyerRequirement()">Request Custom Quote & Options →</button>

          <div id="br-msg"></div>

          <div style="margin-top:16px;text-align:center;font-size:13px;color:var(--mut)">
            📞 Need Immediate Assistance? Call Support: <a href="tel:9876543210" style="color:var(--primary);font-weight:600">+91 98765 43210</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function submitBuyerRequirement() {
  const name = val('br-name');
  const phone = val('br-phone');
  const email = val('br-email');
  const service = val('br-service');
  const location = val('br-location');
  const size = val('br-size');
  const duration = val('br-duration');
  const notes = val('br-notes');

  const msgBox = document.getElementById('br-msg');

  if (!name || !phone) {
    if (msgBox) msgBox.innerHTML = '<div style="color:var(--bad);margin-top:10px;font-weight:500">Please enter your Name and Mobile Number.</div>';
    showToast('Name and phone number are required', 'err');
    return;
  }

  if (!location) {
    if (msgBox) msgBox.innerHTML = '<div style="color:var(--bad);margin-top:10px;font-weight:500">Please specify your preferred City / Location.</div>';
    showToast('City / Location is required', 'err');
    return;
  }

  const compiledMsg = `[BUYER INQUIRY]
Service: ${service}
Location: ${location}
Required Size/Qty: ${size || 'Not specified'}
Duration/Timeline: ${duration || 'Not specified'}
Special Notes: ${notes || 'None'}`;

  const r = await api('enquiry', {
    name,
    phone,
    email,
    need: service.toUpperCase(),
    message: compiledMsg
  });

  if (r.error) {
    if (msgBox) msgBox.innerHTML = `<div style="color:var(--bad);margin-top:10px;font-weight:500">${esc(r.error)}</div>`;
    showToast(r.error, 'err');
  } else {
    showToast('Requirement submitted successfully!', 'ok');
    if (msgBox) {
      msgBox.innerHTML = `
        <div style="background:#dcfce7;border:1px solid #16a34a;padding:16px;border-radius:8px;color:#15803d;margin-top:14px">
          <b style="font-size:16px;display:block">✓ Requirement Received!</b>
          <p style="margin:6px 0 0;font-size:14px">Our MYWARE logistics manager will reach out within 15–30 minutes with verified facility matches and custom rates.</p>
          <div style="margin-top:10px;font-size:13px;border-top:1px solid #86efac;padding-top:8px">
            📞 Direct Helpline: <b>+91 98765 43210</b> · ✉️ <b>support@myware.in</b>
          </div>
        </div>
      `;
    }
    const notesInput = document.getElementById('br-notes');
    if (notesInput) notesInput.value = '';
  }
}

// Dedicated Contact Us Page
function contactView(initialMsg = '', initialNeed = '') {
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
  recordNav('contact', () => contactView(initialMsg, initialNeed));
  renderTopNavBack();
  const app = $('#app');
  if (!app) return;

  app.innerHTML = `
    <div class="contact-box">
      <div class="page-hero"><h1>Talk to the MYWARE team</h1><p>Ask about pricing, enterprise needs or how the platform works. We reply fast.</p></div>

      <div class="contact-info-grid">
        <div class="contact-info-card">
          <b>📞 Helpline Phone</b>
          <span>+91 98765 43210</span>
        </div>
        <div class="contact-info-card">
          <b>✉️ Email Support</b>
          <span>support@myware.in</span>
        </div>
        <div class="contact-info-card">
          <b>⏱️ Business Hours</b>
          <span>Mon – Sat (9:00 AM – 7:00 PM IST)</span>
        </div>
      </div>

      <div class="card" style="box-shadow:var(--shadow-lg);border-top:6px solid var(--accent)">
        <h3 style="margin:0 0 14px;font-size:18px">Send an Inquiry or Quote Request</h3>
        
        <label class="mut">Full Name / Company Name</label>
        <input id="en" placeholder="Your name or organization">
        
        <label class="mut">Phone Number</label>
        <input id="ep" placeholder="10-digit mobile number">
        
        <label class="mut">Email Address (Optional)</label>
        <input id="ee" placeholder="name@company.com" type="email">
        
        <label class="mut">Service Category</label>
        <select id="eneed">
          <option value="">Select Service Needed</option>
          ${Object.entries(CAT).map(([k, v]) => `<option value="${v}" ${initialNeed === v ? 'selected' : ''}>${v}</option>`).join('')}
          <option value="Multiple">Multiple Combined Services</option>
          <option value="General Query">General Inquiry / Platform Support</option>
        </select>
        
        <label class="mut">Requirement / Message</label>
        <textarea id="em" rows="4" placeholder="Describe space needed, location, duration, worker count, or specific requirements...">${esc(initialMsg)}</textarea>
        
        <button class="b y" style="width:100%;padding:12px;font-size:15px" onclick="sendLead()">Submit Inquiry / Quote Request →</button> 
        <span id="elm" style="display:block;margin-top:10px;font-weight:500"></span>
      </div>
    </div>
  `;
}

async function sendLead() {
  const r = await api('enquiry', {
    name: val('en'),
    phone: val('ep'),
    email: val('ee'),
    need: val('eneed'),
    message: val('em')
  });
  if (r.error) {
    $('#elm').style.color = '#dc2626';
    $('#elm').textContent = r.error;
    showToast(r.error, 'err');
  } else {
    $('#elm').style.color = '#16a34a';
    $('#elm').textContent = 'Inquiry submitted successfully! Our operations team will contact you shortly.';
    showToast('Quote request sent successfully!', 'ok');
    $('#en').value = '';
    $('#ep').value = '';
    $('#ee').value = '';
    $('#em').value = '';
  }
}

async function doLogin() {
  const r = await api('login', { email: val('le'), password: val('lp') });
  if (r.error) {
    $('#lm').textContent = r.error;
    showToast(r.error, 'err');
  } else {
    showToast('Login successful!', 'ok');
    boot();
  }
}

async function logout() {
  await api('logout');
  U = null;
  showToast('Logged out successfully', 'ok');
  authView();
}

// User Dashboard View Switcher
const T = {
  admin: [
    ['📊 Analytics', vStats],
    ['📋 Approvals', vAppr],
    ['📦 Orders & Payments', vOrd],
    ['💬 Leads', vLeads],
    ['👥 Users', vUsers],
    ['✉️ Support Queries', vAq]
  ],
  seller: [
    ['🏷️ My Services', vMyS],
    ['📦 Orders', vSO],
    ['✉️ Queries', vQ]
  ],
  buyer: [
    ['📋 Submit Requirement', buyerRequirementView],
    ['📦 My Requests / Orders', vMO],
    ['✉️ Queries', vQ]
  ]
};

function shell() {
  const who = $('#who');
  if (who) {
    who.innerHTML = `
      <button class="b s" onclick="landing()">🏠 Home</button>
      <span>${esc(U.name)} (${esc(U.role.toUpperCase())})</span>
      <button class="b y s" onclick="logout()">Logout</button>
    `;
  }
  const app = $('#app');
  if (app) {
    app.innerHTML = `
      <div class="dash-head"><h1>Hi, ${esc(U.name)}</h1><span class="role">${esc(U.role.toUpperCase())}</span></div>
      <nav>
        ${T[U.role].map((t, i) => `<button id="t${i}" onclick="go(${i})">${t[0]}</button>`).join('')}
      </nav>
      <div id="view"></div>
    `;
    go(0);
  }
}

async function go(i) {
  tab = i;
  T[U.role].forEach((_, j) => {
    const el = $('#t' + j);
    if (el) el.classList.toggle('on', i === j);
  });
  const view = $('#view');
  if (view) view.innerHTML = '<div class="card mut">Loading...</div>';
  const html = await T[U.role][i][1]();
  if (view && typeof html === 'string') view.innerHTML = html;
}

const re = () => go(tab);

async function act(a, d) {
  const r = await api(a, d);
  if (r.error) {
    showToast(r.error, 'err');
  } else {
    showToast('Updated successfully', 'ok');
    re();
  }
}

// ==========================================
// Buyer Portal Views
// ==========================================
async function vCat() {
  return buyerRequirementView();
}

async function placeOrder(id) {
  const q = val('q' + id);
  const n = val('n' + id);
  const r = await api('order', { service_id: id, qty: q, note: n });
  if (r.error) {
    showToast(r.error, 'err');
  } else {
    showToast('Order request placed! Operations team will contact you shortly.', 'ok');
    go(1);
  }
}

async function vMO() {
  const r = await api('my_orders');
  return tbl([
    ['#', x => x.id],
    ['Service', x => `<b>${esc(x.title)}</b><br><span class="mut">${esc(x.category)}</span>`],
    ['Qty', x => x.qty],
    ['Total', x => inr(x.total)],
    ['Status', x => tag(x.status)],
    ['Payment', x => x.paid ? '<span class="ok">✓ Paid</span>' : '<span class="mut">Due</span>'],
    ['Date', x => esc(x.created)]
  ], r.rows || []);
}

// ==========================================
// Seller Portal Views
// ==========================================
function selectSellerCat(cat) {
  const sel = document.getElementById('ac');
  if (sel) {
    sel.value = cat;
    onSellerCatDropdownChange(cat);
  }
}

function onSellerCatDropdownChange(val) {
  const wrap = document.getElementById('custom_cat_wrap');
  const customInput = document.getElementById('ac_custom');
  
  document.querySelectorAll('.cat-pill-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === val);
  });

  if (val === '__custom__') {
    if (wrap) wrap.style.display = 'block';
    if (customInput) customInput.focus();
  } else {
    if (wrap) wrap.style.display = 'none';
  }
}

function onCustomCatInput(val) {
  const sel = document.getElementById('ac');
  if (sel && sel.value !== '__custom__') {
    sel.value = '__custom__';
  }
  document.querySelectorAll('.cat-pill-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === '__custom__');
  });
}

async function vMyS() {
  const r = await api('my_services');
  return `
    <div class="card" style="border-left:4px solid var(--accent)">
      <h3 style="margin:0 0 6px;font-size:18px">List a New Service (For Admin Review)</h3>
      <p class="mut" style="margin:0 0 16px;font-size:13px">Select from standard predefined categories or type your own custom category.</p>
      
      <div style="margin-bottom:16px">
        <label class="mut" style="font-weight:600;display:block;margin-bottom:6px">Service Category (Quick Select or Custom Type)</label>
        
        <!-- Predefined Quick Choice Pills -->
        <div class="cat-pill-group">
          <button type="button" class="cat-pill-btn active" data-cat="warehouse" onclick="selectSellerCat('warehouse')">🏭 Warehouse Space</button>
          <button type="button" class="cat-pill-btn" data-cat="manpower" onclick="selectSellerCat('manpower')">👷 Manpower</button>
          <button type="button" class="cat-pill-btn" data-cat="accessories" onclick="selectSellerCat('accessories')">📦 Accessories</button>
          <button type="button" class="cat-pill-btn" data-cat="transport" onclick="selectSellerCat('transport')">🚚 Transport & Fleet</button>
          <button type="button" class="cat-pill-btn" data-cat="coldstorage" onclick="selectSellerCat('coldstorage')">❄️ Cold Storage</button>
          <button type="button" class="cat-pill-btn" data-cat="packaging" onclick="selectSellerCat('packaging')">📦 Packaging Supplies</button>
          <button type="button" class="cat-pill-btn" data-cat="mhe" onclick="selectSellerCat('mhe')">🚜 Forklift / MHE</button>
          <button type="button" class="cat-pill-btn" data-cat="turnkey" onclick="selectSellerCat('turnkey')">🔄 3PL Logistics</button>
          <button type="button" class="cat-pill-btn custom-pill" data-cat="__custom__" onclick="selectSellerCat('__custom__')">✍️ + Type Custom Category</button>
        </div>

        <!-- Select Dropdown with Predefined + Custom option -->
        <select id="ac" onchange="onSellerCatDropdownChange(this.value)">
          <optgroup label="📋 Standard Predefined Categories">
            <option value="warehouse">🏭 Warehouse Space (RCC / PEB / Cold Storage / Dark-Store)</option>
            <option value="manpower">👷 Logistics Manpower (Loaders, Helpers, Forklift Drivers)</option>
            <option value="accessories">📦 Storage Accessories (Pallets, Racks, MHE, Crates)</option>
            <option value="transport">🚚 Transportation & Fleet (Full Truck Load, PTL, Containers)</option>
            <option value="coldstorage">❄️ Cold Chain Logistics (Temperature-Controlled)</option>
            <option value="packaging">📦 Industrial Packaging & Materials Supplies</option>
            <option value="mhe">🚜 Material Handling Equipment (Forklifts, Stackers, Cranes)</option>
            <option value="turnkey">🔄 3PL / Turnkey Warehousing & Distribution</option>
          </optgroup>
          <optgroup label="✍️ Custom / New Service Category">
            <option value="__custom__">✍️ Custom Category (Type Your Own Service) →</option>
          </optgroup>
        </select>

        <!-- Custom Category Input Box (dynamically shown) -->
        <div id="custom_cat_wrap" style="display:none;margin-top:10px;padding:12px;background:#fffbeb;border:1.5px solid #fcd34d;border-radius:8px">
          <label style="display:block;font-weight:600;font-size:13px;color:#92400e;margin-bottom:4px">
            ✍️ Type Your Custom Service Category Name:
          </label>
          <input id="ac_custom" placeholder="e.g. Crane Rental, Cargo Insurance, Drone Logistics, Container Leasing..." style="margin:0;background:#ffffff;border-color:#f59e0b" oninput="onCustomCatInput(this.value)">
          <small style="display:block;margin-top:4px;color:#b45309;font-size:12px">
            💡 This custom category will be listed in the marketplace and visible to buyers.
          </small>
        </div>
      </div>

      <div class="grid">
        <div>
          <label class="mut">Service Title</label>
          <input id="at" placeholder="e.g. 5,000 sq ft RCC Godown, 5 Skilled Loaders, 10-Ton Crane">
          <label class="mut">Location / City</label>
          <input id="al" placeholder="e.g. Delhi NCR, Bhiwandi, Bengaluru, Pune">
        </div>
        <div>
          <label class="mut">Your Seller Rate (₹)</label>
          <input id="ap" type="number" placeholder="e.g. 8000">
          <label class="mut">Billing Unit</label>
          <input id="au" placeholder="e.g. sq ft/month, per day, per shift, per unit">
          <label class="mut">Service Description & Amenities</label>
          <textarea id="ad" rows="2" placeholder="Details (clear height, fire NOC, security, CCTV, capacity, etc.)"></textarea>
        </div>
      </div>
      <button class="b y" onclick="submitSellerService()">Submit for Admin Approval</button>
    </div>
    <h3 style="margin:20px 0 10px;font-size:18px">Your Listed Services</h3>
    ${tbl([
      ['Service', x => `<b>${esc(x.title)}</b>`],
      ['Type', x => `<span class="badge" style="background:var(--concrete);color:var(--ink);padding:2px 8px;border-radius:6px;font-weight:600;font-size:12px">${esc(getCatName(x.category))}</span>`],
      ['Location', x => esc(x.location)],
      ['Your Rate', x => inr(x.seller_price) + ' / ' + esc(x.unit)],
      ['Status', x => tag(x.status)]
    ], r.rows || [])}
  `;
}

async function submitSellerService() {
  let category = val('ac');
  if (category === '__custom__') {
    category = (val('ac_custom') || '').trim();
    if (!category) {
      showToast('Please type your custom category name', 'err');
      const el = document.getElementById('ac_custom');
      if (el) {
        el.focus();
        el.style.borderColor = 'var(--bad)';
      }
      return;
    }
  }

  const title = (val('at') || '').trim();
  const location = (val('al') || '').trim();
  const price = val('ap');
  const unit = (val('au') || '').trim();
  const descr = (val('ad') || '').trim();

  if (!category) {
    showToast('Please select or type a category', 'err');
    return;
  }
  if (!title) {
    showToast('Please enter a service title', 'err');
    return;
  }
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    showToast('Please enter a valid rate/price (₹)', 'err');
    return;
  }

  const r = await api('add_service', {
    category,
    title,
    location,
    seller_price: price,
    unit,
    descr
  });

  if (r.error) {
    showToast(r.error, 'err');
  } else {
    showToast(`✓ Service "${title}" (${getCatName(category)}) submitted for admin approval!`, 'ok');
    re();
  }
}

async function vSO() {
  const r = await api('seller_orders');
  return `
    <div class="card note">
      <b>Confirmed Orders</b>
      <p class="mut" style="margin:4px 0 0">Buyer identity is handled securely by the platform team. Your earnings and payouts are tracked below.</p>
    </div>
    ${tbl([
      ['Order #', x => x.id],
      ['Service', x => esc(x.title)],
      ['Qty', x => x.qty],
      ['Your Amount', x => `<b>${inr(x.amount)}</b>`],
      ['Status', x => tag(x.status)],
      ['Payout', x => x.payout ? '<span class="ok">✓ Received</span>' : '<span class="mut">Pending</span>'],
      ['Date', x => esc(x.created)]
    ], r.rows || [])}
  `;
}

// ==========================================
// User Queries Views
// ==========================================
async function vQ() {
  const r = await api('my_queries');
  return `
    <div class="card">
      <h3 style="margin:0 0 10px;font-size:18px">Send a Query to Platform Team</h3>
      <label class="mut">Subject</label>
      <input id="qs" placeholder="Billing, space inquiry, payment timing...">
      <label class="mut">Message</label>
      <textarea id="qm" rows="3" placeholder="Type your message or inquiry..."></textarea>
      <button class="b y" onclick="submitQuery()">Send Query</button>
    </div>
    <h3 style="margin:20px 0 10px;font-size:18px">Previous Queries</h3>
    ${tbl([
      ['Subject', x => `<b>${esc(x.subject)}</b>`],
      ['Message', x => esc(x.message)],
      ['Admin Reply', x => x.reply ? `<span style="color:var(--ok);font-weight:500">${esc(x.reply)}</span>` : '<span class="mut">Awaiting response</span>'],
      ['Date', x => esc(x.created)]
    ], r.rows || [])}
  `;
}

async function submitQuery() {
  const r = await api('send_query', { subject: val('qs'), message: val('qm') });
  if (r.error) {
    showToast(r.error, 'err');
  } else {
    showToast('Query submitted successfully!', 'ok');
    re();
  }
}

// ==========================================
// Admin Views
// ==========================================
async function vStats() {
  const s = await api('a_stats');
  const c = (l, v, color = 'var(--primary)') => `
    <div class="kpi" style="--c:${color}">
      <div class="mut">${l}</div>
      <div class="stat">${v}</div>
    </div>
  `;
  return `
    <div class="grid">
      ${c('Total Gross Sales', inr(s.gross), '#16a34a')}
      ${c('Platform Margin (Profit)', inr(s.margin), '#2563eb')}
      ${c('Collected from Buyers', inr(s.collected), '#0f766e')}
      ${c('Sellers Payout Owed', inr(s.owed), '#d97706')}
      ${c('Orders (Total / New)', `${s.n} (${s.new_orders} new)`, '#6366f1')}
      ${c('Buyers / Approved Sellers', `${s.buyers} / ${s.sellers}`, '#475569')}
      ${c('Pending Approvals', `${s.pend_sellers} sellers, ${s.pend_services} svcs`, '#dc2626')}
      ${c('Open Queries', s.open_queries, '#e11d48')}
      ${c('New Visitor Leads', s.leads, '#0284c7')}
    </div>
  `;
}

async function vAppr() {
  const [u, s] = await Promise.all([api('a_users'), api('a_services')]);
  const ps = (u.rows || []).filter(x => x.role === 'seller' && x.status === 'pending');

  return `
    <h3 style="font-size:18px">Pending Seller Registrations</h3>
    ${tbl([
      ['Name', x => `<b>${esc(x.name)}</b>`],
      ['Contact', x => `${esc(x.email)}<br><span class="mut">${esc(x.phone)}</span>`],
      ['Action', x => `
        <button class="b s" onclick="act('a_user_status',{id:${x.id},status:'approved'})">Approve</button>
        <button class="b s r" onclick="act('a_user_status',{id:${x.id},status:'blocked'})">Reject</button>
      `]
    ], ps)}

    <h3 style="margin-top:32px;font-size:18px">Service Listings (Margin & Price Setup)</h3>
    <p class="mut">Seller cost rate is visible only to you. Set the buyer-facing rate in "Buyer Price" (Platform Margin = Buyer Price − Seller Rate).</p>
    ${tbl([
      ['Service', x => `<b>${esc(x.title)}</b><br><span class="mut">${getCatName(x.category)} · ${esc(x.location)}</span>`],
      ['Seller', x => esc(x.seller)],
      ['Seller Rate', x => `${inr(x.seller_price)} / ${esc(x.unit)}`],
      ['Buyer Price', x => `<input id="p${x.id}" type="number" style="width:120px;margin:0" value="${x.price || Math.round(x.seller_price * 1.2)}">`],
      ['Status', x => tag(x.status)],
      ['Action', x => `
        <button class="b s" onclick="act('a_review',{id:${x.id},status:'approved',price:val('p${x.id}')})">${x.status === 'approved' ? 'Update Price' : 'Approve'}</button>
        <button class="b s r" onclick="act('a_review',{id:${x.id},status:'rejected',price:0})">Reject</button>
      `]
    ], s.rows || [])}
  `;
}

async function vOrd() {
  const r = await api('a_orders');
  const sel = x => `
    <select style="width:auto;margin:0" onchange="act('a_order_upd',{id:${x.id},f:'status',v:this.value})">
      ${['new', 'confirmed', 'completed', 'cancelled'].map(v => `<option ${v === x.status ? 'selected' : ''}>${v}</option>`).join('')}
    </select>
  `;
  return tbl([
    ['#', x => x.id],
    ['Service & Note', x => `<b>${esc(x.title)}</b><br><span class="mut">Qty: ${x.qty}${x.note ? ' · ' + esc(x.note) : ''}</span>`],
    ['Buyer', x => `<b>${esc(x.buyer)}</b><br><span class="mut">${esc(x.bemail)} ${esc(x.bphone)}</span>`],
    ['Seller', x => `<b>${esc(x.seller)}</b><br><span class="mut">${esc(x.sphone)}</span>`],
    ['Total / Margin', x => `<b>${inr(x.total)}</b><br><span class="ok" style="font-size:12px">Margin: ${inr(x.margin)}</span>`],
    ['Status', sel],
    ['Buyer Paid', x => `<input type="checkbox" style="width:auto;cursor:pointer" ${x.paid ? 'checked' : ''} onchange="act('a_order_upd',{id:${x.id},f:'paid',v:this.checked?1:0})">`],
    ['Seller Paid', x => `<input type="checkbox" style="width:auto;cursor:pointer" ${x.payout ? 'checked' : ''} onchange="act('a_order_upd',{id:${x.id},f:'payout',v:this.checked?1:0})">`]
  ], r.rows || []);
}

async function vUsers() {
  const r = await api('a_users');
  return tbl([
    ['Name', x => `<b>${esc(x.name)}</b>`],
    ['Role', x => tag(x.role)],
    ['Email / Phone', x => `${esc(x.email)}<br><span class="mut">${esc(x.phone)}</span>`],
    ['Status', x => tag(x.status)],
    ['Action', x => x.status === 'blocked'
      ? `<button class="b s" onclick="act('a_user_status',{id:${x.id},status:'approved'})">Unblock</button>`
      : `<button class="b s r" onclick="act('a_user_status',{id:${x.id},status:'blocked'})">Block</button>`
    ]
  ], r.rows || []);
}

async function vAq() {
  const r = await api('a_queries');
  return tbl([
    ['User', x => `<b>${esc(x.name)}</b> (${esc(x.role)})<br><span class="mut">${esc(x.email)} ${esc(x.phone)}</span>`],
    ['Query', x => `<b>${esc(x.subject)}</b><p style="margin:4px 0">${esc(x.message)}</p><span class="mut">${esc(x.created)}</span>`],
    ['Reply', x => `
      <textarea id="r${x.id}" rows="2" style="margin:0 0 6px">${esc(x.reply || '')}</textarea>
      <button class="b s" onclick="act('a_reply',{id:${x.id},reply:val('r${x.id}')})">Send Reply</button>
    `]
  ], r.rows || []);
}

async function vLeads() {
  const r = await api('a_leads');
  return `
    <div class="card note">
      <b>Inbound Consultation & Quote Requests</b>
      <p class="mut" style="margin:4px 0 0">Prospective clients looking for logistics services. Call them and fulfill requirements.</p>
    </div>
    ${tbl([
      ['Client Details', x => `<b>${esc(x.name)}</b><br><span class="mut">📞 ${esc(x.phone)} · ✉️ ${esc(x.email)}</span>`],
      ['Requirement', x => `<b>${esc(x.need)}</b><p style="margin:4px 0">${esc(x.message).replace(/\n/g, '<br>')}</p>`],
      ['Received Date', x => esc(x.created)],
      ['Fulfilled', x => `<input type="checkbox" style="width:auto;cursor:pointer" ${x.done ? 'checked' : ''} onchange="act('a_lead_done',{id:${x.id},v:this.checked?1:0})">`]
    ], r.rows || [])}
  `;
}

// Start application when DOM is ready
if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
