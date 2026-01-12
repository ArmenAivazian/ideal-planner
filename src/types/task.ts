// Модель задачі згідно з вимогами
export interface Task {
  id: string;
  title: string;
  is_done: boolean;
  created_at: Date;
  updated_at: Date;
  scheduled_date: Date | null;
  scheduled_time: string | null; // формат "HH:mm"
  deadline_date: Date | null;
  reminder_enabled: boolean;
  notes: string | null;
}

// Тип для зберігання в IndexedDB (Date конвертується в ISO string)
export interface TaskDB {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  scheduled_date: string | null; // ISO date string (без часу)
  scheduled_time: string | null; // "HH:mm"
  deadline_date: string | null; // ISO date string (без часу)
  reminder_enabled: boolean;
  notes: string | null;
}

// Конвертація між форматами
export function taskToDB(task: Task): TaskDB {
  return {
    ...task,
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString(),
    scheduled_date: task.scheduled_date
      ? task.scheduled_date.toISOString().split('T')[0]
      : null,
    deadline_date: task.deadline_date
      ? task.deadline_date.toISOString().split('T')[0]
      : null,
  };
}

export function taskFromDB(taskDB: TaskDB): Task {
  return {
    ...taskDB,
    created_at: new Date(taskDB.created_at),
    updated_at: new Date(taskDB.updated_at),
    scheduled_date: taskDB.scheduled_date
      ? new Date(taskDB.scheduled_date)
      : null,
    deadline_date: taskDB.deadline_date
      ? new Date(taskDB.deadline_date)
      : null,
  };
}
