/**
 * EduAttention - Real-Time Chat Controller
 * Group classroom messaging & direct one-to-one messaging (Student-Teacher, Student-Student)
 * Real-time cross-tab sync via BroadcastChannel with interactive demo auto-responder.
 */

class ChatController {
  constructor() {
    this.activeClassId = 'EDU-101';
    this.currentChannel = 'public'; // 'public' or recipientUserId
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('eduattention:sync', (e) => {
      const { type, payload } = e.detail;
      if (type === 'NEW_CHAT_MESSAGE') {
        this.renderNewMessage(payload);
        window.db.playTone('chime');
      }
    });
  }

  initChat(classId = 'EDU-101') {
    this.activeClassId = classId;
    this.renderMessageHistory();
  }

  renderMessageHistory() {
    const chatContainer = document.getElementById('chatMessagesContainer');
    if (!chatContainer) return;

    const messages = window.db.getMessagesForClass(this.activeClassId);
    const currentUser = window.auth.getCurrentUser();

    chatContainer.innerHTML = '';

    messages.forEach(msg => {
      this.appendMessageElement(msg, currentUser);
    });

    this.scrollToBottom();
  }

  sendMessage(text, recipientId = null) {
    if (!text || !text.trim()) return;

    const user = window.auth.getCurrentUser();
    if (!user) return;

    const msg = window.db.sendMessage(this.activeClassId, user, text.trim(), recipientId);
    this.renderNewMessage(msg);

    // Auto-respond for realistic college demo presentation if alone in the room
    this.triggerSmartDemoResponse(text.trim(), user);
  }

  renderNewMessage(msg) {
    const chatContainer = document.getElementById('chatMessagesContainer');
    if (!chatContainer) return;

    const currentUser = window.auth.getCurrentUser();
    this.appendMessageElement(msg, currentUser);
    this.scrollToBottom();
  }

  appendMessageElement(msg, currentUser) {
    const chatContainer = document.getElementById('chatMessagesContainer');
    if (!chatContainer) return;

    const isSelf = currentUser && msg.senderId === currentUser.id;
    const isTeacher = msg.role === 'teacher';

    const msgDiv = document.createElement('div');
    msgDiv.className = `flex flex-col ${isSelf ? 'items-end' : 'items-start'} mb-3 space-y-1`;

    const roleBadge = isTeacher 
      ? '<span class="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-semibold ml-1">Teacher</span>'
      : '<span class="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded ml-1">Student</span>';

    msgDiv.innerHTML = `
      <div class="flex items-center gap-1.5 text-xs text-slate-400">
        <span class="font-medium ${isSelf ? 'text-indigo-400' : 'text-slate-300'}">${isSelf ? 'You' : msg.senderName}</span>
        ${roleBadge}
        <span class="text-[10px] text-slate-500">${msg.timestamp}</span>
      </div>
      <div class="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
        isSelf 
          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
          : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
      }">
        <p class="leading-relaxed break-words">${this.escapeHTML(msg.text)}</p>
      </div>
    `;

    chatContainer.appendChild(msgDiv);
  }

  scrollToBottom() {
    const chatContainer = document.getElementById('chatMessagesContainer');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

  // Simulated AI Classmate & Teacher response for smooth single-device demo
  triggerSmartDemoResponse(userText, currentUser) {
    const lower = userText.toLowerCase();

    // Only auto-reply if student is talking
    if (currentUser.role === 'student') {
      setTimeout(() => {
        let replyText = '';
        let sender = { id: 'usr_teacher_1', name: 'Prof. Sarah Johnson', role: 'teacher' };

        if (lower.includes('doubt') || lower.includes('question') || lower.includes('repeat')) {
          replyText = `Great question Alex! We will review that concept during our step-by-step code demonstration in just a moment.`;
        } else if (lower.includes('attention') || lower.includes('camera') || lower.includes('ai')) {
          replyText = `The attention monitoring module tracks face presence & orientation locally to calculate focus metrics for your report.`;
        } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('good morning')) {
          replyText = `Welcome to class! Please make sure your audio is muted while the lecture is in progress.`;
        } else {
          replyText = `Noted! Thanks for participating in the live discussion.`;
        }

        const simMsg = window.db.sendMessage(this.activeClassId, sender, replyText);
        this.renderNewMessage(simMsg);
        window.db.playTone('chime');
      }, 1500);
    }
  }
}

// Global chat singleton
window.chat = new ChatController();
