/**
 * EduAttention - Data Management & Real-Time Sync Bus
 * Uses localStorage for persistent demo state and BroadcastChannel for multi-tab live sync.
 */

const STORAGE_KEY = 'eduattention_state_v1';
const SYNC_CHANNEL_NAME = 'eduattention_live_channel';

// Default initial database state for college demonstration
const defaultDatabase = {
  users: [
    {
      id: 'usr_teacher_1',
      name: 'Prof. Sarah Johnson',
      email: 'teacher@eduattention.com',
      password: 'password123',
      role: 'teacher',
      department: 'Computer Science & Engineering',
      institution: 'Polytechnic Engineering Institute',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      activeClassesCount: 3,
      totalStudents: 148
    },
    {
      id: 'usr_student_1',
      name: 'Alex Rivera',
      email: 'student@eduattention.com',
      password: 'password123',
      role: 'student',
      rollNo: 'POLY-2024-CS042',
      department: 'Computer Engineering (Semester 5)',
      institution: 'Polytechnic Engineering Institute',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      enrolledClasses: ['EDU-101', 'EDU-204', 'EDU-305'],
      overallAttendance: 94,
      averageAttentionScore: 88
    }
  ],
  classes: [
    {
      id: 'EDU-101',
      code: 'EDU-101',
      title: 'Advanced Data Structures & Algorithms',
      subject: 'Computer Science',
      teacherId: 'usr_teacher_1',
      teacherName: 'Prof. Sarah Johnson',
      isLive: true,
      startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      scheduledTime: 'Today, 10:00 AM - 11:30 AM',
      roomCapacity: 60,
      activeParticipants: [
        { id: 'usr_student_1', name: 'Alex Rivera', role: 'student', attentionScore: 92, status: 'Focused', audio: false, video: true, joinedAt: '10:02 AM' },
        { id: 'usr_s2', name: 'Priya Sharma', role: 'student', attentionScore: 95, status: 'Focused', audio: false, video: true, joinedAt: '10:00 AM' },
        { id: 'usr_s3', name: 'Liam Chen', role: 'student', attentionScore: 84, status: 'Focused', audio: false, video: true, joinedAt: '10:05 AM' },
        { id: 'usr_s4', name: 'Michael Brown', role: 'student', attentionScore: 58, status: 'Distracted', audio: false, video: true, joinedAt: '10:08 AM' },
        { id: 'usr_s5', name: 'Emily Davis', role: 'student', attentionScore: 78, status: 'Moderate', audio: false, video: false, joinedAt: '10:12 AM' }
      ]
    },
    {
      id: 'EDU-204',
      code: 'EDU-204',
      title: 'Artificial Intelligence & Neural Networks',
      subject: 'Machine Learning',
      teacherId: 'usr_teacher_1',
      teacherName: 'Prof. Sarah Johnson',
      isLive: false,
      scheduledTime: 'Tomorrow, 02:00 PM - 03:30 PM',
      roomCapacity: 50,
      activeParticipants: []
    },
    {
      id: 'EDU-305',
      code: 'EDU-305',
      title: 'Mobile App Architecture & Android Development',
      subject: 'Software Engineering',
      teacherId: 'usr_teacher_1',
      teacherName: 'Prof. Sarah Johnson',
      isLive: false,
      scheduledTime: 'Completed Yesterday (1 hr 25m)',
      roomCapacity: 50,
      activeParticipants: []
    }
  ],
  attendanceLogs: [
    {
      id: 'att_1',
      classId: 'EDU-101',
      className: 'Advanced Data Structures & Algorithms',
      date: 'Today',
      studentId: 'usr_student_1',
      studentName: 'Alex Rivera',
      joinTime: '10:02 AM',
      leaveTime: 'Present Now',
      durationMinutes: 25,
      status: 'Present',
      attentionAverage: 92
    },
    {
      id: 'att_2',
      classId: 'EDU-305',
      className: 'Mobile App Architecture & Android Development',
      date: 'Yesterday',
      studentId: 'usr_student_1',
      studentName: 'Alex Rivera',
      joinTime: '11:00 AM',
      leaveTime: '12:25 PM',
      durationMinutes: 85,
      status: 'Present',
      attentionAverage: 87
    },
    {
      id: 'att_3',
      classId: 'EDU-204',
      className: 'Artificial Intelligence & Neural Networks',
      date: 'Oct 28',
      studentId: 'usr_student_1',
      studentName: 'Alex Rivera',
      joinTime: '02:00 PM',
      leaveTime: '03:30 PM',
      durationMinutes: 90,
      status: 'Present',
      attentionAverage: 89
    }
  ],
  chatMessages: [
    {
      id: 'msg_1',
      classId: 'EDU-101',
      senderId: 'usr_teacher_1',
      senderName: 'Prof. Sarah Johnson',
      role: 'teacher',
      text: 'Good morning everyone! Please make sure your camera is positioned at eye-level so the attention analyzer can calibrate properly.',
      timestamp: '10:01 AM',
      isPrivate: false
    },
    {
      id: 'msg_2',
      classId: 'EDU-101',
      senderId: 'usr_student_1',
      senderName: 'Alex Rivera',
      role: 'student',
      text: 'Good morning Professor! Camera calibrated and ready.',
      timestamp: '10:03 AM',
      isPrivate: false
    },
    {
      id: 'msg_3',
      classId: 'EDU-101',
      senderId: 'usr_s2',
      senderName: 'Priya Sharma',
      role: 'student',
      text: 'Can we ask questions via voice or chat during the binary tree demo?',
      timestamp: '10:04 AM',
      isPrivate: false
    },
    {
      id: 'msg_4',
      classId: 'EDU-101',
      senderId: 'usr_teacher_1',
      senderName: 'Prof. Sarah Johnson',
      role: 'teacher',
      text: 'Feel free to raise your virtual hand or drop your questions here in the chat!',
      timestamp: '10:05 AM',
      isPrivate: false
    }
  ],
  attentionHistory: [
    { time: '10:00', score: 94 },
    { time: '10:05', score: 91 },
    { time: '10:10', score: 88 },
    { time: '10:15', score: 95 },
    { time: '10:20', score: 82 },
    { time: '10:25', score: 90 }
  ]
};

// Data Store Class
class DataStore {
  constructor() {
    this.data = this.loadState();
    this.syncChannel = null;
    this.setupBroadcastChannel();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using default data:', e);
    }
    this.saveState(defaultDatabase);
    return JSON.parse(JSON.stringify(defaultDatabase));
  }

  saveState(customData = null) {
    try {
      const toSave = customData || this.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(defaultDatabase));
    this.saveState();
  }

  // Cross-Tab BroadcastChannel for Real-Time Live Classroom Sync
  setupBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        this.syncChannel.onmessage = (event) => {
          this.handleIncomingBroadcast(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this environment:', err);
      }
    }
  }

  broadcast(type, payload) {
    if (this.syncChannel) {
      try {
        this.syncChannel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (e) {
        console.warn('Broadcast error:', e);
      }
    }
  }

  handleIncomingBroadcast(data) {
    if (!data || !data.type) return;

    // Dispatch a custom event on window so UI modules can react in real time
    const customEvent = new CustomEvent('eduattention:sync', { detail: data });
    window.dispatchEvent(customEvent);

    // Also update internal state if applicable
    if (data.type === 'NEW_CHAT_MESSAGE') {
      const exists = this.data.chatMessages.some(m => m.id === data.payload.id);
      if (!exists) {
        this.data.chatMessages.push(data.payload);
        this.saveState();
      }
    } else if (data.type === 'STUDENT_ATTENTION_UPDATE') {
      const cls = this.getClass(data.payload.classId);
      if (cls && cls.activeParticipants) {
        const student = cls.activeParticipants.find(p => p.id === data.payload.studentId);
        if (student) {
          student.attentionScore = data.payload.score;
          student.status = data.payload.status;
          this.saveState();
        }
      }
    } else if (data.type === 'USER_JOINED_ROOM') {
      const cls = this.getClass(data.payload.classId);
      if (cls) {
        const exists = cls.activeParticipants.some(p => p.id === data.payload.participant.id);
        if (!exists) {
          cls.activeParticipants.push(data.payload.participant);
          this.saveState();
        }
      }
    }
  }

  // User Operations
  getUsers() {
    return this.data.users;
  }

  getUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(userData) {
    const newUser = {
      id: 'usr_' + Date.now(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'student',
      department: userData.department || 'Computer Engineering',
      institution: 'Polytechnic Engineering Institute',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      overallAttendance: 100,
      averageAttentionScore: 90,
      enrolledClasses: ['EDU-101'],
      activeClassesCount: 1,
      totalStudents: 0
    };
    this.data.users.push(newUser);
    this.saveState();
    return newUser;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (user) {
      Object.assign(user, updates);
      this.saveState();
    }
    return user;
  }

  // Class Operations
  getClasses() {
    return this.data.classes;
  }

  getClass(idOrCode) {
    return this.data.classes.find(c => c.id === idOrCode || c.code === idOrCode);
  }

  createClass(classData, teacher) {
    const code = 'EDU-' + Math.floor(100 + Math.random() * 900);
    const newClass = {
      id: code,
      code: code,
      title: classData.title || 'Untitled Classroom',
      subject: classData.subject || 'General Education',
      teacherId: teacher.id,
      teacherName: teacher.name,
      isLive: true,
      startedAt: new Date().toISOString(),
      scheduledTime: 'Now Active',
      roomCapacity: 60,
      activeParticipants: [
        {
          id: teacher.id,
          name: teacher.name,
          role: 'teacher',
          attentionScore: 100,
          status: 'Host',
          audio: true,
          video: true,
          joinedAt: 'Just now'
        }
      ]
    };
    this.data.classes.unshift(newClass);
    this.saveState();
    this.broadcast('CLASS_CREATED', newClass);
    return newClass;
  }

  endClass(classId) {
    const cls = this.getClass(classId);
    if (cls) {
      cls.isLive = false;
      cls.endedAt = new Date().toISOString();
      this.saveState();
      this.broadcast('CLASS_ENDED', { classId });
    }
  }

  joinClass(classId, user) {
    const cls = this.getClass(classId);
    if (!cls) return null;

    let participant = cls.activeParticipants.find(p => p.id === user.id);
    if (!participant) {
      participant = {
        id: user.id,
        name: user.name,
        role: user.role,
        attentionScore: 90,
        status: 'Focused',
        audio: false,
        video: true,
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      cls.activeParticipants.push(participant);
      this.saveState();
    }

    this.broadcast('USER_JOINED_ROOM', { classId, participant });
    return cls;
  }

  // Chat Operations
  getMessagesForClass(classId) {
    return this.data.chatMessages.filter(m => m.classId === classId);
  }

  sendMessage(classId, user, text, recipientId = null) {
    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      classId: classId,
      senderId: user.id,
      senderName: user.name,
      role: user.role,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPrivate: !!recipientId,
      recipientId: recipientId
    };
    this.data.chatMessages.push(newMsg);
    this.saveState();
    this.broadcast('NEW_CHAT_MESSAGE', newMsg);
    return newMsg;
  }

  // Attendance Records
  recordAttendance(student, classroom, score = 90) {
    const record = {
      id: 'att_' + Date.now(),
      classId: classroom.id,
      className: classroom.title,
      date: 'Today',
      studentId: student.id,
      studentName: student.name,
      joinTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leaveTime: 'Active',
      durationMinutes: 1,
      status: 'Present',
      attentionAverage: score
    };
    this.data.attendanceLogs.unshift(record);
    this.saveState();
    return record;
  }

  getStudentAttendance(studentId) {
    return this.data.attendanceLogs.filter(a => a.studentId === studentId);
  }

  getAllAttendance() {
    return this.data.attendanceLogs;
  }

  // Web Audio chime generator (runs purely in browser without external files!)
  playTone(type = 'chime') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'alert') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'hand') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {
      // Audio autoplay policy or error
    }
  }
}

// Global data store singleton
window.db = new DataStore();
