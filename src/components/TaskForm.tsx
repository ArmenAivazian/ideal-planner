import React, { useState, useEffect } from 'react';
import { Task } from '../types/task';
import { format } from 'date-fns';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import './TaskForm.css';

interface TaskFormProps {
  task?: Task | null;
  onSave: (task: Partial<Task>) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setScheduledDate(
        task.scheduled_date
          ? format(task.scheduled_date, 'yyyy-MM-dd')
          : ''
      );
      setDeadlineDate(
        task.deadline_date
          ? format(task.deadline_date, 'yyyy-MM-dd')
          : ''
      );
      setReminderEnabled(task.reminder_enabled);
      setNotes(task.notes || '');
    } else {
      // Нова задача
      setTitle('');
      setScheduledDate('');
      setDeadlineDate('');
      setReminderEnabled(false);
      setNotes('');
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }

    // Створюємо дати в локальному часовому поясі, щоб уникнути проблем з UTC
    const createLocalDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const taskData: Partial<Task> = {
      title: title.trim(),
      scheduled_date: scheduledDate ? createLocalDate(scheduledDate) : null,
      scheduled_time: null,
      deadline_date: deadlineDate ? createLocalDate(deadlineDate) : null,
      reminder_enabled: reminderEnabled && !!scheduledDate,
      notes: notes.trim() || null,
    };

    onSave(taskData);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <Input
        label="Назва задачі"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Що потрібно зробити?"
        autoFocus
        required
      />

      <Input
        label="Дата виконання"
        type="date"
        value={scheduledDate}
        onChange={(e) => setScheduledDate(e.target.value)}
      />

      {scheduledDate && (
        <div className="task-form__checkbox-wrapper">
          <input
            type="checkbox"
            id="reminder"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
          />
          <label htmlFor="reminder">Нагадування</label>
        </div>
      )}

      <Input
        label="Дедлайн (до дати)"
        type="date"
        value={deadlineDate}
        onChange={(e) => setDeadlineDate(e.target.value)}
      />

      <Textarea
        label="Нотатки (опційно)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Додаткові деталі..."
      />

      <div className="task-form__actions">
        <Button type="button" onClick={onCancel}>
          Скасувати
        </Button>
        <Button type="submit" variant="primary">
          {task ? 'Зберегти' : 'Створити'}
        </Button>
      </div>
    </form>
  );
};
