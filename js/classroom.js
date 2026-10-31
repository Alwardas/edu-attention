/**
 * EduAttention - Real-Time Online Classroom Controller
 * Handles MediaStream (Camera/Mic), Screen Sharing, Multi-Participant Grid,
 * Controls, and Real-Time Cross-Tab State Synchronization.
 */

class ClassroomController {
  constructor() {
    this.currentRoom = null;
    this.localStream = null;
    this.screenStream = null;
    this.isAudioMuted = false;
    this.isVideoMuted = false;
    this.isScreenSharing = false;
    this.isHandRaised = false;

    // Track simulated or connected peers
    this.participants = [];

    // Session duration timer
    this.startTime = null;
    this.timerInterval = null;
    this.elapsedSeconds = 0;

    this.bindEvents();
  }

  bindEvents() {
    // Listen for cross-tab sync events
    window.addEventListener('eduattention:sync', (e) => {
      const { type, payload } = e.detail;
      this.handleSyncMessage(type, payload);
    });
  }

  // Handle incoming broadcast events from other tabs
  handleSyncMessage(type, payload) {
    if (!this.currentRoom) return;

    if (type === 'USER_JOINED_ROOM') {
      if (payload.classId === this.currentRoom.id) {
        const exists = this.participants.some(p => p.id === payload.participant.id);
        if (!exists) {
          this.participants.push(payload.participant);
          this.renderParticipantGrid();
          this.updateParticipantCounters();
          window.db.playTone('chime');
          window.showToast?.(`${payload.participant.name} joined the classroom`, 'info');
        }
      }
    } else if (type === 'STUDENT_ATTENTION_UPDATE') {
      if (payload.classId === this.currentRoom.id) {
        const student = this.participants.find(p => p.id === payload.studentId);
        if (student) {
          student.attentionScore = payload.score;
          student.status = payload.status;
          this.updateStudentTileAttention(payload.studentId, payload.score, payload.status);
        }
      }
    } else if (type === 'HAND_RAISED') {
      if (payload.classId === this.currentRoom.id) {
        const student = this.participants.find(p => p.id === payload.studentId);
        if (student) {
          student.handRaised = payload.raised;
          this.updateStudentTileHand(payload.studentId, payload.raised);
          if (payload.raised && window.auth.isTeacher()) {
            window.db.playTone('hand');
            window.showToast?.(`✋ ${student.name} raised hand!`, 'warning');
          }
        }
      }
    } else if (type === 'CLASS_ENDED') {
      if (payload.classId === this.currentRoom.id) {
        if (window.auth.isStudent()) {
          this.handleTeacherEndedClass();
        }
      }
    } else if (type === 'MUTE_ALL_REQUEST') {
      if (payload.classId === this.currentRoom.id && window.auth.isStudent()) {
        this.muteAudio(true);
        window.showToast?.('Host muted all microphones', 'warning');
      }
    }
  }

  // Initialize and start classroom session
  async startRoom(classId) {
    const cls = window.db.getClass(classId);
    if (!cls) {
      window.showToast?.('Classroom not found', 'error');
      return false;
    }

    this.currentRoom = cls;
    window.activeClassroom = cls;
    const user = window.auth.getCurrentUser();

    // Populate participants
    this.participants = JSON.parse(JSON.stringify(cls.activeParticipants || []));

    // Ensure self is in participants
    let selfInList = this.participants.find(p => p.id === user.id);
    if (!selfInList) {
      selfInList = {
        id: user.id,
        name: user.name,
        role: user.role,
        attentionScore: 92,
        status: user.role === 'teacher' ? 'Host' : 'Focused',
        audio: true,
        video: true,
        joinedAt: 'Just now'
      };
      this.participants.unshift(selfInList);
      window.db.joinClass(classId, user);
    }

    // Start timer
    this.startTime = Date.now();
    this.elapsedSeconds = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay();
    }, 1000);

    // Request Camera & Microphone
    await this.setupMediaDevices();

    // Attach Attention Tracking if user is a student
    if (window.auth.isStudent()) {
      const localVideo = document.getElementById('localVideoFeed');
      const hudCanvas = document.getElementById('localAttentionCanvas');
      if (localVideo && hudCanvas) {
        window.attentionEngine.attach(localVideo, hudCanvas);
      }
    }

    this.renderParticipantGrid();
    this.updateParticipantCounters();
    window.db.playTone('chime');
    return true;
  }

  // Camera & Mic setup
  async setupMediaDevices() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      this.localStream = stream;
      const localVideo = document.getElementById('localVideoFeed');
      if (localVideo) {
        localVideo.srcObject = stream;
        localVideo.play().catch(e => console.warn('Autoplay error:', e));
      }
      return true;
    } catch (err) {
      console.warn('Camera/mic access unavailable or blocked:', err);
      window.showToast?.('Camera preview using simulated video feed (Permissions disabled)', 'warning');
      this.setupFallbackVisualFeed();
      return false;
    }
  }

  // Fallback synthetic animated feed if real webcam is not available on test device
  setupFallbackVisualFeed() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let tick = 0;
    const drawPlaceholder = () => {
      tick += 0.05;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 640, 480);

      // Draw simulated avatar & motion
      const user = window.auth.getCurrentUser();
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(320 + Math.sin(tick) * 15, 210, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 22px "Plus Jakarta Sans"';
      ctx.textAlign = 'center';
      ctx.fillText(user ? user.name : 'Student', 320, 340);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Live Video Stream Active', 320, 370);

      requestAnimationFrame(drawPlaceholder);
    };
    drawPlaceholder();

    const stream = canvas.captureStream(25);
    this.localStream = stream;
    const localVideo = document.getElementById('localVideoFeed');
    if (localVideo) {
      localVideo.srcObject = stream;
      localVideo.play().catch(e => console.warn(e));
    }
  }

  // Toggle Microphone
  toggleAudio() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        this.isAudioMuted = !this.isAudioMuted;
        audioTracks.forEach(t => t.enabled = !this.isAudioMuted);
      }
    } else {
      this.isAudioMuted = !this.isAudioMuted;
    }
    this.updateControlsUI();
    return this.isAudioMuted;
  }

  muteAudio(forceMute = true) {
    this.isAudioMuted = forceMute;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => t.enabled = !forceMute);
    }
    this.updateControlsUI();
  }

  // Toggle Camera
  toggleVideo() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        this.isVideoMuted = !this.isVideoMuted;
        videoTracks.forEach(t => t.enabled = !this.isVideoMuted);
      }
    } else {
      this.isVideoMuted = !this.isVideoMuted;
    }
    this.updateControlsUI();
    return this.isVideoMuted;
  }

  // Screen Sharing
  async toggleScreenShare() {
    if (this.isScreenSharing) {
      // Stop screen share
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(t => t.stop());
        this.screenStream = null;
      }
      this.isScreenSharing = false;
      const localVideo = document.getElementById('localVideoFeed');
      if (localVideo && this.localStream) {
        localVideo.srcObject = this.localStream;
        localVideo.classList.remove('non-mirrored');
      }
      this.updateControlsUI();
      window.showToast?.('Screen sharing stopped', 'info');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        this.screenStream = stream;
        this.isScreenSharing = true;

        const localVideo = document.getElementById('localVideoFeed');
        if (localVideo) {
          localVideo.srcObject = stream;
          localVideo.classList.add('non-mirrored'); // Don't mirror screen presentation
        }

        stream.getVideoTracks()[0].onended = () => {
          this.toggleScreenShare();
        };

        this.updateControlsUI();
        window.showToast?.('Sharing screen with classroom', 'success');
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    }
  }

  // Raise Hand
  toggleRaiseHand() {
    this.isHandRaised = !this.isHandRaised;
    const user = window.auth.getCurrentUser();

    window.db.broadcast('HAND_RAISED', {
      classId: this.currentRoom.id,
      studentId: user.id,
      raised: this.isHandRaised
    });

    if (this.isHandRaised) {
      window.db.playTone('hand');
      window.showToast?.('Hand raised! Teacher has been notified.', 'success');
    } else {
      window.showToast?.('Hand lowered', 'info');
    }

    this.updateControlsUI();
    this.updateStudentTileHand(user.id, this.isHandRaised);
  }

  // Teacher End Classroom
  endClassroom() {
    if (!this.currentRoom) return;

    if (confirm('Are you sure you want to end this online class for all participants?')) {
      const classId = this.currentRoom.id;
      window.db.endClass(classId);
      this.cleanup();
      window.showToast?.('Classroom session ended successfully.', 'success');
      window.app.navigate('analytics', { classId });
    }
  }

  // Student Leave Classroom
  leaveClassroom() {
    if (confirm('Leave current online classroom?')) {
      const user = window.auth.getCurrentUser();
      const summary = window.attentionEngine.getSummary();

      // Record final attendance
      window.db.recordAttendance(user, this.currentRoom, summary.averageScore);

      this.cleanup();
      window.showToast?.('You have left the classroom.', 'info');
      window.app.navigate('student-dashboard');
    }
  }

  // When teacher ends class, student is notified
  handleTeacherEndedClass() {
    const user = window.auth.getCurrentUser();
    const summary = window.attentionEngine.getSummary();
    window.db.recordAttendance(user, this.currentRoom, summary.averageScore);
    this.cleanup();

    // Show class ended modal with attention performance card
    window.app.showClassEndedSummaryModal(this.currentRoom, summary);
  }

  // Cleanup streams and timers
  cleanup() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    window.attentionEngine.detach();
    this.currentRoom = null;
    window.activeClassroom = null;
  }

  // Render video participant grid
  renderParticipantGrid() {
    const gridContainer = document.getElementById('classroomParticipantsGrid');
    if (!gridContainer) return;

    const currentUser = window.auth.getCurrentUser();
    const isTeacher = window.auth.isTeacher();

    // Render other participants (excluding self who has the local spotlight/HUD preview)
    const otherParticipants = this.participants.filter(p => p.id !== currentUser.id);

    gridContainer.innerHTML = otherParticipants.map(student => {
      const score = student.attentionScore || 90;
      const isFocused = score >= 80;
      const isDistracted = score < 80 && score >= 55;
      const badgeColor = isFocused ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        (isDistracted ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30');

      return `
        <div id="participant-card-${student.id}" class="video-container relative group aspect-video sm:aspect-[4/3] flex flex-col justify-between p-3 border border-slate-700/60 shadow-lg">
          <!-- Live Attention Meter Badge (Crucial for Teacher View) -->
          <div class="flex items-center justify-between z-20">
            <span id="attention-badge-${student.id}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor} backdrop-blur-md">
              <span class="w-2 h-2 rounded-full ${isFocused ? 'bg-emerald-400 animate-pulse' : (isDistracted ? 'bg-amber-400' : 'bg-rose-400')}"></span>
              <span id="attention-text-${student.id}">AI Attention: ${score}%</span>
            </span>

            <span id="hand-badge-${student.id}" class="${student.handRaised ? 'flex' : 'hidden'} items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-xs font-bold shadow-md animate-bounce">
              ✋ Hand Raised
            </span>
          </div>

          <!-- Video simulation / Avatar card -->
          <div class="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-0 overflow-hidden">
            <div class="relative w-20 h-20 rounded-full border-2 border-indigo-500/40 p-1 flex items-center justify-center shadow-inner">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}" alt="${student.name}" class="w-full h-full rounded-full object-cover">
              <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <i class="fa-solid fa-video text-[9px] text-white"></i>
              </div>
            </div>
            
            <!-- Subtle attention scan beam for simulated student -->
            <div class="radar-beam"></div>
          </div>

          <!-- Bottom Student Info Bar -->
          <div class="relative z-10 flex items-center justify-between mt-auto bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
            <div class="flex items-center gap-2 truncate">
              <span class="text-xs font-semibold text-white truncate">${student.name}</span>
              ${student.role === 'teacher' ? '<span class="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.5 rounded">Host</span>' : ''}
            </div>

            <div class="flex items-center gap-2 text-slate-400 text-xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <i class="fa-solid fa-microphone-slash text-[11px] text-slate-400"></i>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update specific student tile attention score dynamically
  updateStudentTileAttention(studentId, score, status) {
    const textEl = document.getElementById(`attention-text-${studentId}`);
    const badgeEl = document.getElementById(`attention-badge-${studentId}`);
    if (!textEl || !badgeEl) return;

    textEl.textContent = `AI Attention: ${score}%`;
    const isFocused = score >= 80;
    const isDistracted = score < 80 && score >= 55;

    badgeEl.className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ` +
      (isFocused ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
      (isDistracted ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'));
  }

  // Update hand raise state on student tile
  updateStudentTileHand(studentId, raised) {
    const badgeEl = document.getElementById(`hand-badge-${studentId}`);
    if (badgeEl) {
      if (raised) {
        badgeEl.classList.remove('hidden');
        badgeEl.classList.add('flex');
      } else {
        badgeEl.classList.add('hidden');
        badgeEl.classList.remove('flex');
      }
    }
  }

  // Update timer in top bar
  updateTimerDisplay() {
    const timerEl = document.getElementById('classroomTimer');
    if (!timerEl) return;

    const mins = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (this.elapsedSeconds % 60).toString().padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
  }

  // Update header participant count
  updateParticipantCounters() {
    const countEl = document.getElementById('participantCountBadge');
    if (countEl) {
      countEl.textContent = `${this.participants.length} Active`;
    }
  }

  // Update controls UI state
  updateControlsUI() {
    const micBtn = document.getElementById('btnToggleMic');
    const camBtn = document.getElementById('btnToggleCam');
    const screenBtn = document.getElementById('btnToggleScreen');
    const handBtn = document.getElementById('btnToggleHand');

    if (micBtn) {
      micBtn.className = this.isAudioMuted 
        ? 'p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-all'
        : 'p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-all border border-slate-700';
      micBtn.innerHTML = this.isAudioMuted 
        ? '<i class="fa-solid fa-microphone-slash text-base"></i>'
        : '<i class="fa-solid fa-microphone text-base"></i>';
    }

    if (camBtn) {
      camBtn.className = this.isVideoMuted
        ? 'p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-all'
        : 'p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-all border border-slate-700';
      camBtn.innerHTML = this.isVideoMuted
        ? '<i class="fa-solid fa-video-slash text-base"></i>'
        : '<i class="fa-solid fa-video text-base"></i>';
    }

    if (screenBtn) {
      screenBtn.className = this.isScreenSharing
        ? 'p-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-all'
        : 'p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-all border border-slate-700';
    }

    if (handBtn) {
      handBtn.className = this.isHandRaised
        ? 'p-3 rounded-full bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/25 transition-all animate-bounce'
        : 'p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-all border border-slate-700';
    }
  }
}

// Global classroom singleton
window.classroom = new ClassroomController();
