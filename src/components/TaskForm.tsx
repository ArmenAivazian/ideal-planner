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
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (task) {
      const nextScheduledDate = task.scheduled_date
        ? format(task.scheduled_date, 'yyyy-MM-dd')
        : '';
      const nextDeadlineDate =
        nextScheduledDate === '' && task.deadline_date
          ? format(task.deadline_date, 'yyyy-MM-dd')
          : '';

      setTitle(task.title);
      setScheduledDate(nextScheduledDate);
      setDeadlineDate(nextDeadlineDate);
      setNotes(task.notes || '');
    } else {
      // Нова задача
      setTitle('');
      setScheduledDate('');
      setDeadlineDate('');
      setNotes('');
    }
  }, [task]);

  const handleScheduledDateChange = (value: string) => {
    setScheduledDate(value);
    if (value && deadlineDate) {
      setDeadlineDate('');
    }
  };

  const handleDeadlineDateChange = (value: string) => {
    setDeadlineDate(value);
    if (value && scheduledDate) {
      setScheduledDate('');
    }
  };

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

    const normalizedScheduledDate = scheduledDate;
    const normalizedDeadlineDate = scheduledDate ? '' : deadlineDate;

    const taskData: Partial<Task> = {
      title: title.trim(),
      scheduled_date: normalizedScheduledDate
        ? createLocalDate(normalizedScheduledDate)
        : null,
      scheduled_time: null,
      deadline_date: normalizedDeadlineDate
        ? createLocalDate(normalizedDeadlineDate)
        : null,
      reminder_enabled: false,
      notes: notes.trim() || null,
    };

    onSave(taskData);

    if (!task) {
      setTitle('');
      setScheduledDate('');
      setDeadlineDate('');
      setNotes('');
    }
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

      <div className="task-form__date-group">
        <div className="task-form__date-row">
          <Input
            label="Дата виконання"
            type="date"
            value={scheduledDate}
            onChange={(e) => handleScheduledDateChange(e.target.value)}
            disabled={!!deadlineDate}
          />
          <div className="task-form__date-divider">або</div>
          <Input
            label="Дедлайн (до дати)"
            type="date"
            value={deadlineDate}
            onChange={(e) => handleDeadlineDateChange(e.target.value)}
            disabled={!!scheduledDate}
          />
        </div>
      </div>

      <Textarea
        label="Нотатки (опційно)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Додаткові деталі..."
      />

      <div className="task-form__actions">
        <Button type="button" onClick={onCancel} className="task-form__cancel">
          Скасувати
        </Button>
        <Button type="submit" variant="primary">
          {task ? 'Зберегти' : 'Створити'}
        </Button>
      </div>
    </form>
  );
};
