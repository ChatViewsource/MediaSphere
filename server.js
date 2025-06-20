const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// اتصال بقاعدة البيانات
mongoose.connect('mongodb://localhost:27017/w_chat', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

// نموذج المستخدم
const User = mongoose.model('User', {
  phone: { type: String, unique: true },
  verified: Boolean,
  contacts: [String]
});

// نموذج الرسالة
const Message = mongoose.model('Message', {
  from: String,
  to: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

app.use(bodyParser.json());
app.use(express.static('public'));

const server = app.listen(3000, () => {
  console.log('الخادم يعمل على port 3000');
});

const io = socketio(server);

// التحقق من رقم الهاتف الجزائري
function validateAlgerianPhone(phone) {
  const regex = /^(00213|\+213|0)(5|6|7)[0-9]{8}$/;
  return regex.test(phone);
}

// API للتسجيل
app.post('/api/register', async (req, res) => {
  const { phone } = req.body;
  
  if (!validateAlgerianPhone(phone)) {
    return res.status(400).json({ error: 'رقم هاتف غير صحيح' });
  }

  try {
    const user = new User({ phone, verified: false });
    await user.save();
    // هنا يجب إرسال رمز التحقق عبر SMS
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في التسجيل' });
  }
});

// اتصالات Socket.io
io.on('connection', (socket) => {
  console.log('مستخدم متصل');

  socket.on('join', (phone) => {
    socket.join(phone);
  });

  socket.on('message', async (data) => {
    const { from, to, text } = data;
    
    // حفظ الرسالة في قاعدة البيانات
    const message = new Message({ from, to, text });
    await message.save();
    
    // إرسال الرسالة للمستلم
    io.to(to).emit('message', { from, text });
  });

  socket.on('disconnect', () => {
    console.log('مستخدم انقطع');
  });
});
