/* ══════════════════════════════════════════════════════════
   DDG Dashboard JS — Tour Approval Only
   ══════════════════════════════════════════════════════════ */

const API_BASE = '';
let allLeaves = [];
let actionLeaveId = null;
let actionType = null;

// ─── Auth Check ──
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user || user.role !== 'hr') {
  window.location.href = '/index.html';
}

const officer = user.officer?.toLowerCase();

if (officer !== 'ddg') {
  window.location.href = '/index.html';
}

// ─── Populate user info ─────────────────────────────────
document.getElementById('userName').textContent = user.name;

// ─── Toast ───────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── Utility ─────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status) {
  const map = {
    pending: '<span class="badge badge-pending">⏳ Pending</span>',
    approved: '<span class="badge badge-approved">✅ Approved</span>',
    rejected: '<span class="badge badge-rejected">❌ Rejected</span>',
  };
  return map[status] || status;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
function downloadCSV(data, filename = 'ddg_tours.csv') {
  if (!data.length) {
    showToast('No data to download', 'error');
    return;
  }

  const headers = [
    'Employee ID',
    'Employee Name',
    'Type',
    'From Date',
    'To Date',
    'Reason',
    'District',
    'Forwarding Officer',
    'Approving Authority',
    'Stage',
    'Status',
    'Applied On'
  ];

  const rows = data.map(l => [
    l.employee_id,
    l.employee_name,
    l.leave_type,
    l.from_date,
    l.to_date,
    l.reason,
    l.district || '',
    l.forwarding_officer || '',
    l.reporting_officer || '',
    l.current_stage || '',
    l.status,
    l.applied_on
  ]);

  let csvContent =
    headers.join(',') + '\n' +
    rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  window.URL.revokeObjectURL(url);
}
document.getElementById('downloadAllCsvBtn').addEventListener('click', () => {
  const filtered = allLeaves.filter(l =>
    l.leave_type === 'Tour' && l.current_stage === 'ddg'
  );

  downloadCSV(filtered, 'ddg_tours_current.csv');
});

document.getElementById('downloadMonthlyCsvBtn').addEventListener('click', () => {
  const monthInput = document.getElementById('monthPicker').value;

  if (!monthInput) {
    showToast('Please select a month', 'error');
    return;
  }

  const [year, month] = monthInput.split('-');

  const filtered = allLeaves.filter(l => {
    if (l.leave_type !== 'Tour') return false;

    const d = new Date(l.applied_on);
    return (
      d.getFullYear() == year &&
      (d.getMonth() + 1) == month
    );
  });

  downloadCSV(filtered, `ddg_tours_${year}_${month}.csv`);
});
// ─── Fetch Leaves ───────────────────────────────────
async function fetchAllLeaves() {
  try {
    const res = await fetch(`${API_BASE}/api/hr/leaves`, {
      headers: authHeaders(),
    });

    const data = await res.json();
    allLeaves = data.leaves || [];
    renderAllLeaves();
    updateStats();
  } catch (err) {
    showToast('Failed to load data', 'error');
  }
}

// ─── Render Table ────────────────────────────
function renderAllLeaves() {
  const tbody = document.getElementById('allLeavesBody');

  const filtered = allLeaves.filter(l =>
    l.leave_type === 'Tour' && l.current_stage === 'ddg'
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="14">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h4>No forwarded tours</h4>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${l.employee_id}</td>
      <td>${l.employee_name}</td>
      <td>${l.leave_type}</td>
      <td>${formatDate(l.from_date)}</td>
      <td>${formatDate(l.to_date)}</td>
      <td>${l.reason}</td>
      <td>${l.district || '—'}</td>
      <td>${l.forwarding_officer || '—'}</td>
<td>${l.reporting_officer || '—'}</td>
<td>${l.current_stage || '—'}</td>
      <td>${formatDateTime(l.applied_on)}</td>
      <td>${getStatusBadge(l.status)}</td>
      <td>${l.action_by_name || '—'}</td>
      <td>${formatDateTime(l.action_on)}</td>

      <td>
        ${l.status === 'pending'
          ? `<button class="btn btn-success btn-sm" onclick="openActionModal(${l.id}, 'approved')">Approve</button>
             <button class="btn btn-danger btn-sm" onclick="openActionModal(${l.id}, 'rejected')">Reject</button>`
          : '—'}
      </td>
    </tr>
  `).join('');
}
function updateStats() {
  const tours = allLeaves.filter(l => l.leave_type === 'Tour');

  const pending = tours.filter(l => l.status === 'pending').length;
  const approved = tours.filter(l => l.status === 'approved').length;
  const rejected = tours.filter(l => l.status === 'rejected').length;

  document.getElementById('ddgPending').textContent = pending;
  document.getElementById('ddgApproved').textContent = approved;
  document.getElementById('ddgRejected').textContent = rejected;
  document.getElementById('ddgTotal').textContent = tours.length;
}
// ─── Action Modal ─────────────────────────────
function openActionModal(id, action) {
  actionLeaveId = id;
  actionType = action;
  document.getElementById('actionModal').classList.remove('hidden');
}

document.getElementById('actionModalConfirm').addEventListener('click', async () => {
  const res = await fetch(`${API_BASE}/api/hr/leaves/${actionLeaveId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ action: actionType }),
  });

  const data = await res.json();
//   showToast(data.message, 'success');
//   fetchAllLeaves();
if (!res.ok) {
  throw new Error(data.error || 'Action failed');
}

showToast(data.message || 'Success', 'success');

// ✅ CLOSE MODAL
document.getElementById('actionModal').classList.add('hidden');

// ✅ RESET
actionLeaveId = null;
actionType = null;

// ✅ REFRESH
fetchAllLeaves();
});
document.getElementById('actionModalClose').addEventListener('click', () => {
  document.getElementById('actionModal').classList.add('hidden');
  actionLeaveId = null;
  actionType = null;
});
// ─── Logout ─────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/index.html';
});

// ─── Init ─────────────────────────────
const monthPicker = document.getElementById('monthPicker');
if (monthPicker) {
  const now = new Date();
  const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  monthPicker.value = formatted;
}
fetchAllLeaves();