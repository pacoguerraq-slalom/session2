const request = require('supertest');
const { app, db } = require('../../src/app');

describe('Tasks API', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM tasks').run();
  });

  afterAll(() => {
    db.close();
  });

  it('creates and returns a task with defaults', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({ title: 'Prepare presentation' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      title: 'Prepare presentation',
      completed: false,
      dueDate: null,
      priority: 'Medium',
    });

    const listResponse = await request(app).get('/api/tasks');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].title).toBe('Prepare presentation');
  });

  it('updates completion, due date, priority, and title', async () => {
    const task = (await request(app).post('/api/tasks').send({ title: 'Draft report' })).body;

    const response = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({
        title: 'Draft final report',
        completed: true,
        dueDate: '2026-08-25',
        priority: 'High',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      title: 'Draft final report',
      completed: true,
      dueDate: '2026-08-25',
      priority: 'High',
    });
  });

  it('sorts by nearest due date and filters by status and priority', async () => {
    await request(app).post('/api/tasks').send({ title: 'Later', dueDate: '2026-08-30', priority: 'Low' });
    await request(app).post('/api/tasks').send({ title: 'Soon', dueDate: '2026-08-21', priority: 'High' });
    const completedTask = (await request(app).post('/api/tasks').send({ title: 'Done', dueDate: '2026-08-22', priority: 'High' })).body;
    await request(app).patch(`/api/tasks/${completedTask.id}`).send({ completed: true });

    const sortedResponse = await request(app).get('/api/tasks');
    expect(sortedResponse.body.map((task) => task.title)).toEqual(['Soon', 'Done', 'Later']);

    const filteredResponse = await request(app).get('/api/tasks?status=completed&priority=High');
    expect(filteredResponse.body.map((task) => task.title)).toEqual(['Done']);
  });

  it('validates task input and IDs', async () => {
    const invalidTask = await request(app).post('/api/tasks').send({ title: '', priority: 'Urgent' });
    expect(invalidTask.status).toBe(400);
    expect(invalidTask.body.error).toBe('Task title is required');

    const invalidDate = await request(app).post('/api/tasks').send({ title: 'Bad date', dueDate: 'tomorrow' });
    expect(invalidDate.status).toBe(400);
    expect(invalidDate.body.error).toBe('Due date must use YYYY-MM-DD format');

    const missingTask = await request(app).patch('/api/tasks/999999').send({ completed: true });
    expect(missingTask.status).toBe(404);
    expect(missingTask.body.error).toBe('Task not found');
  });

  it('deletes a task', async () => {
    const task = (await request(app).post('/api/tasks').send({ title: 'Remove this task' })).body;
    const response = await request(app).delete(`/api/tasks/${task.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Task deleted successfully', id: task.id });
    expect((await request(app).get('/api/tasks')).body).toHaveLength(0);
  });
});
