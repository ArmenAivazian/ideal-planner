import React, { useState, useEffect } from 'react';
import { Task } from '../types/task';
import { taskRepository } from '../db/taskRepository';
import { TaskSection } from '../components/TaskSection';
import { TaskForm } from '../components/TaskForm';
import { Button } from '../components/Button';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { uk } from 'date-fns/locale';
import './TodayPage.css';

interface TodayPageProps {
  selectedDate?: Date;
  mode: 'day' | 'week';
  onTaskChange?: () => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  selectedDate: propSelectedDate,
  mode,
  onTaskChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(
    propSelectedDate || new Date()
  );
  const [includeDone, setIncludeDone] = useState(false);
  const [tasks, setTasks] = useState<{
    overdue: Task[];
    scheduled: Task[];
    deadlines: Task[];
    backlog: Task[];
  }>({
    overdue: [],
    scheduled: [],
    deadlines: [],
    backlog: [],
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadTasks = async () => {
    if (mode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const loaded = await taskRepository.getTasksForRange(
        weekStart,
        weekEnd,
        includeDone
      );
      setTasks(loaded);
      return;
    }

    const loaded = await taskRepository.getTasksForDate(
      selectedDate,
      includeDone
    );
    setTasks(loaded);
  };

  // Синхронізуємо selectedDate з propSelectedDate
  useEffect(() => {
    if (propSelectedDate) {
      const propDateStr = format(propSelectedDate, 'yyyy-MM-dd');
      const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
      if (propDateStr !== currentDateStr) {
        setSelectedDate(propSelectedDate);
      }
    }
  }, [propSelectedDate]);

  useEffect(() => {
    loadTasks();
  }, [selectedDate, includeDone, mode]);

  const handleToggle = async (id: string) => {
    const task = await taskRepository.getById(id);
    if (task) {
      const newIsDone = !task.is_done;
      await taskRepository.update(id, { is_done: newIsDone });
      
      // Якщо задача стає виконаною і не показуємо виконані - додаємо затримку для анімації
      if (newIsDone && !includeDone) {
        setTimeout(() => {
          loadTasks();
          onTaskChange?.();
        }, 600);
      } else {
        // Якщо показуємо виконані або знімаємо відмітку - оновлюємо одразу
        loadTasks();
        onTaskChange?.();
      }
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await taskRepository.delete(id);
    loadTasks();
    onTaskChange?.();
  };

  const handleSave = async (taskData: Partial<Task>) => {
    if (editingTask) {
      await taskRepository.update(editingTask.id, taskData);
    } else {
      await taskRepository.create({
        ...taskData,
        is_done: false,
      } as Omit<Task, 'id' | 'created_at' | 'updated_at'>);
    }
    setShowForm(false);
    setEditingTask(null);
    loadTasks();
    onTaskChange?.();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const isSameMonth =
    weekStart.getFullYear() === weekEnd.getFullYear() &&
    weekStart.getMonth() === weekEnd.getMonth();
  const displayDate =
    mode === 'week'
      ? isSameMonth
        ? `${format(weekStart, 'd', { locale: uk })} – ${format(weekEnd, 'd MMMM yyyy', { locale: uk })}`
        : `${format(weekStart, 'd MMMM yyyy', { locale: uk })} – ${format(weekEnd, 'd MMMM yyyy', { locale: uk })}`
      : isToday
        ? 'Сьогодні'
        : format(selectedDate, 'd MMMM yyyy', { locale: uk });
  const scheduledTitle =
    mode === 'week' ? 'Задачі на цей тиждень' : 'Задачі на цей день';

  return (
    <div className="today-page">
      <div className="today-page__header">
        <div>
          <h1>{displayDate}</h1>
        </div>
        <div className="today-page__controls">
          <label className="today-page__toggle">
            <input
              type="checkbox"
              checked={includeDone}
              onChange={(e) => setIncludeDone(e.target.checked)}
            />
            <span>Показувати виконані</span>
          </label>
          {!showForm && (
            <Button
              variant="primary"
              onClick={handleNewTask}
              className="today-page__new-task"
            >
              Нова задача
            </Button>
          )}
        </div>
      </div>

      <div className={`today-page__body ${showForm ? 'today-page__body--with-form' : ''}`}>
        <div className={`today-page__form ${showForm ? '' : 'today-page__form--hidden'}`}>
          <TaskForm
            task={editingTask}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>

        <div className="today-page__content">
          {tasks.overdue.length === 0 &&
          tasks.scheduled.length === 0 &&
          tasks.deadlines.length === 0 &&
          tasks.backlog.length === 0 ? (
            <div className="today-page__empty">
              Поки що немає задач. Додай першу задачу, щоб почати планування.
            </div>
          ) : (
            <>
              <TaskSection
                title="Протерміновані"
                tasks={tasks.overdue}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isOverdue={true}
              />

              <TaskSection
                title={scheduledTitle}
                tasks={tasks.scheduled}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              <TaskSection
                title="Задачі з дедлайном"
                tasks={tasks.deadlines}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              <TaskSection
                title="Всі інші задачі"
                tasks={tasks.backlog}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
