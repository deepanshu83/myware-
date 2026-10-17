import sqlite3,json,hashlib,secrets,os
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
D=os.path.dirname(os.path.abspath(__file__));DB=os.path.join(D,'data.db')
def q(sql,a=(),one=False,w=False):
    c=sqlite3.connect(DB);c.row_factory=sqlite3.Row
    try:
        cur=c.execute(sql,a);r=[dict(x) for x in cur.fetchall()] if not w else cur.lastrowid;c.commit()
        return (r[0] if r else None) if one and not w else r
    finally:c.close()
def hp(pw,s=None):
    s=s or secrets.token_hex(8);return s+'$'+hashlib.pbkdf2_hmac('sha256',pw.encode(),s.encode(),100000).hex()
def init():
    c=sqlite3.connect(DB);c.executescript('''
create table if not exists users(id integer primary key,name,email unique,phone,pw,role,status);
create table if not exists sessions(tok primary key,uid);
create table if not exists services(id integer primary key,seller_id,category,title,descr,location,seller_price real,price real,unit,status default 'pending');
create table if not exists orders(id integer primary key,service_id,buyer_id,qty real,note,price real,cost real,status default 'new',paid int default 0,payout int default 0,created default current_timestamp);
create table if not exists leads(id integer primary key,name,phone,email,need,message,done int default 0,created default current_timestamp);
create table if not exists queries(id integer primary key,uid,subject,message,reply,created default current_timestamp);''')
    if not c.execute("select 1 from users where role='admin'").fetchone():
        c.execute("insert into users(name,email,phone,pw,role,status) values('Admin','admin@local','', ?, 'admin','approved')",(hp('admin123'),))
    c.commit();c.close()
E=lambda m:{'error':m}
def signup(u,d):
    r=d.get('role')
    if r!='seller' or not all(d.get(k) for k in('name','email','password')):return E('Only seller registration is available. Name, email and password are required')
    try:q("insert into users(name,email,phone,pw,role,status) values(?,?,?,?,?,?)",(d['name'],d['email'].lower().strip(),d.get('phone',''),hp(d['password']),r,'pending'),w=True)
    except sqlite3.IntegrityError:return E('This email address is already registered')
    return{'ok':1,'msg':'Seller account will be active upon admin approval'}
def login(u,d):
    x=q("select * from users where email=?",(d.get('email','').lower().strip(),),one=True)
    if not x or hp(d.get('password',''),x['pw'].split('$')[0])!=x['pw']:return E('Invalid email address or password')
    if x['status']=='blocked':return E('This account has been suspended or blocked')
    if x['status']=='pending':return E('Account approval is pending admin review')
    t=secrets.token_hex(16);q("insert into sessions values(?,?)",(t,x['id']),w=True);return{'ok':1,'token':t}
def me(u,d):return{'user':{k:u[k] for k in('id','name','email','role')}} if u else{'user':None}
def logout(u,d):return{'ok':1}
# buyer sees ONLY public price & service info, never seller identity
def catalog(u,d):
    s="select id,category,title,descr,location,price,unit from services where status='approved'";a=[]
    if d.get('category'):s+=" and category=?";a.append(d['category'])
    return{'rows':q(s+" order by id desc",a)}
def order(u,d):
    s=q("select * from services where id=? and status='approved'",(d.get('service_id'),),one=True)
    try:n=float(d.get('qty'))
    except:n=0
    if not s or n<=0:return E('Invalid service or quantity')
    q("insert into orders(service_id,buyer_id,qty,note,price,cost) values(?,?,?,?,?,?)",(s['id'],u['id'],n,d.get('note',''),s['price'],s['seller_price']),w=True);return{'ok':1}
def my_orders(u,d):return{'rows':q("select o.id,s.title,s.category,o.qty,o.price,o.qty*o.price total,o.status,o.paid,o.created from orders o join services s on s.id=o.service_id where o.buyer_id=? order by o.id desc",(u['id'],))}
def add_service(u,d):
    try:p=float(d['seller_price']);assert d['title'] and d['category'] in('warehouse','manpower','accessories')
    except:return E('Please enter a valid category, title and price')
    q("insert into services(seller_id,category,title,descr,location,seller_price,unit) values(?,?,?,?,?,?,?)",(u['id'],d['category'],d['title'],d.get('descr',''),d.get('location',''),p,d.get('unit','')),w=True);return{'ok':1}
def my_services(u,d):return{'rows':q("select id,category,title,location,seller_price,unit,status from services where seller_id=? order by id desc",(u['id'],))}
# seller sees orders with NO buyer identity
def seller_orders(u,d):return{'rows':q("select o.id,s.title,o.qty,o.qty*o.cost amount,o.status,o.payout,o.created from orders o join services s on s.id=o.service_id where s.seller_id=? and o.status!='new' order by o.id desc",(u['id'],))}
def send_query(u,d):
    if not d.get('subject') or not d.get('message'):return E('Please enter a subject and a message')
    q("insert into queries(uid,subject,message) values(?,?,?)",(u['id'],d['subject'],d['message']),w=True);return{'ok':1}
def my_queries(u,d):return{'rows':q("select subject,message,reply,created from queries where uid=? order by id desc",(u['id'],))}
def a_users(u,d):return{'rows':q("select id,name,email,phone,role,status from users where role!='admin' order by id desc")}
def a_user_status(u,d):
    if d.get('status') not in('approved','blocked','pending'):return E('bad status')
    q("update users set status=? where id=? and role!='admin'",(d['status'],d.get('id')),w=True);return{'ok':1}
def a_services(u,d):return{'rows':q("select s.*,u.name seller from services s join users u on u.id=s.seller_id order by s.id desc")}
def a_review(u,d):
    try:p=float(d.get('price') or 0)
    except:p=0
    if d.get('status')=='approved' and p<=0:return E('Please set a valid buyer price before approving')
    q("update services set status=?,price=? where id=?",(d['status'],p,d.get('id')),w=True);return{'ok':1}
def a_orders(u,d):return{'rows':q("select o.id,s.title,o.qty,o.price,o.cost,o.qty*o.price total,o.qty*(o.price-o.cost) margin,o.status,o.paid,o.payout,o.note,b.name buyer,b.email bemail,b.phone bphone,k.name seller,k.phone sphone from orders o join services s on s.id=o.service_id join users b on b.id=o.buyer_id join users k on k.id=s.seller_id order by o.id desc")}
def a_order_upd(u,d):
    f=d.get('f')
    if f not in('status','paid','payout'):return E('bad field')
    q(f"update orders set {f}=? where id=?",(d.get('v'),d.get('id')),w=True);return{'ok':1}
def a_queries(u,d):return{'rows':q("select x.id,x.subject,x.message,x.reply,x.created,u.name,u.role,u.email,u.phone from queries x join users u on u.id=x.uid order by (x.reply is null) desc,x.id desc")}
def a_reply(u,d):q("update queries set reply=? where id=?",(d.get('reply'),d.get('id')),w=True);return{'ok':1}
def a_stats(u,d):
    o=q("select count(*) n,coalesce(sum(case when status!='cancelled' then qty*price end),0) gross,coalesce(sum(case when status!='cancelled' then qty*(price-cost) end),0) margin,coalesce(sum(case when paid=1 and status!='cancelled' then qty*price end),0) collected,coalesce(sum(case when payout=0 and status in('confirmed','completed') then qty*cost end),0) owed from orders",one=True)
    o.update(buyers=q("select count(*) n from users where role='buyer'",one=True)['n'],sellers=q("select count(*) n from users where role='seller' and status='approved'",one=True)['n'],pend_sellers=q("select count(*) n from users where role='seller' and status='pending'",one=True)['n'],pend_services=q("select count(*) n from services where status='pending'",one=True)['n'],open_queries=q("select count(*) n from queries where reply is null",one=True)['n'],leads=q('select count(*) n from leads where done=0',one=True)['n'],new_orders=q("select count(*) n from orders where status='new'",one=True)['n']);return o
def enquiry(u,d):
    if not d.get('name') or not d.get('phone'):return E('Name and phone number are required')
    q("insert into leads(name,phone,email,need,message) values(?,?,?,?,?)",(d['name'][:100],d['phone'][:30],d.get('email','')[:100],d.get('need','')[:50],d.get('message','')[:1000]),w=True);return{'ok':1}
def a_leads(u,d):return{'rows':q("select * from leads order by done,id desc")}
def a_lead_done(u,d):q("update leads set done=? where id=?",(d.get('v'),d.get('id')),w=True);return{'ok':1}
A={'enquiry':(None,enquiry),'a_leads':(('admin',),a_leads),'a_lead_done':(('admin',),a_lead_done),'signup':(None,signup),'login':(None,login),'me':(None,me),'logout':('*',logout),'catalog':(None,catalog),'order':(('buyer',),order),'my_orders':(('buyer',),my_orders),'add_service':(('seller',),add_service),'my_services':(('seller',),my_services),'seller_orders':(('seller',),seller_orders),'send_query':(('buyer','seller'),send_query),'my_queries':(('buyer','seller'),my_queries),'a_users':(('admin',),a_users),'a_user_status':(('admin',),a_user_status),'a_services':(('admin',),a_services),'a_review':(('admin',),a_review),'a_orders':(('admin',),a_orders),'a_order_upd':(('admin',),a_order_upd),'a_queries':(('admin',),a_queries),'a_reply':(('admin',),a_reply),'a_stats':(('admin',),a_stats)}
class H(BaseHTTPRequestHandler):
    def log_message(s,*a):pass
    def send(s,code,body,ct='application/json',ck=None):
        b=body if isinstance(body,bytes) else json.dumps(body).encode();s.send_response(code);s.send_header('Content-Type',ct);s.send_header('Content-Length',str(len(b)))
        if ck:s.send_header('Set-Cookie',ck)
        s.end_headers();s.wfile.write(b)
    def do_GET(s):
        f={'/style.css':('style.css','text/css'),'/app.js':('app.js','application/javascript')}.get(s.path.split('?')[0],('index.html','text/html; charset=utf-8'))
        s.send(200,open(os.path.join(D,f[0]),'rb').read(),f[1]+('; charset=utf-8' if 'charset' not in f[1] else ''))
    def do_POST(s):
        a=s.path.split('/api/')[-1];s_=A.get(a)
        if not s_:return s.send(404,E('not found'))
        try:d=json.loads(s.rfile.read(int(s.headers.get('Content-Length',0))) or b'{}')
        except:return s.send(400,E('bad json'))
        tok=''.join(p.split('=',1)[1] for p in s.headers.get('Cookie','').split('; ') if p.startswith('tok='))
        r=q("select u.* from sessions x join users u on u.id=x.uid where x.tok=? and u.status='approved'",(tok,),one=True)
        roles=s_[0]
        if roles and (not r or (roles!='*' and r['role'] not in roles)):return s.send(403,E('Access denied'))
        out=s_[1](r,d);ck=None
        if a=='login' and out.get('token'):ck=f"tok={out.pop('token')}; HttpOnly; Path=/; SameSite=Strict"
        if a=='logout':q("delete from sessions where tok=?",(tok,),w=True);ck='tok=; Max-Age=0; Path=/'
        s.send(200,out,ck=ck)
if __name__=='__main__':
    init();p=int(os.environ.get('PORT',8000));print(f'Running on http://localhost:{p}  (admin@local / admin123)');ThreadingHTTPServer(('0.0.0.0',p),H).serve_forever()
