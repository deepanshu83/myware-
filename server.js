const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const D = __dirname;
const DB_PATH = path.join(D, 'data.db');
const db = new DatabaseSync(DB_PATH);

function q(sql, a = [], one = false, w = false) {
  const stmt = db.prepare(sql);
  if (w) {
    const info = stmt.run(...a);
    return Number(info.lastInsertRowid);
  }
  if (one) {
    const row = stmt.get(...a);
    return row ? { ...row } : null;
  }
  return stmt.all(...a).map(row => ({ ...row }));
}

function hp(pw, s = null) {
  s = s || crypto.randomBytes(8).toString('hex');
  const hash = crypto.pbkdf2Sync(String(pw || ''), s, 100000, 32, 'sha256').toString('hex');
  return s + '$' + hash;
}

function init() {
  db.exec(`
create table if not exists users(id integer primary key,name,email unique,phone,pw,role,status);
create table if not exists sessions(tok primary key,uid);
create table if not exists services(id integer primary key,seller_id,category,title,descr,location,seller_price real,price real,unit,status default 'pending');
create table if not exists orders(id integer primary key,service_id,buyer_id,qty real,note,price real,cost real,status default 'new',paid int default 0,payout int default 0,created default current_timestamp);
create table if not exists leads(id integer primary key,name,phone,email,need,message,done int default 0,created default current_timestamp);
create table if not exists queries(id integer primary key,uid,subject,message,reply,created default current_timestamp);
`);
  const adminExists = q("select 1 from users where role='admin'", [], true);
  if (!adminExists) {
    q("insert into users(name,email,phone,pw,role,status) values('Admin','admin@local','', ?, 'admin','approved')", [hp('admin123')], false, true);
  }
}

const E = (m) => ({ error: m });

function signup(u, d) {
  const r = d && d.role;
  if (r !== 'seller' || !d || !d.name || !d.email || !d.password) {
    return E('Only seller registration is available. Name, email and password are required');
  }
  try {
    q(
      "insert into users(name,email,phone,pw,role,status) values(?,?,?,?,?,?)",
      [d.name, String(d.email).toLowerCase().trim(), d.phone || '', hp(d.password), r, 'pending'],
      false,
      true
    );
  } catch (err) {
    if (String(err).includes('UNIQUE') || String(err).includes('constraint')) {
      return E('This email address is already registered');
    }
    throw err;
  }
  return { ok: 1, msg: 'Seller account will be active upon admin approval' };
}

function login(u, d) {
  const email = String((d && d.email) || '').toLowerCase().trim();
  const x = q("select * from users where email=?", [email], true);
  if (!x || !x.pw || hp((d && d.password) || '', x.pw.split('$')[0]) !== x.pw) {
    return E('Invalid email address or password');
  }
  if (x.status === 'blocked') return E('This account has been suspended or blocked');
  if (x.status === 'pending') return E('Account approval is pending admin review');
  const t = crypto.randomBytes(16).toString('hex');
  q("insert into sessions values(?,?)", [t, x.id], false, true);
  return { ok: 1, token: t };
}

function me(u, d) {
  return { user: u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null };
}

function logout(u, d) {
  return { ok: 1 };
}

// buyer sees ONLY public price & service info, never seller identity
function catalog(u, d) {
  let s = "select id,category,title,descr,location,price,unit from services where status='approved'";
  const a = [];
  if (d && d.category) {
    s += " and category=?";
    a.push(d.category);
  }
  return { rows: q(s + " order by id desc", a) };
}

function order(u, d) {
  const s = q("select * from services where id=? and status='approved'", [d && d.service_id], true);
  let n = parseFloat(d && d.qty);
  if (isNaN(n)) n = 0;
  if (!s || n <= 0) return E('Invalid service or quantity');
  q(
    "insert into orders(service_id,buyer_id,qty,note,price,cost) values(?,?,?,?,?,?)",
    [s.id, u.id, n, (d && d.note) || '', s.price, s.seller_price],
    false,
    true
  );
  return { ok: 1 };
}

function my_orders(u, d) {
  return {
    rows: q(
      "select o.id,s.title,s.category,o.qty,o.price,o.qty*o.price total,o.status,o.paid,o.created from orders o join services s on s.id=o.service_id where o.buyer_id=? order by o.id desc",
      [u.id]
    )
  };
}

function add_service(u, d) {
  const p = parseFloat(d && d.seller_price);
  if (isNaN(p) || !d || !d.title || !['warehouse', 'manpower', 'accessories'].includes(d.category)) {
    return E('Please enter a valid category, title and price');
  }
  q(
    "insert into services(seller_id,category,title,descr,location,seller_price,unit) values(?,?,?,?,?,?,?)",
    [u.id, d.category, d.title, (d && d.descr) || '', (d && d.location) || '', p, (d && d.unit) || ''],
    false,
    true
  );
  return { ok: 1 };
}

function my_services(u, d) {
  return {
    rows: q(
      "select id,category,title,location,seller_price,unit,status from services where seller_id=? order by id desc",
      [u.id]
    )
  };
}

// seller sees orders with NO buyer identity
function seller_orders(u, d) {
  return {
    rows: q(
      "select o.id,s.title,o.qty,o.qty*o.cost amount,o.status,o.payout,o.created from orders o join services s on s.id=o.service_id where s.seller_id=? and o.status!='new' order by o.id desc",
      [u.id]
    )
  };
}

function send_query(u, d) {
  if (!d || !d.subject || !d.message) return E('Please enter a subject and a message');
  q("insert into queries(uid,subject,message) values(?,?,?)", [u.id, d.subject, d.message], false, true);
  return { ok: 1 };
}

function my_queries(u, d) {
  return {
    rows: q("select subject,message,reply,created from queries where uid=? order by id desc", [u.id])
  };
}

function a_users(u, d) {
  return { rows: q("select id,name,email,phone,role,status from users where role!='admin' order by id desc") };
}

function a_user_status(u, d) {
  if (!d || !['approved', 'blocked', 'pending'].includes(d.status)) return E('bad status');
  q("update users set status=? where id=? and role!='admin'", [d.status, d.id], false, true);
  return { ok: 1 };
}

function a_services(u, d) {
  return { rows: q("select s.*,u.name seller from services s join users u on u.id=s.seller_id order by s.id desc") };
}

function a_review(u, d) {
  let p = parseFloat((d && d.price) || 0);
  if (isNaN(p)) p = 0;
  if (d && d.status === 'approved' && p <= 0) return E('Please set a valid buyer price before approving');
  q("update services set status=?,price=? where id=?", [d.status, p, d.id], false, true);
  return { ok: 1 };
}

function a_orders(u, d) {
  return {
    rows: q("select o.id,s.title,o.qty,o.price,o.cost,o.qty*o.price total,o.qty*(o.price-o.cost) margin,o.status,o.paid,o.payout,o.note,b.name buyer,b.email bemail,b.phone bphone,k.name seller,k.phone sphone from orders o join services s on s.id=o.service_id join users b on b.id=o.buyer_id join users k on k.id=s.seller_id order by o.id desc")
  };
}

function a_order_upd(u, d) {
  const f = d && d.f;
  if (!['status', 'paid', 'payout'].includes(f)) return E('bad field');
  q(`update orders set ${f}=? where id=?`, [d.v, d.id], false, true);
  return { ok: 1 };
}

function a_queries(u, d) {
  return {
    rows: q("select x.id,x.subject,x.message,x.reply,x.created,u.name,u.role,u.email,u.phone from queries x join users u on u.id=x.uid order by (x.reply is null) desc,x.id desc")
  };
}

function a_reply(u, d) {
  q("update queries set reply=? where id=?", [d && d.reply, d && d.id], false, true);
  return { ok: 1 };
}

function a_stats(u, d) {
  const o = q(
    "select count(*) n,coalesce(sum(case when status!='cancelled' then qty*price end),0) gross,coalesce(sum(case when status!='cancelled' then qty*(price-cost) end),0) margin,coalesce(sum(case when paid=1 and status!='cancelled' then qty*price end),0) collected,coalesce(sum(case when payout=0 and status in('confirmed','completed') then qty*cost end),0) owed from orders",
    [],
    true
  ) || {};

  const buyers = q("select count(*) n from users where role='buyer'", [], true);
  const sellers = q("select count(*) n from users where role='seller' and status='approved'", [], true);
  const pend_sellers = q("select count(*) n from users where role='seller' and status='pending'", [], true);
  const pend_services = q("select count(*) n from services where status='pending'", [], true);
  const open_queries = q("select count(*) n from queries where reply is null", [], true);
  const leads = q("select count(*) n from leads where done=0", [], true);
  const new_orders = q("select count(*) n from orders where status='new'", [], true);

  o.buyers = buyers ? buyers.n : 0;
  o.sellers = sellers ? sellers.n : 0;
  o.pend_sellers = pend_sellers ? pend_sellers.n : 0;
  o.pend_services = pend_services ? pend_services.n : 0;
  o.open_queries = open_queries ? open_queries.n : 0;
  o.leads = leads ? leads.n : 0;
  o.new_orders = new_orders ? new_orders.n : 0;
  return o;
}

function enquiry(u, d) {
  if (!d || !d.name || !d.phone) return E('Name and phone number are required');
  q(
    "insert into leads(name,phone,email,need,message) values(?,?,?,?,?)",
    [
      String(d.name).slice(0, 100),
      String(d.phone).slice(0, 30),
      String(d.email || '').slice(0, 100),
      String(d.need || '').slice(0, 50),
      String(d.message || '').slice(0, 1000)
    ],
    false,
    true
  );
  return { ok: 1 };
}

function a_leads(u, d) {
  return { rows: q("select * from leads order by done,id desc") };
}

function a_lead_done(u, d) {
  q("update leads set done=? where id=?", [d && d.v, d && d.id], false, true);
  return { ok: 1 };
}

const A = {
  enquiry: [null, enquiry],
  a_leads: [['admin'], a_leads],
  a_lead_done: [['admin'], a_lead_done],
  signup: [null, signup],
  login: [null, login],
  me: [null, me],
  logout: ['*', logout],
  catalog: [null, catalog],
  order: [['buyer'], order],
  my_orders: [['buyer'], my_orders],
  add_service: [['seller'], add_service],
  my_services: [['seller'], my_services],
  seller_orders: [['seller'], seller_orders],
  send_query: [['buyer', 'seller'], send_query],
  my_queries: [['buyer', 'seller'], my_queries],
  a_users: [['admin'], a_users],
  a_user_status: [['admin'], a_user_status],
  a_services: [['admin'], a_services],
  a_review: [['admin'], a_review],
  a_orders: [['admin'], a_orders],
  a_order_upd: [['admin'], a_order_upd],
  a_queries: [['admin'], a_queries],
  a_reply: [['admin'], a_reply],
  a_stats: [['admin'], a_stats]
};

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendResponse(res, code, body, contentType = 'application/json', cookie = null) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  const headers = {
    'Content-Type': contentType,
    'Content-Length': buf.length
  };
  if (cookie) headers['Set-Cookie'] = cookie;
  res.writeHead(code, headers);
  res.end(buf);
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (req.method === 'GET') {
    let filePath = path.join(D, urlPath === '/' ? 'index.html' : urlPath);
    let ext = path.extname(filePath).toLowerCase();

    // Prevent directory traversal
    if (!filePath.startsWith(D)) {
      return sendResponse(res, 403, 'Forbidden', 'text/plain');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(D, 'index.html');
      ext = '.html';
    }

    try {
      const data = fs.readFileSync(filePath);
      const ct = MIME_MAP[ext] || 'application/octet-stream';
      return sendResponse(res, 200, data, ct);
    } catch (err) {
      return sendResponse(res, 500, 'Server Error', 'text/plain');
    }
  }

  if (req.method === 'POST') {
    const action = urlPath.replace(/^\/api\//, '');
    const endpointDef = A[action];
    if (!endpointDef) {
      return sendResponse(res, 404, E('not found'));
    }

    let bodyRaw = '';
    req.on('data', chunk => { bodyRaw += chunk; });
    req.on('end', () => {
      let d = {};
      try {
        if (bodyRaw) d = JSON.parse(bodyRaw);
      } catch (err) {
        return sendResponse(res, 400, E('bad json'));
      }

      const cookies = (req.headers.cookie || '').split(';');
      let tok = '';
      for (const item of cookies) {
        const trimmed = item.trim();
        if (trimmed.startsWith('tok=')) {
          tok = trimmed.slice(4);
          break;
        }
      }

      const user = tok
        ? q("select u.* from sessions x join users u on u.id=x.uid where x.tok=? and u.status='approved'", [tok], true)
        : null;

      const roles = endpointDef[0];
      if (roles && (!user || (roles !== '*' && !roles.includes(user.role)))) {
        return sendResponse(res, 403, E('Access denied'));
      }

      const out = endpointDef[1](user, d);
      let ck = null;

      if (action === 'login' && out && out.token) {
        ck = `tok=${out.token}; HttpOnly; Path=/; SameSite=Strict`;
        delete out.token;
      }
      if (action === 'logout') {
        if (tok) q("delete from sessions where tok=?", [tok], false, true);
        ck = 'tok=; Max-Age=0; Path=/';
      }

      return sendResponse(res, 200, out, 'application/json', ck);
    });
    return;
  }

  sendResponse(res, 405, 'Method Not Allowed', 'text/plain');
});

init();
const PORT = parseInt(process.env.PORT || '8000', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Running on http://localhost:${PORT}  (admin@local / admin123)`);
});
