import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      const query = params.toString();
      const response = await fetch(`/api/tasks${query ? `?${query}` : ''}`);
      if (!response.ok) {
        throw new Error('Unable to load tasks');
      }
      setTasks(await response.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const resetForm = () => {
    setTitle('');
    setDueDate('');
    setPriority('Medium');
    setEditingTask(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('A task title is required.');
      return;
    }

    try {
      const response = await fetch(editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks', {
        method: editingTask ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim(), dueDate: dueDate || null, priority }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Unable to save task');
      }

      resetForm();
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!response.ok) {
        throw new Error('Unable to update task status');
      }
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Unable to delete task');
      }
      setTaskToDelete(null);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDueDate(task.dueDate || '');
    setPriority(task.priority);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="App">
      <Container maxWidth="lg" component="main">
        <header className="App-header">
          <Typography component="p" className="eyebrow">PERSONAL PLANNING</Typography>
          <Typography component="h1" variant="h2">Today's task list</Typography>
          <Typography component="p" className="subtitle">Make room for what matters next.</Typography>
        </header>

        <Box component="section" className="task-composer" aria-labelledby="composer-title">
          <Typography id="composer-title" variant="h5">{editingTask ? 'Edit task' : 'Add a task'}</Typography>
          <Box component="form" onSubmit={handleSubmit} className="task-form">
            <TextField
              label="Task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs doing?"
              required
              fullWidth
              inputProps={{ maxLength: 120 }}
            />
            <TextField
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="task-priority-label">Priority</InputLabel>
              <Select labelId="task-priority-label" value={priority} label="Priority" onChange={(event) => setPriority(event.target.value)}>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} className="form-actions">
              <Button type="submit" variant="contained">{editingTask ? 'Save changes' : 'Add task'}</Button>
              {editingTask && <Button type="button" variant="outlined" onClick={resetForm}>Cancel</Button>}
            </Stack>
          </Box>
        </Box>

        <Box component="section" className="task-board" aria-labelledby="task-list-title">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} className="task-board-header">
            <Box>
              <Typography id="task-list-title" variant="h5">Your tasks</Typography>
              <Typography component="p" className="muted">Sorted by the nearest due date.</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} className="filters" aria-label="Task filters">
              <FormControl size="small" fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select labelId="status-filter-label" value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="all">All tasks</MenuItem>
                  <MenuItem value="incomplete">Incomplete</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel id="priority-filter-label">Priority</InputLabel>
                <Select labelId="priority-filter-label" value={priorityFilter} label="Priority" onChange={(event) => setPriorityFilter(event.target.value)}>
                  <MenuItem value="all">All priorities</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          {error && <Alert severity="error" role="alert" className="feedback">{error}</Alert>}
          {loading && <Typography className="state-message">Loading tasks...</Typography>}
          {!loading && !error && tasks.length === 0 && (
            <Typography className="state-message">No tasks match these filters.</Typography>
          )}
          {!loading && tasks.length > 0 && (
            <Stack component="ul" spacing={1.5} className="task-list" aria-label="Tasks">
              {tasks.map((task) => (
                <Paper component="li" key={task.id} className={`task-row ${task.completed ? 'completed' : ''}`} elevation={0}>
                  <Checkbox
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task)}
                    inputProps={{ 'aria-label': `Mark ${task.title} ${task.completed ? 'incomplete' : 'complete'}` }}
                  />
                  <Box className="task-content">
                    <Typography component="p" className="task-title">{task.title}</Typography>
                    <Typography component="p" className="task-meta">
                      {task.dueDate ? `Due ${task.dueDate}` : 'No due date'} <span aria-hidden="true">|</span> {task.priority} priority
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} className="task-actions">
                    <Button size="small" variant="outlined" onClick={() => startEditing(task)}>Edit</Button>
                    <Button size="small" color="error" variant="text" onClick={() => setTaskToDelete(task)}>Delete</Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Container>

      <Dialog open={Boolean(taskToDelete)} onClose={() => setTaskToDelete(null)} aria-labelledby="delete-dialog-title">
        <DialogTitle id="delete-dialog-title">Delete this task?</DialogTitle>
        <DialogContent>This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskToDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete task</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;