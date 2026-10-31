/**
 * EduAttention - Main Application Router & UI Controller
 * Manages view transitions, modals, toast alerts, URL query routing, and UI events.
 */

class AppController {
  constructor() {
    this.currentView = 'view-auth';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkUrlParameters();
    this.renderInitialView();
  }

  // Handle URL parameters for instant demo joining (e.g. ?room=EDU-101&role=student)
  checkUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const roleParam = params.get('role');

    if (roomParam) {
      // Auto quick-login based on role param
      const role = roleParam === 'teacher' ? 'teacher' : 'student';
      window.auth.quickLogin(role);
      setTimeout(() => {
        this.joinClassroom(roomParam);
      }, 500);
    }
  }

  setupEventListeners() {
    // Auth state change listener
    window.addEventListener('eduattention:auth_changed', (e) => {
      this.handleAuthStateChange(e.detail.user);
    });

    // Attention engine update listener
    window.attentionEngine.onUpdateCallback = (data) => {
      this.updateAttentionHUD(data);
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  handleAuthStateChange(user) {
    if (!user) {
      this.navigate('auth');
    } else {
      this.updateNavbarUser(user);
      if (user.role === 'teacher') {
        this.navigate('teacher-dashboard');
      } else {
        this.navigate('student-dashboard');
      }
    }
  }

  renderInitialView() {
    const user = window.auth.getCurrentUser();
    if (user) {
      this.updateNavbarUser(user);
      if (user.role === 'teacher') {
        this.navigate('teacher-dashboard');
      } else {
        this.navigate('student-dashboard');
      }
    } else {
      this.navigate('auth');
    }
  }

  // View Navigation
  navigate(viewName, params = {}) {
    const views = [
      'view-auth',
      'view-teacher-dashboard',
      'view-student-dashboard',
      'view-classroom',
      'view-analytics',
      'view-profile'
    ];

    const targetId = `view-${viewName}`;
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === targetId) {
          el.classList.remove('hidden');
          el.classList.add('block');
        } else {
          el.classList.add('hidden');
          el.classList.remove('block');
        }
      }
    });

    this.currentView = targetId;

    // View specific hooks
    if (viewName === 'teacher-dashboard') {
      this.renderTeacherDashboard();
    } else if (viewName === 'student-dashboard') {
      this.renderStudentDashboard();
    } else if (viewName === 'analytics') {
      window.analytics.initAnalytics(params.classId);
    } else if (viewName === 'profile') {
      this.renderProfile();
    }

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update top navigation user info
  updateNavbarUser(user) {
    const userNav = document.getElementById('navbarUserSection');
    const authNav = document.getElementById('navbarAuthSection');
    const userNameEl = document.getElementById('navUserName');
    const userRoleEl = document.getElementById('navUserRole');
    const userAvatarEl = document.getElementById('navUserAvatar');

    if (user) {
      if (userNav) userNav.classList.remove('hidden');
      if (authNav) authNav.classList.add('hidden');
      if (userNameEl) userNameEl.textContent = user.name;
      if (userRoleEl) userRoleEl.textContent = user.role.toUpperCase();
      if (userAvatarEl) userAvatarEl.src = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
    } else {
      if (userNav) userNav.classList.add('hidden');
      if (authNav) authNav.classList.remove('hidden');
    }
  }

  // Teacher Dashboard Rendering
  renderTeacherDashboard() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    const teacherNameEl = document.getElementById('teacherWelcomeName');
    if (teacherNameEl) teacherNameEl.textContent = user.name;

    const activeClassesContainer = document.getElementById('teacherActiveClassesList');
    if (activeClassesContainer) {
      const classes = window.db.getClasses();
      activeClassesContainer.innerHTML = classes.map(cls => {
        const participantCount = cls.activeParticipants ? cls.activeParticipants.length : 0;
        return `
          <div class="glass-card rounded-2xl p-5 border border-slate-200/80 hover:shadow-xl transition-all duration-300">
            <div class="flex items-start justify-between mb-3">
              <div>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls.isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}">
                  ${cls.isLive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Now' : 'Scheduled'}
                </span>
                <h3 class="text-lg font-bold text-slate-800 mt-2">${cls.title}</h3>
                <p class="text-sm text-slate-500">${cls.subject} • Room Code: <span class="font-mono font-bold text-indigo-600">${cls.code}</span></p>
              </div>
              <div class="text-right">
                <span class="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-600">${cls.scheduledTime}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <div class="flex items-center gap-3 text-xs text-slate-500">
                <span><i class="fa-solid fa-users text-slate-400 mr-1"></i> ${participantCount} Students</span>
                <span><i class="fa-solid fa-brain text-indigo-500 mr-1"></i> AI Attention: 91% Avg</span>
              </div>

              <div class="flex items-center gap-2">
                <button onclick="app.copyClassroomLink('${cls.code}')" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 transition">
                  <i class="fa-regular fa-copy"></i> Share Link
                </button>
                <button onclick="app.joinClassroom('${cls.id}')" class="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 transition">
                  ${cls.isLive ? '<i class="fa-solid fa-door-open"></i> Enter Classroom' : '<i class="fa-solid fa-play"></i> Start Class'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Student Dashboard Rendering
  renderStudentDashboard() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    const studentNameEl = document.getElementById('studentWelcomeName');
    if (studentNameEl) studentNameEl.textContent = user.name;

    const enrolledClassesContainer = document.getElementById('studentEnrolledClassesList');
    if (enrolledClassesContainer) {
      const classes = window.db.getClasses();
      enrolledClassesContainer.innerHTML = classes.map(cls => {
        return `
          <div class="glass-card rounded-2xl p-5 border border-slate-200/80 hover:shadow-xl transition-all duration-300">
            <div class="flex items-start justify-between mb-3">
              <div>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls.isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}">
                  ${cls.isLive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Session' : 'Scheduled'}
                </span>
                <h3 class="text-lg font-bold text-slate-800 mt-2">${cls.title}</h3>
                <p class="text-sm text-slate-500">Instructor: ${cls.teacherName}</p>
              </div>
              <span class="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded">${cls.code}</span>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <div class="text-xs text-slate-500">
                <i class="fa-regular fa-clock text-slate-400 mr-1"></i> ${cls.scheduledTime}
              </div>

              <div>
                ${cls.isLive 
                  ? `<button onclick="app.joinClassroom('${cls.id}')" class="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition">
                      <i class="fa-solid fa-video"></i> Join Live Class
                     </button>`
                  : `<button disabled class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed">Not Started</button>`
                }
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Profile Rendering
  renderProfile() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const roleEl = document.getElementById('profileRole');
    const deptEl = document.getElementById('profileDepartment');
    const avatarEl = document.getElementById('profileAvatar');

    if (nameEl) nameEl.value = user.name;
    if (emailEl) emailEl.value = user.email;
    if (roleEl) roleEl.value = user.role.toUpperCase();
    if (deptEl) deptEl.value = user.department || 'Computer Engineering';
    if (avatarEl) avatarEl.src = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
  }

  // Join online classroom
  async joinClassroom(classId) {
    const cls = window.db.getClass(classId);
    if (!cls) {
      this.showToast('Classroom not found. Please check the code.', 'error');
      return;
    }

    // Check attention privacy consent
    if (window.auth.isStudent() && !window.attentionEngine.hasConsent()) {
      this.pendingClassroomToJoin = classId;
      this.openModal('modalPrivacyConsent');
      return;
    }

    this.navigate('classroom');
    document.getElementById('classroomTitleHeader').textContent = cls.title;
    document.getElementById('classroomSubjectHeader').textContent = `${cls.subject} • Code: ${cls.code}`;

    // Show/hide teacher-specific or student-specific controls
    const isTeacher = window.auth.isTeacher();
    const teacherControls = document.getElementById('teacherOnlyControls');
    const studentControls = document.getElementById('studentOnlyControls');
    const studentHudOverlay = document.getElementById('studentAttentionOverlay');

    if (teacherControls) teacherControls.style.display = isTeacher ? 'flex' : 'none';
    if (studentControls) studentControls.style.display = isTeacher ? 'none' : 'flex';
    if (studentHudOverlay) studentHudOverlay.style.display = isTeacher ? 'none' : 'block';

    // Initialize media & room
    await window.classroom.startRoom(classId);

    // Initialize in-classroom chat
    window.chat.initChat(classId);
  }

  // Copy share link to clipboard
  copyClassroomLink(roomCode) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}&role=student`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.showToast(`Classroom join link copied to clipboard!`, 'success');
    }).catch(() => {
      prompt('Copy this classroom joining link:', shareUrl);
    });
  }

  // Update live attention indicators on student HUD
  updateAttentionHUD(data) {
    const scoreEl = document.getElementById('hudAttentionScore');
    const statusEl = document.getElementById('hudAttentionStatus');
    const barEl = document.getElementById('hudAttentionBar');

    if (scoreEl) scoreEl.textContent = `${data.score}%`;
    if (statusEl) {
      statusEl.textContent = data.status;
      statusEl.className = data.status === 'Focused' 
        ? 'text-xs font-bold text-emerald-400' 
        : (data.status === 'Distracted' ? 'text-xs font-bold text-amber-400' : 'text-xs font-bold text-rose-400');
    }
    if (barEl) {
      barEl.style.width = `${data.score}%`;
      barEl.className = `h-2 rounded-full transition-all duration-300 ` + 
        (data.score >= 80 ? 'bg-emerald-500' : (data.score >= 55 ? 'bg-amber-500' : 'bg-rose-500'));
    }
  }

  // Show summary modal when teacher ends class
  showClassEndedSummaryModal(classroom, summary) {
    const modal = document.getElementById('modalClassEndedSummary');
    if (!modal) return;

    document.getElementById('summaryClassName').textContent = classroom.title;
    document.getElementById('summaryAvgScore').textContent = `${summary.averageScore}%`;
    document.getElementById('summaryFocusedPercent').textContent = `${summary.focusedPercent}%`;
    document.getElementById('summaryDistractedPercent').textContent = `${summary.distractedPercent}%`;

    this.openModal('modalClassEndedSummary');
  }

  // Toast Notification System
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const bgMap = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-500 text-slate-900',
      info: 'bg-slate-900 text-white'
    };

    const iconMap = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${bgMap[type] || bgMap.info}`;
    toast.innerHTML = `
      <i class="fa-solid ${iconMap[type] || iconMap.info} text-base"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Modals management
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }
}

// Global App singleton
window.app = new AppController();
window.showToast = (msg, type) => window.app.showToast(msg, type);
