const express = require('express');
const { db } = require('../database/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.post('/', (req, res) => {
  try {
    const { leave_type, from_date, to_date, reason, district, reporting_officer,forwarding_officer } = req.body;
    const { employee_id, name } = req.user;
    if (!leave_type || !from_date || !to_date || !reason) {
      return res.status(400).json({ error: 'All fields are required: leave_type, from_date, to_date, reason' });
    }

    const validTypes = ['Tour', 'Casual Leave', 'Sick Leave', 'Earned Leave', 'Compensatory Off', 'Special Leave'];
    if (!validTypes.includes(leave_type)) {
      return res.status(400).json({ error: `Invalid leave type. Must be one of: ${validTypes.join(', ')}` });
    }
    if (leave_type === 'Tour' && !district) {
      return res.status(400).json({ error: 'District is required for Tour applications.' });
    }

    if (new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({ error: '"From date" cannot be after "To date".' });
    }

const result = db.prepare(`
  INSERT INTO leaves (
    employee_id,
    employee_name,
    leave_type,
    from_date,
    to_date,
    reason,
    district,
    reporting_officer,
    forwarding_officer,
    current_stage,
    status,
    applied_on
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`).run(
  employee_id,
  name,
  leave_type,
  from_date,
  to_date,
  reason.trim(),
  (district || '').trim(),
  (reporting_officer || '').trim(),
  (forwarding_officer || '').trim(),  
  leave_type === 'Tour' ? 'dd' : 'dir',                       
  'pending'                        
);

    const typeLabel = leave_type === 'Tour' ? 'Tour' : 'Leave';
    res.status(201).json({
      message: `${typeLabel} application submitted successfully!`,
      leave_id: result.lastInsertRowid,
    });
  } catch (err) {
    console.error('Apply leave error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
router.get('/my', (req, res) => {
  try {
    const { employee_id } = req.user;

    const leaves = db.prepare(`
      SELECT * FROM leaves WHERE employee_id = ? ORDER BY applied_on DESC
    `).all(employee_id);

    res.json({ leaves });
  } catch (err) {
    console.error('Fetch leaves error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
router.patch('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.user;

    const leave = db.prepare('SELECT * FROM leaves WHERE id = ? AND employee_id = ?').get(id, employee_id);

    if (!leave) {
      return res.status(404).json({ error: 'Leave application not found.' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel a leave that is already ${leave.status}.` });
    }

    db.prepare(`
      UPDATE leaves SET status = 'cancelled', action_on = datetime('now') WHERE id = ?
    `).run(id);

    res.json({ message: 'Leave application cancelled successfully.' });
  } catch (err) {
    console.error('Cancel leave error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
