const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Keep application data outside the source tree and allow tests to provide their own database.
const databasePath = process.env.TODO_DB_PATH || path.resolve(__dirname, '../../../data/todos.sqlite');
if (databasePath !== ':memory:') {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}
const db = new Database(databasePath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const validPriorities = ['High', 'Medium', 'Low'];

const serializeTask = (task) => ({
  ...task,
  completed: Boolean(task.completed),
  dueDate: task.due_date,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
});

const getTaskPayload = (body, { partial = false } = {}) => {
  const payload = {};

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'title')) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      return { error: 'Task title is required' };
    }
    payload.title = body.title.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'completed')) {
    if (typeof body.completed !== 'boolean') {
      return { error: 'Completed must be a boolean' };
    }
    payload.completed = body.completed ? 1 : 0;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
    if (body.dueDate !== null && body.dueDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
      return { error: 'Due date must use YYYY-MM-DD format' };
    }
    payload.due_date = body.dueDate || null;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'priority')) {
    const priority = body.priority || 'Medium';
    if (!validPriorities.includes(priority)) {
      return { error: 'Priority must be High, Medium, or Low' };
    }
    payload.priority = priority;
  }

  return { payload };
};

// Insert some initial data
const initialItems = ['Item 1', 'Item 2', 'Item 3'];
const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');

initialItems.forEach(item => {
  insertStmt.run(item);
});

console.log(`SQLite database initialized at ${databasePath}`);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// Task API
app.get('/api/tasks', (req, res) => {
  try {
    const { status, priority } = req.query;
    if (status && !['completed', 'incomplete', 'all'].includes(status)) {
      return res.status(400).json({ error: 'Status must be completed, incomplete, or all' });
    }
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be High, Medium, or Low' });
    }

    const conditions = [];
    const values = [];
    if (status === 'completed' || status === 'incomplete') {
      conditions.push('completed = ?');
      values.push(status === 'completed' ? 1 : 0);
    }
    if (priority) {
      conditions.push('priority = ?');
      values.push(priority);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const tasks = db.prepare(`
      SELECT * FROM tasks
      ${whereClause}
      ORDER BY due_date IS NULL, due_date ASC, created_at DESC
    `).all(...values);
    res.json(tasks.map(serializeTask));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { payload, error } = getTaskPayload(req.body || {});
    if (error) {
      return res.status(400).json({ error });
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, completed, due_date, priority)
      VALUES (?, ?, ?, ?)
    `).run(payload.title, payload.completed || 0, payload.due_date, payload.priority);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(serializeTask(task));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { payload, error } = getTaskPayload(req.body || {}, { partial: true });
    if (error || Object.keys(payload).length === 0) {
      return res.status(400).json({ error: error || 'At least one task field is required' });
    }

    const fields = Object.keys(payload);
    const assignments = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => payload[field]);
    db.prepare(`UPDATE tasks SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...values, id);
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(serializeTask(updatedTask));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully', id });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// API Routes
app.get('/api/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const result = insertStmt.run(name);
    const id = result.lastInsertRowid;

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = { app, db, insertStmt };