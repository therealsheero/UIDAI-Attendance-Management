/* ══════════════════════════════════════════════════════════
   Auth JS — Login & Registration Logic
   ══════════════════════════════════════════════════════════ */

const API_BASE = '';

// ─── Toast Notifications ──────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Check if already logged in ──────────────────────────
// (function checkAuth() {
//   const token = localStorage.getItem('token');
//   const user = JSON.parse(localStorage.getItem('user') || 'null');

//   if (token && user) {
//     // Already logged in — redirect
//     if (data.user.role === 'hr') {

//   if (['DD', 'DIR'].includes(data.user.officer)) {
//     window.location.href = '/hr.html';
//   } 
//   else if (data.user.officer === 'DDG') {
//     window.location.href = '/ddg.html';
//   }

// }else {
//       window.location.href = '/employee.html';
//     }
//   }
// })();

(function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (token && user) {

    if (user.role === 'hr') {

      // DB has "Dir", "Dd", "Ddg"
      const officer = user.officer?.toLowerCase();

      // if (['dd', 'dir'].includes(officer)) {
      //   window.location.href = '/hr.html';
      // } 
      // else if (officer === 'ddg') {
      //   window.location.href = '/ddg.html';R
      // }
      if (user.role === 'hr') {
        window.location.href = '/hr.html';

       }} else {
      window.location.href = '/employee.html';
    }
  }
})();

// ─── Login Form ──────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const employeeId = document.getElementById('employeeId').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');

    if (!employeeId || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Signing in...';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showToast('Login successful! Redirecting...', 'success');

      // setTimeout(() => {
      //   if (data.user.role === 'hr') {
      //     window.location.href = '/hr.html';
      //   } else {
      //     window.location.href = '/employee.html';
      //   }
      // }, 800);
      setTimeout(() => {

  if (data.user.role === 'hr') {

    const officer = data.user.officer?.toLowerCase();

    // if (['dd', 'dir'].includes(officer)) {
    //   window.location.href = '/hr.html';
    // } 
    // else if (officer === 'ddg') {
    //   window.location.href = '/ddg.html';
    // } 
    if (data.user.role === 'hr') {
  window.location.href = '/hr.html';
}
    else {
      window.location.href = '/index.html';
    }

  } else {
    window.location.href = '/employee.html';
  }

}, 800);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = 'Sign In';
    }
  });
}

// ─── Registration Form ──────────────────────────────────
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const employeeId = document.getElementById('employeeId').value.trim();
    const name = document.getElementById('name').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('registerBtn');

    if (!employeeId || !name || !password || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 4) {
      showToast('Password must be at least 4 characters.', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Creating account...';

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      showToast(data.message, 'success');

      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1500);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    }
  });
}
