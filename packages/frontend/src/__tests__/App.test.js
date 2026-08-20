import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const initialTasks = [
  { id: 1, title: 'Plan the week', completed: false, dueDate: '2026-08-21', priority: 'High' },
  { id: 2, title: 'Review notes', completed: true, dueDate: '2026-08-22', priority: 'Low' },
];
let mockTasks = [...initialTasks];

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const priority = req.url.searchParams.get('priority');
    const filteredTasks = mockTasks.filter((task) => {
      const matchesStatus = !status || status === 'all' || (status === 'completed' ? task.completed : !task.completed);
      const matchesPriority = !priority || priority === 'all' || task.priority === priority;
      return matchesStatus && matchesPriority;
    });
    return res(ctx.status(200), ctx.json(filteredTasks));
  }),
  rest.post('/api/tasks', (req, res, ctx) => {
    const newTask = {
      id: 3,
      title: req.body.title,
      completed: false,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
    };
    mockTasks.push(newTask);
    return res(
      ctx.status(201),
      ctx.json(newTask)
    );
  }),
  rest.patch('/api/tasks/:id', (req, res, ctx) => {
    const task = mockTasks.find((item) => item.id === Number(req.params.id));
    Object.assign(task, req.body);
    return res(ctx.status(200), ctx.json(task));
  })
);

beforeAll(() => server.listen());
beforeEach(() => {
  mockTasks = initialTasks.map((task) => ({ ...task }));
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the application header', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: "Today's task list" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());
  });

  test('loads and displays tasks', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Plan the week')).toBeInTheDocument();
      expect(screen.getByText('Review notes')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Book dentist appointment');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    expect(await screen.findByText('Book dentist appointment')).toBeInTheDocument();
  });

  test('toggles a task complete', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Plan the week')).toBeInTheDocument());
    await user.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => expect(screen.getAllByRole('checkbox')[0]).toBeChecked());
  });

  test('filters tasks by status', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Plan the week')).toBeInTheDocument());
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(screen.getByRole('option', { name: 'Completed' }));
    expect(await screen.findByText('Review notes')).toBeInTheDocument();
    expect(screen.queryByText('Plan the week')).not.toBeInTheDocument();
  });

  test('handles API errors', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Service unavailable' }));
      })
    );
    render(<App />);
    expect(await screen.findByText('Unable to load tasks')).toBeInTheDocument();
  });

  test('shows an empty state when no tasks match', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );
    render(<App />);
    expect(await screen.findByText('No tasks match these filters.')).toBeInTheDocument();
  });
});