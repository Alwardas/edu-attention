/**
 * EduAttention - Authentication & Session Management
 * Simulates Firebase Auth with session persistence, role-based checks & quick demo logins.
 */

const SESSION_KEY = 'eduattention_session_user';

class AuthService {
  constructor() {
    this.currentUser = this.loadSession();
  }

  loadSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    }
    return null;
  }

  saveSession(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    window.dispatchEvent(new CustomEvent('eduattention:auth_changed', { detail: { user } }));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isTeacher() {
    return this.currentUser && this.currentUser.role === 'teacher';
  }

  isStudent() {
    return this.currentUser && this.currentUser.role === 'student';
  }

  login(email, password, role) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = window.db.getUserByEmail(email);
        if (!user) {
          return reject(new Error('No user found with this email address. Please register.'));
        }
        if (user.password !== password) {
          return reject(new Error('Incorrect password. Please try again.'));
        }
        if (role && user.role !== role) {
          return reject(new Error(`Account registered as ${user.role}. Please select the correct role.`));
        }

        this.saveSession(user);
        resolve(user);
      }, 400); // realistic async delay
    });
  }

  signup(name, email, password, role, department = 'Computer Engineering') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existing = window.db.getUserByEmail(email);
        if (existing) {
          return reject(new Error('An account with this email already exists.'));
        }

        const newUser = window.db.createUser({
          name,
          email,
          password,
          role,
          department
        });

        this.saveSession(newUser);
        resolve(newUser);
      }, 450);
    });
  }

  quickLogin(role = 'teacher') {
    const email = role === 'teacher' ? 'teacher@eduattention.com' : 'student@eduattention.com';
    const user = window.db.getUserByEmail(email);
    if (user) {
      this.saveSession(user);
      return user;
    }
    return null;
  }

  logout() {
    this.saveSession(null);
  }

  resetPassword(email) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = window.db.getUserByEmail(email);
        if (!user) {
          return reject(new Error('Email not found in our records.'));
        }
        resolve(true);
      }, 500);
    });
  }
}

// Global auth service singleton
window.auth = new AuthService();
