const { test, expect } = require('@playwright/test');

class TodoPage {
  constructor(page) {
    this.page = page;
    this.titleInput = page.getByPlaceholder('What needs doing?');
    this.addTaskButton = page.getByRole('button', { name: 'Add task' });
    this.taskList = page.getByRole('list', { name: 'Tasks' });
  }

  async open() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: "Today's task list" })).toBeVisible();
  }

  taskRow(title) {
    return this.taskList.locator('li').filter({ hasText: title });
  }

  async createTask(title) {
    await this.titleInput.fill(title);
    await this.addTaskButton.click();
    await expect(this.taskRow(title)).toBeVisible();
  }

  async completeTask(title) {
    const row = this.taskRow(title);
    await row.getByRole('checkbox').click();
    await expect(row.getByRole('checkbox')).toBeChecked();
  }

  async deleteTask(title) {
    const row = this.taskRow(title);
    await row.getByRole('button', { name: 'Delete' }).click();
    await this.page.getByRole('dialog').getByRole('button', { name: 'Delete task' }).click();
    await expect(row).toHaveCount(0);
  }
}

test('user can create, complete, persist, and delete a task', async ({ page }) => {
  const todoPage = new TodoPage(page);
  const taskTitle = `Plan tomorrow ${Date.now()}`;

  await todoPage.open();
  await todoPage.createTask(taskTitle);
  await todoPage.completeTask(taskTitle);

  await page.reload();
  await expect(todoPage.taskRow(taskTitle).getByRole('checkbox')).toBeChecked();

  await todoPage.deleteTask(taskTitle);
});
