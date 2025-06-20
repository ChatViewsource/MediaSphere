document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  let currentUser = null;
  
  // عناصر DOM
  const authModal = document.getElementById('auth-modal');
  const phoneInput = document.getElementById('phone-input');
  const verifyButton = document.getElementById('verify-button');
  const verificationCode = document.getElementById('verification-code');
  const codeInput = document.getElementById('code-input');
  const submitCode = document.getElementById('submit-code');
  const userPhoneElement = document.getElementById('user-phone');
  const contactsList = document.getElementById('contacts-list');
  const messagesContainer = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const chatWithElement = document.getElementById('chat-with');
  
  let currentChat = null;

  // عرض واجهة التسجيل إذا لم يكن مسجلاً
  authModal.style.display = 'flex';

  // التحقق من رقم الهاتف
  verifyButton.addEventListener('click', async () => {
    const phone = phoneInput.value;
    
    if (!validateAlgerianPhone(phone)) {
      alert('الرجاء إدخال رقم هاتف جزائري صحيح (مثال: 0551234567)');
      return;
    }
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      
      if (response.ok) {
        verificationCode.style.display = 'block';
      } else {
        alert('حدث خطأ أثناء التسجيل');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في الاتصال بالخادم');
    }
  });

  // تأكيد رمز التحقق
  submitCode.addEventListener('click', () => {
    const code = codeInput.value;
    const phone = phoneInput.value;
    
    if (code.length !== 4) {
      alert('الرجاء إدخال رمز التحقق المكون من 4 أرقام');
      return;
    }
    
    // هنا يجب التحقق من صحة الرمز
    // لأغراض العرض، سنعتبر أن أي رمز صحيح
    
    currentUser = phone;
    userPhoneElement.textContent = phone;
    authModal.style.display = 'none';
    socket.emit('join', phone);
    
    // تحميل جهات الاتصال (مثال)
    loadContacts();
  });

  // إرسال رسالة
  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentChat) return;
    
    const message = {
      from: currentUser,
      to: currentChat,
      text
    };
    
    socket.emit('message', message);
    
    // عرض الرسالة المرسلة
    displayMessage({ ...message, isSent: true });
    messageInput.value = '';
  }

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // استقبال رسائل جديدة
  socket.on('message', (message) => {
    if (message.from === currentChat) {
      displayMessage({ ...message, isSent: false });
    }
  });

  // عرض الرسائل
  function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(message.isSent ? 'sent' : 'received');
    messageElement.textContent = message.text;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // تحميل جهات الاتصال (مثال)
  function loadContacts() {
    // في تطبيق حقيقي، سيتم جلب هذه البيانات من الخادم
    const mockContacts = ['0551234567', '0669876543', '0774561234'];
    
    contactsList.innerHTML = '';
    mockContacts.forEach(contact => {
      const contactElement = document.createElement('div');
      contactElement.classList.add('contact');
      contactElement.textContent = contact;
      contactElement.addEventListener('click', () => {
        currentChat = contact;
        chatWithElement.textContent = contact;
        loadChatHistory(contact);
      });
      contactsList.appendChild(contactElement);
    });
  }

  // تحميل سجل المحادثة (مثال)
  function loadChatHistory(contact) {
    messagesContainer.innerHTML = '';
    // في تطبيق حقيقي، سيتم جلب هذه البيانات من الخادم
    const mockMessages = [
      { from: contact, to: currentUser, text: 'مرحبا!', isSent: false },
      { from: currentUser, to: contact, text: 'أهلا وسهلا!', isSent: true }
    ];
    
    mockMessages.forEach(message => {
      displayMessage(message);
    });
  }

  // دالة التحقق من رقم الهاتف الجزائري
  function validateAlgerianPhone(phone) {
    const regex = /^(00213|\+213|0)(5|6|7)[0-9]{8}$/;
    return regex.test(phone);
  }
});
