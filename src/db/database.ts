import Dexie, { Table } from 'dexie';
import { TaskDB } from '../types/task';

// База даних IndexedDB через Dexie
export class PlannerDatabase extends Dexie {
  tasks!: Table<TaskDB, string>;

  constructor() {
    super('PlannerDB');
    this.version(1).stores({
      tasks: 'id, created_at, scheduled_date, deadline_date, is_done',
    });
  }
}

export const db = new PlannerDatabase();
