/**
 * سيرفر بسيط (Node.js + Express) لموقع محمد عمر موتورز.
 * ده كود تشغّله إنت بنفسك على جهازك أو أي استضافة (مش شغال أوتوماتيك من غير ما تشغّله).
 *
 * طريقة التشغيل:
 *   1) نزّل Node.js من https://nodejs.org
 *   2) في مجلد backend-starter افتح تيرمنال واكتب: npm install
 *   3) شغّل السيرفر: npm start
 *   4) السيرفر هيشتغل على: http://localhost:3000
 *
 * البيانات بتتخزن في ملف db.json (قاعدة بيانات بسيطة كملف — كافية للبداية).
 * لو المشروع كبر، ينفع تتحول لاحقًا لـ PostgreSQL أو MongoDB.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '15mb' })); // limit كبير عشان الصور base64

// ---------- قاعدة بيانات بسيطة (ملف JSON) ----------
function readDB(){
  if(!fs.existsSync(DB_PATH)){
    const initial = { cars: [], bookings: [], accounts: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function writeDB(data){
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---------- السيارات (الأسطول) ----------
app.get('/api/cars', (req, res)=>{
  const db = readDB();
  res.json(db.cars);
});

app.post('/api/cars', (req, res)=>{
  const db = readDB();
  const newCar = { id: Date.now(), ...req.body };
  db.cars.push(newCar);
  writeDB(db);
  res.json(newCar);
});

app.put('/api/cars/:id', (req, res)=>{
  const db = readDB();
  const idx = db.cars.findIndex(c=> String(c.id) === req.params.id);
  if(idx === -1) return res.status(404).json({ error: 'car not found' });
  db.cars[idx] = { ...db.cars[idx], ...req.body };
  writeDB(db);
  res.json(db.cars[idx]);
});

app.delete('/api/cars/:id', (req, res)=>{
  const db = readDB();
  db.cars = db.cars.filter(c=> String(c.id) !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ---------- الحجوزات ----------
app.get('/api/bookings', (req, res)=>{
  const db = readDB();
  const { phone } = req.query;
  const result = phone ? db.bookings.filter(b=> b.phone === phone) : db.bookings;
  res.json(result);
});

app.post('/api/bookings', (req, res)=>{
  const db = readDB();
  const newBooking = {
    id: 'BK-' + Date.now().toString().slice(-6),
    status: 'قيد الانتظار',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  db.bookings.push(newBooking);
  writeDB(db);
  res.json(newBooking);
});

app.put('/api/bookings/:id/status', (req, res)=>{
  const db = readDB();
  const booking = db.bookings.find(b=> b.id === req.params.id);
  if(!booking) return res.status(404).json({ error: 'booking not found' });
  booking.status = req.body.status;
  writeDB(db);
  res.json(booking);
});

// ---------- الحسابات (تسجيل الدخول) ----------
app.post('/api/accounts', (req, res)=>{
  const db = readDB();
  const { phone } = req.body;
  let account = db.accounts.find(a=> a.phone === phone);
  if(account){
    Object.assign(account, req.body);
  } else {
    account = { ...req.body, createdAt: new Date().toISOString() };
    db.accounts.push(account);
  }
  writeDB(db);
  res.json(account);
});

app.get('/api/accounts/:phone', (req, res)=>{
  const db = readDB();
  const account = db.accounts.find(a=> a.phone === req.params.phone);
  if(!account) return res.status(404).json({ error: 'account not found' });
  res.json(account);
});

app.listen(PORT, ()=>{
  console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
});
