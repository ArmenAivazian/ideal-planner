import { db } from './database';
import { Task, taskToDB, taskFromDB } from '../types/task';
import { format } from 'date-fns';

// Репозиторій для роботи з задачами
export class TaskRepository {
  // Отримати всі задачі
  async getAll(): Promise<Task[]> {
    const tasksDB = await db.tasks.toArray();
    return tasksDB.map(taskFromDB);
  }

  // Отримати задачу за ID
  async getById(id: string): Promise<Task | null> {
    const taskDB = await db.tasks.get(id);
    return taskDB ? taskFromDB(taskDB) : null;
  }

  // Створити задачу
  async create(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const now = new Date();
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    await db.tasks.add(taskToDB(newTask));
    return newTask;
  }

  // Оновити задачу
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Задача з ID ${id} не знайдена`);
    }
    const updated: Task = {
      ...existing,
      ...updates,
      updated_at: new Date(),
    };
    await db.tasks.update(id, taskToDB(updated));
    return updated;
  }

  // Видалити задачу
  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
  }

  // Отримати задачі для конкретної дати (для екрану "Сьогодні")
  async getTasksForDate(date: Date, includeDone: boolean = false): Promise<{
    overdue: Task[]; // Протерміновані задачі (найвищий пріоритет)
    scheduled: Task[]; // Задачі на цей день (з часом спочатку, потім без часу)
    deadlines: Task[]; // Всі задачі з дедлайном (від найближчих до найвіддаленіших)
    backlog: Task[]; // Задачі без жодної дати
  }> {
    const allTasks = await this.getAll();
    const filtered = includeDone
      ? allTasks
      : allTasks.filter((t) => !t.is_done);

    const dateStr = format(date, 'yyyy-MM-dd');

    // Порівнюємо дати без часу для коректного порівняння
    const selectedDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const overdue: Task[] = [];
    const scheduled: Task[] = [];
    const deadlines: Task[] = [];
    const backlog: Task[] = [];

    filtered.forEach((task) => {
      const taskScheduledDate = task.scheduled_date
        ? format(task.scheduled_date, 'yyyy-MM-dd')
        : null;
      const hasDeadline = !!task.deadline_date;
      
      const scheduledDateOnly = task.scheduled_date
        ? new Date(task.scheduled_date.getFullYear(), task.scheduled_date.getMonth(), task.scheduled_date.getDate())
        : null;
      const deadlineDateOnly = task.deadline_date
        ? new Date(task.deadline_date.getFullYear(), task.deadline_date.getMonth(), task.deadline_date.getDate())
        : null;
      
      const isScheduledOnDate = taskScheduledDate === dateStr;
      const isScheduledPassed = scheduledDateOnly && scheduledDateOnly < selectedDateOnly;
      const isDeadlinePassed = deadlineDateOnly && deadlineDateOnly < selectedDateOnly;
      const isDeadlineToday = deadlineDateOnly && deadlineDateOnly.getTime() === selectedDateOnly.getTime();

      // Протерміновані: задачі з простроченим scheduled_date або простроченим deadline_date
      if (isScheduledPassed || isDeadlinePassed) {
        overdue.push(task);
      }
      // Задачі з scheduled_date на обрану дату йдуть в scheduled секцію
      else if (isScheduledOnDate) {
        scheduled.push(task);
      }
      // Задачі з сьогоднішнім дедлайном також йдуть в scheduled секцію
      else if (isDeadlineToday) {
        scheduled.push(task);
      }
      // Задачі з майбутнім дедлайном йдуть в deadlines секцію
      else if (hasDeadline && !isDeadlinePassed && !isDeadlineToday) {
        deadlines.push(task);
      }
      // Беклог - задачі без жодної дати
      else if (!taskScheduledDate && !hasDeadline) {
        backlog.push(task);
      }
    });

    // Сортування overdue: спочатку за scheduled_date (якщо є), потім за deadline_date, потім за created_at
    overdue.sort((a, b) => {
      // Спочатку порівнюємо scheduled_date (якщо прострочені)
      if (a.scheduled_date && b.scheduled_date) {
        const aScheduled = new Date(a.scheduled_date.getFullYear(), a.scheduled_date.getMonth(), a.scheduled_date.getDate());
        const bScheduled = new Date(b.scheduled_date.getFullYear(), b.scheduled_date.getMonth(), b.scheduled_date.getDate());
        if (aScheduled < selectedDateOnly && bScheduled < selectedDateOnly) {
          return aScheduled.getTime() - bScheduled.getTime(); // старіші спочатку
        }
      }
      // Потім порівнюємо deadline_date (якщо прострочені)
      if (a.deadline_date && b.deadline_date) {
        const aDeadline = new Date(a.deadline_date.getFullYear(), a.deadline_date.getMonth(), a.deadline_date.getDate());
        const bDeadline = new Date(b.deadline_date.getFullYear(), b.deadline_date.getMonth(), b.deadline_date.getDate());
        if (aDeadline < selectedDateOnly && bDeadline < selectedDateOnly) {
          return aDeadline.getTime() - bDeadline.getTime(); // старіші спочатку
        }
      }
      // В кінці за created_at (старіші спочатку)
      return a.created_at.getTime() - b.created_at.getTime();
    });

    // Сортування scheduled: за created_at (старші → новіші)
    scheduled.sort((a, b) => {
      return a.created_at.getTime() - b.created_at.getTime();
    });

    // Сортування deadlines: за датою дедлайну (від найближчих до найвіддаленіших)
    deadlines.sort((a, b) => {
      if (!a.deadline_date || !b.deadline_date) return 0;
      return a.deadline_date.getTime() - b.deadline_date.getTime();
    });

    // Сортування backlog: за created_at (старші → новіші)
    backlog.sort(
      (a, b) => a.created_at.getTime() - b.created_at.getTime()
    );

    return {
      overdue,
      scheduled,
      deadlines,
      backlog,
    };
  }

  // Отримати задачі для календаря (всі задачі з датами)
  async getTasksForCalendar(): Promise<{
    scheduled: Map<string, number>; // дата -> кількість задач
    deadlines: Map<string, number>; // дата -> кількість задач
  }> {
    const allTasks = await this.getAll();
    const scheduled = new Map<string, number>();
    const deadlines = new Map<string, number>();

    allTasks.forEach((task) => {
      if (task.scheduled_date) {
        const dateStr = format(task.scheduled_date, 'yyyy-MM-dd');
        scheduled.set(dateStr, (scheduled.get(dateStr) || 0) + 1);
      }
      if (task.deadline_date) {
        const dateStr = format(task.deadline_date, 'yyyy-MM-dd');
        deadlines.set(dateStr, (deadlines.get(dateStr) || 0) + 1);
      }
    });

    return { scheduled, deadlines };
  }
}

export const taskRepository = new TaskRepository();
