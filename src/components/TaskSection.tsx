import React from 'react';
import { Task } from '../types/task';
import { TaskItem } from './TaskItem';
import './TaskSection.css';

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isOverdue?: boolean;
}

export const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  isOverdue = false,
}) => {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className={`task-section ${isOverdue ? 'task-section--overdue' : ''}`}>
      <h3 className={`task-section__title ${isOverdue ? 'task-section__title--overdue' : ''}`}>
        {title}
      </h3>
      <div className="task-section__list">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
