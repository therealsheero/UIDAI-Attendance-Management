  /* ══════════════════════════════════════════════════════════
    HR Dashboard JS — Leave Management & Stats
    ══════════════════════════════════════════════════════════ */

  const API_BASE = '';
  let allLeaves = [];
  let currentFilter = 'pending';
  let actionLeaveId = null;
  let actionType = null;

  // ─── Auth Check ──
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const officer = user.officer?.toLowerCase();
  const roleLabel =
    officer === 'dir' ? 'Director' :
      officer === 'dd' ? 'Deputy Director' :
        officer === 'ddg' ? 'Deputy Director General' :
          'HR';

  document.querySelector('.user-role').textContent = roleLabel;
  if (!token || !user || user.role !== 'hr') {
    window.location.href = '/index.html';
  }

  document.getElementById('userName').textContent = user.name;

  // ─── Toast ───────────────────────────────────────────────
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
      cancelled: '<span class="badge badge-cancelled">🚫 Cancelled</span>',
    };
    return map[status] || status;
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // ─── Set today's date ───────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  // document.getElementById('viewDate').value = today;
  document.getElementById('fromDate').value = today;
document.getElementById('toDate').value = today;
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short'
  });

  // Set default month for CSV export
  document.getElementById('csvMonth').value = today.substring(0, 7);

  // ─── Fetch Dashboard Stats ──────────────────────────────
  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/api/hr/stats`, {
        headers: authHeaders(),
      });

      if (res.status === 401) {
        localStorage.clear();
        window.location.href = '/index.html';
        return;
      }

      const data = await res.json();

      document.getElementById('todayOnLeave').textContent = data.today.on_leave;
      document.getElementById('pendingCount').textContent = data.today.pending;
    } catch (err) {
      showToast('Failed to load stats.', 'error');
    }
  }

  // ─── Fetch Leaves by Date ───────────────────────────────

async function fetchLeavesByRange(from, to) {
  try {

    const res = await fetch(
      `${API_BASE}/api/hr/leaves/range?from=${from}&to=${to}`,
      {
        headers: authHeaders(),
      }
    );

    const data = await res.json();

    const leaves = data.leaves || [];

    document.getElementById(
      'selectedDateCount'
    ).textContent = data.count;

    const tbody =
      document.getElementById('dateLeavesBody');

    if (!leaves.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <h4>No leaves found</h4>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    9
    renderRangeTable(leaves);

  } catch (err) {
  console.error(err);

  showToast(
    'Failed to load leaves',
    'error'
  );
}
}

  // async function fetchLeavesByDate(date) {
  //   try {
  //     const res = await fetch(`${API_BASE}/api/hr/leaves/date/${date}`, {
  //       headers: authHeaders(),
  //     });

  //     const data = await res.json();
  //     const leaves = data.leaves || [];

  //     document.getElementById('selectedDateCount').textContent = data.count;

  //     const tbody = document.getElementById('dateLeavesBody');

  //     if (leaves.length === 0) {
  //       tbody.innerHTML = `
  //         <tr>
  //           <td colspan="8">
  //             <div class="empty-state">
  //               <div class="empty-icon">🎉</div>
  //               <h4>No one on leave</h4>
  //               <p>No leave applications for ${formatDate(date)}</p>
  //             </div>
  //           </td>
  //         </tr>
  //       `;
  //       return;
  //     }

  //     tbody.innerHTML = leaves.map((l, i) => `
  //       <tr class="
  //   ${l.leave_type === 'Tour' ? 'tour-row' : ''}
  //   ${l.current_stage === 'dd' ? 'stage-dd' : ''}
  //   ${l.current_stage === 'ddg' ? 'stage-ddg' : ''}
  // ">
  //         <td>${i + 1}</td>
  //         <td>${l.employee_id}</td>
  //         <td>${l.employee_name}</td>
  //         <td><span class="leave-type-tag ${l.leave_type === 'Tour' ? 'tour-tag' : ''}">
  //   ${l.leave_type}
  // </span></td>
  //         <td><span class="date-display">${formatDateTime(l.applied_on)}</span></td>
  //         <td>
  //         ${formatDate(l.from_date)}
  //         <br>
  //         <span class="date-display">→ ${formatDate(l.to_date)}</span>
  //       </td>
  //         <td>${getStatusBadge(l.status)}</td>
  //         <td title="${l.reason}">${l.reason.length > 25 ? l.reason.substring(0, 25) + '…' : l.reason}</td>
  //         <td>${l.district || '—'}</td>
  //         <td>${l.forwarding_officer || '—'}</td>
  // <td>${l.reporting_officer || '—'}</td>
  //       </tr>
  //     `).join('');
  //   } catch (err) {
  //     showToast('Failed to load date leaves.', 'error');
  //   }
  // }


  function renderRangeTable(leaves) {
  const tbody = document.getElementById('dateLeavesBody');

  tbody.innerHTML = leaves.map((l, i) => `
    <tr class="
      ${l.leave_type === 'Tour' ? 'tour-row' : ''}
      ${l.current_stage === 'dd' ? 'stage-dd' : ''}
      ${l.current_stage === 'ddg' ? 'stage-ddg' : ''}
    ">
      <td>${i + 1}</td>
      <td>${l.employee_id}</td>
      <td>${l.employee_name}</td>

      <td>
        <span class="leave-type-tag ${l.leave_type === 'Tour' ? 'tour-tag' : ''}">
          ${l.leave_type}
        </span>
      </td>

      <td>
        <span class="date-display">
          ${formatDateTime(l.applied_on)}
        </span>
      </td>

      <td>
        ${formatDate(l.from_date)}
        <br>
        <span class="date-display">
          → ${formatDate(l.to_date)}
        </span>
      </td>

      <td>${getStatusBadge(l.status)}</td>

      <td title="${l.reason}">
        ${l.reason.length > 25
          ? l.reason.substring(0, 25) + '…'
          : l.reason}
      </td>

      <td>${l.district || '—'}</td>

      <td>${l.forwarding_officer || '—'}</td>

      <td>${l.reporting_officer || '—'}</td>
    </tr>
  `).join('');
}
  async function fetchAllLeaves() {
    try {
      const res = await fetch(`${API_BASE}/api/hr/leaves`, {
        headers: authHeaders(),
      });

      const data = await res.json();
      allLeaves = data.leaves || [];
      renderAllLeaves();
    } catch (err) {
      showToast('Failed to load leave requests.', 'error');
    }
  }

  // ─── Render All Leaves Table ────────────────────────────
  function renderAllLeaves() {
    const tbody = document.getElementById('allLeavesBody');
    //   let filtered = allLeaves;

    // if (currentFilter === 'tour') {
    //   filtered = allLeaves.filter(l => l.leave_type === 'Tour');
    // } 
    // else if (currentFilter !== 'all') {
    //   filtered = allLeaves.filter(l => l.status === currentFilter);
    // }
    let filtered = allLeaves;

    // 🔥 ROLE BASED FILTER FIRST
    if (officer === 'dir') {
      filtered = filtered.filter(l => l.leave_type !== 'Tour');
    }
    else if (officer === 'dd') {
      filtered = filtered.filter(l =>
        l.leave_type === 'Tour' && l.current_stage === 'dd'
      );
    }
    else if (officer === 'ddg') {
      filtered = filtered.filter(l =>
        l.leave_type === 'Tour' && l.current_stage === 'ddg'
      );
    }

    // 🔥 THEN APPLY TABS
    if (currentFilter === 'tour') {
      filtered = filtered.filter(l => l.leave_type === 'Tour');
    }
    else if (currentFilter !== 'all') {
      filtered = filtered.filter(l => l.status === currentFilter);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="12">
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <h4>No ${currentFilter === 'all' ? '' : currentFilter} leave requests</h4>
              <p>No leave applications with this status</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((l, i) => `
      <tr class="
    ${l.leave_type === 'Tour' ? 'tour-row' : ''}
    ${l.current_stage === 'dd' ? 'stage-dd' : ''}
    ${l.current_stage === 'ddg' ? 'stage-ddg' : ''}
  ">
        <td>${i + 1}</td>
        <td>${l.employee_id}</td>
        <td>${l.employee_name}</td>
        <td><span class="leave-type-tag ${l.leave_type === 'Tour' ? 'tour-tag' : ''}">${l.leave_type}</span></td>
<td>
  ${formatDate(l.from_date)}
  <br>
  <span class="date-display">→ ${formatDate(l.to_date)}</span>
</td>
        <td title="${l.reason}">${l.reason.length > 20 ? l.reason.substring(0, 20) + '…' : l.reason}</td>
        <td>${l.district || '—'}</td>
        <td>${l.forwarding_officer || '—'}</td>
  <td>${l.reporting_officer || '—'}</td>
        <td><span class="date-display">${formatDateTime(l.applied_on)}</span></td>

        <td>${getStatusBadge(l.status)}</td>
        <td>
  ${
    l.action_by_name
      ? `
        ${l.action_by_name}
        <br>
        <span class="date-display">
          ${formatDateTime(l.action_on)}
        </span>
      `
      : '—'
  }
</td>
  <td>
  ${
      // 🔵 TOUR LOGIC
      l.leave_type === 'Tour'
        ? (
          // DD → Forward
          officer === 'dd' && l.current_stage === 'dd'
            ? `<div class="action-btns">
              <button class="btn btn-warning btn-sm" onclick="forwardToDDG(${l.id})">➡️ Forward</button>
              <button class="btn btn-danger btn-sm" onclick="openActionModal(${l.id}, 'rejected')">❌ Reject</button>
              </div>`

            // DDG → Approve/Reject
            : officer === 'ddg' && l.current_stage === 'ddg' && l.status === 'pending'
              ? `<div class="action-btns">
                <button class="btn btn-success btn-sm" onclick="openActionModal(${l.id}, 'approved')">✅ Approve</button>
                <button class="btn btn-danger btn-sm" onclick="openActionModal(${l.id}, 'rejected')">❌ Reject</button>
              </div>`

              : '<span class="text-muted">—</span>'
        )

        // 🟢 NORMAL LEAVE
        : (
          officer === 'dir' && l.status === 'pending'
            ? `<div class="action-btns">
              <button class="btn btn-success btn-sm" onclick="openActionModal(${l.id}, 'approved')">✅ Approve</button>
              <button class="btn btn-danger btn-sm" onclick="openActionModal(${l.id}, 'rejected')">❌ Reject</button>
            </div>`
            : '<span class="text-muted">—</span>'
        )
      }
  </td>
      </tr>
    `).join('');
  }

  // ─── Filter Tabs ────────────────────────────────────────
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderAllLeaves();
    });
  });

  // ─── Date View Buttons ──────────────────────────────────
  // document.getElementById('viewDateBtn').addEventListener('click', () => {
  //   const date = document.getElementById('viewDate').value;
  //   if (date) fetchLeavesByDate(date);
  // });
  document
  .getElementById('viewRangeBtn')
  .addEventListener('click', () => {

    const from =
      document.getElementById('fromDate').value;

    const to =
      document.getElementById('toDate').value;

    if (!from || !to) {
      showToast(
        'Select both dates',
        'error'
      );
      return;
    }

    fetchLeavesByRange(from, to);
  });

  document.getElementById('todayBtn').addEventListener('click', () => {
    // document.getElementById('viewDate').value = today;
    document.getElementById('fromDate').value = today;
document.getElementById('toDate').value = today;

fetchLeavesByRange(today, today);
    // fetchLeavesByDate(today);
  });

  // Also trigger on date input change
  // document.getElementById('viewDate').addEventListener('change', function () {
  //   if (this.value) fetchLeavesByDate(this.value);
  // });

  // ─── Action Modal ───────────────────────────────────────
  function openActionModal(leaveId, action) {
    actionLeaveId = leaveId;
    actionType = action;

    const title = document.getElementById('actionModalTitle');
    const text = document.getElementById('actionModalText');
    const confirmBtn = document.getElementById('actionModalConfirm');

    if (action === 'approved') {
      title.textContent = '✅ Approve Leave';
      text.textContent = 'Are you sure you want to approve this leave application?';
      confirmBtn.className = 'btn btn-success btn-sm';
      confirmBtn.textContent = 'Yes, Approve';
    } else {
      title.textContent = '❌ Reject Leave';
      text.textContent = 'Are you sure you want to reject this leave application?';
      confirmBtn.className = 'btn btn-danger btn-sm';
      confirmBtn.textContent = 'Yes, Reject';
    }

    document.getElementById('actionModal').classList.remove('hidden');
  }

  document.getElementById('actionModalClose').addEventListener('click', () => {
    document.getElementById('actionModal').classList.add('hidden');
    actionLeaveId = null;
    actionType = null;
  });

  document.getElementById('actionModalConfirm').addEventListener('click', async () => {
    if (!actionLeaveId || !actionType) return;

    const btn = document.getElementById('actionModalConfirm');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Processing...';

    try {
      const res = await fetch(`${API_BASE}/api/hr/leaves/${actionLeaveId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ action: actionType }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Action failed.');

      showToast(data.message, 'success');
      document.getElementById('actionModal').classList.add('hidden');
      actionLeaveId = null;
      actionType = null;

      // Refresh everything
      await Promise.all([
  fetchStats(),
  fetchAllLeaves(),
  fetchLeavesByRange(
    document.getElementById('fromDate').value,
    document.getElementById('toDate').value
  )
]);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = actionType === 'approved' ? 'Yes, Approve' : 'Yes, Reject';
    }
  });

  // Close modal on overlay click
  document.getElementById('actionModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('actionModal').classList.add('hidden');
      actionLeaveId = null;
      actionType = null;
    }
  });
  async function forwardToDDG(id) {
    try {
      const res = await fetch(`${API_BASE}/api/hr/forward/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Forward failed');

      showToast(data.message, 'success');
      fetchAllLeaves(); // refresh table

    } catch (err) {
      showToast(err.message || 'Forward failed', 'error');
    }
  }
  // ─── Logout ─────────────────────────────────────────────
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });

  // ─── Init ───────────────────────────────────────────────
fetchStats();
fetchAllLeaves();
fetchLeavesByRange(today, today);

  // ─── CSV Utilities ──────────────────────────────────────


async function showTodayLeaves() {

  try {

    const today =
      new Date()
      .toISOString()
      .split('T')[0];

    const res = await fetch(
      `${API_BASE}/api/hr/leaves/date/${today}`,
      {
        headers: authHeaders()
      }
    );

    const data = await res.json();

    const tbody =
      document.getElementById(
        'todayLeaveModalBody'
      );

    const leaves =
      data.leaves || [];

    if (!leaves.length) {

      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            No employees on leave today
          </td>
        </tr>
      `;

    } else {

      tbody.innerHTML =
        leaves.map((l,i)=>`

          <tr>
            <td>${i+1}</td>
            <td>${l.employee_id}</td>
            <td>${l.employee_name}</td>
            <td>${l.leave_type}</td>

            <td>
              ${formatDate(l.from_date)}
              <br>
              →
              ${formatDate(l.to_date)}
            </td>
          </tr>

        `).join('');
    }

    document
      .getElementById('todayLeaveModal')
      .classList
      .remove('hidden');

  } catch(err) {

    showToast(
      'Failed to load today leaves',
      'error'
    );
  }
}
document
.getElementById('todayLeaveCard')
.addEventListener('click', showTodayLeaves);

document
.getElementById('closeTodayLeaveModal')
.addEventListener('click', () => {

  document
  .getElementById('todayLeaveModal')
  .classList
  .add('hidden');

});

  function downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function escapeCSV(val) {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
document.getElementById('downloadRangeCsvBtn')
.addEventListener('click', async () => {

  const from =
    document.getElementById('fromDate').value;

  const to =
    document.getElementById('toDate').value;

  if (!from || !to) {
    showToast('Select both dates', 'error');
    return;
  }

  try {

    const res = await fetch(
      `${API_BASE}/api/hr/leaves/range?from=${from}&to=${to}`,
      {
        headers: authHeaders()
      }
    );

    const data = await res.json();

    const leaves = data.leaves || [];

    if (!leaves.length) {
      showToast('No data found', 'error');
      return;
    }

    const csv = leavesToCSV(leaves);

    downloadCSV(
      `leave_range_${from}_to_${to}.csv`,
      csv
    );

    showToast(
      `${leaves.length} records exported`,
      'success'
    );

  } catch (err) {
    showToast('Export failed', 'error');
  }

});
  function leavesToCSV(leaves) {
    const headers = ['#', 'Employee ID', 'Employee Name', 'Leave Type', 'From', 'To', 'Reason', 'District', 'Reporting Officer', 'Status', 'Applied On', 'Action By', 'Action By Name', 'Action On'];
    const rows = leaves.map((l, i) => [
      i + 1,
      l.employee_id,
      l.employee_name,
      l.leave_type,
      l.from_date,
      l.to_date,
      l.reason,
      l.district || '',
      l.reporting_officer || '',
      l.status,
      l.applied_on,
      l.action_by || '',
      l.action_by_name || '',
      l.action_on || '',
    ].map(escapeCSV).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // ─── Month-wise CSV Download ────────────────────────────
  document.getElementById('downloadMonthCsvBtn').addEventListener('click', async () => {
    const monthVal = document.getElementById('csvMonth').value;
    if (!monthVal) {
      showToast('Please select a month to export.', 'error');
      return;
    }

    const btn = document.getElementById('downloadMonthCsvBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Exporting...';

    try {
      // Fetch all leaves and filter for the selected month client-side
      const res = await fetch(`${API_BASE}/api/hr/leaves`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      const leaves = data.leaves || [];

      // Filter: leaves whose date range overlaps with the selected month
      const monthStart = monthVal + '-01';
      const [y, m] = monthVal.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const monthEnd = monthVal + '-' + String(lastDay).padStart(2, '0');

      const filtered = leaves.filter(l =>
        l.from_date <= monthEnd && l.to_date >= monthStart &&
        (l.status === 'approved' || l.status === 'pending')
      );

      if (filtered.length === 0) {
        showToast('No leaves found for this month.', 'info');
        return;
      }

      const csv = leavesToCSV(filtered);
      const monthName = new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      downloadCSV(`leaves_${monthVal}.csv`, csv);
      showToast(`Exported ${filtered.length} leaves for ${monthName}`, 'success');
    } catch (err) {
      showToast('Failed to export CSV.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '\ud83d\udce5 Month CSV';
    }
  });

  // ─── All Leaves CSV Download ────────────────────────────
  document.getElementById('downloadAllCsvBtn').addEventListener('click', () => {
    let dataToExport = allLeaves;

    if (currentFilter !== 'all') {
      dataToExport = allLeaves.filter(l => l.status === currentFilter);
    }

    if (dataToExport.length === 0) {
      showToast('No data to export.', 'error');
      return;
    }

    const csv = leavesToCSV(dataToExport);
    const filterLabel = currentFilter === 'all' ? 'all' : currentFilter;
    downloadCSV(`leave_requests_${filterLabel}.csv`, csv);
    showToast('CSV downloaded!', 'success');
  });
