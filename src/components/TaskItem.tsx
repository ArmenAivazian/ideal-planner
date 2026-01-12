import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types/task';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import './TaskItem.css';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const [localIsDone, setLocalIsDone] = useState(task.is_done);
  const [isAnimating, setIsAnimating] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const animationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Синхронізуємо локальний стан з пропсом
  useEffect(() => {
    if (task.is_done !== localIsDone && !isAnimating) {
      setLocalIsDone(task.is_done);
    }
  }, [task.is_done]);

  const handleToggle = () => {
    const newIsDone = !localIsDone;
    
    // Оптимістично оновлюємо локальний стан
    setLocalIsDone(newIsDone);
    setIsAnimating(true);
    
    // Запускаємо анімацію чекбоксу
    if (checkboxRef.current) {
      checkboxRef.current.classList.add('task-item__checkbox--animating');
      setTimeout(() => {
        if (checkboxRef.current) {
          checkboxRef.current.classList.remove('task-item__checkbox--animating');
        }
      }, 300);
    }

    // Скидаємо стан анімації після завершення, з невеликим запасом
    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 650);

    // Викликаємо callback для оновлення в базі даних
    onToggle(task.id);
  };

  const handleEdit = () => {
    onEdit(task);
  };

  const handleDelete = () => {
    if (confirm('Видалити задачу?')) {
      onDelete(task.id);
    }
  };

  const isOverdue =
    task.deadline_date &&
    !localIsDone &&
    task.deadline_date < new Date() &&
    format(task.deadline_date, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');

  return (
    <div className={`task-item ${localIsDone ? 'task-item--done' : ''} ${isAnimating ? 'task-item--animating' : ''}`}>
      <div className="task-item__content">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={localIsDone}
          onChange={handleToggle}
          className="task-item__checkbox"
        />
        <div className="task-item__text" onClick={handleEdit}>
          <div className="task-item__title">{task.title}</div>
          {task.deadline_date && (
            <div className="task-item__meta">
              <span
                className={`task-item__deadline ${
                  isOverdue ? 'task-item__deadline--overdue' : ''
                }`}
              >
                Дедлайн: {format(task.deadline_date, 'd MMM', { locale: uk })}
                {isOverdue && ' (прострочено)'}
              </span>
            </div>
          )}
        </div>
      </div>
      <button
        className="task-item__delete"
        onClick={handleDelete}
        aria-label="Видалити"
      >
        ×
      </button>
    </div>
  );
};
