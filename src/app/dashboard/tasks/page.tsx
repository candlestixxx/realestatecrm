import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import AddTaskModal from '@/components/AddTaskModal';
import { taskSchema } from '@/lib/validations/task';
import Link from 'next/link';

async function addTask(formData: FormData) {
  'use server';

  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
    workspaceId: formData.get('workspaceId'),
    dueDate: formData.get('dueDate'),
    assignedToId: formData.get('assignedToId'),
  };

  const validatedData = taskSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { title, description, status, workspaceId, dueDate, assignedToId } = validatedData.data;

  try {
    await prisma.task.create({
      data: {
        title,
        description: description || null,
        status,
        workspaceId,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
      },
    });
  } catch (error) {
    console.error('Failed to add task:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export default async function TasksPage(props: {
  searchParams?: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const statusFilter = searchParams?.status || 'ALL';
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = 10;

  const whereClause: Prisma.TaskWhereInput = {};

  if (query) {
    whereClause.title = { contains: query };
  }

  if (statusFilter && statusFilter !== 'ALL') {
    whereClause.status = statusFilter;
  }

  const [tasks, totalCount] = await Promise.all([
    prisma.task.findMany({
      where: whereClause,
      include: { assignedTo: true },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
    }),
    prisma.task.count({ where: whereClause }),
  ]);

  const workspaces = await prisma.workspace.findMany();
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your daily to-dos and action items.</p>
        </div>
        <div className="flex gap-2">
          <AddTaskModal addTaskAction={addTask} workspaces={workspaces} users={users} />
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
        <form className="p-4 border-b border-border flex gap-4 items-center bg-muted/20">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search tasks..."
            className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            onChange={(e) => {
              const form = e.target.form;
              if (form) {
                const pageInput = form.querySelector('input[name="page"]') as HTMLInputElement;
                if (pageInput) pageInput.value = '1';
                form.submit();
              }
            }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <input type="hidden" name="page" value={currentPage} />
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/90 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-3 font-medium">Task</th>
                <th className="px-6 py-3 font-medium">Assignee</th>
                <th className="px-6 py-3 font-medium">Due Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {task.assignedTo ? task.assignedTo.name || task.assignedTo.email : '--'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '--'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium border ${
                        task.status === 'TODO'
                          ? 'bg-secondary/20 text-secondary-foreground border-secondary/30'
                          : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                            : 'bg-green-500/20 text-green-500 border-green-500/30'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3">
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      Complete
                    </button>
                    <button className="text-primary hover:underline text-sm font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
          <span>
            Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </span>
          <div className="flex gap-2">
            <Link
              href={`/tasks?q=${query}&status=${statusFilter}&page=${currentPage - 1}`}
              className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Prev
            </Link>
            <Link
              href={`/tasks?q=${query}&status=${statusFilter}&page=${currentPage + 1}`}
              className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
