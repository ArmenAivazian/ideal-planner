import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { uk } from "date-fns/locale";
import { taskRepository } from "../db/taskRepository";
import "./Calendar.css";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  refreshTrigger?: number; // Для примусового оновлення
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  refreshTrigger,
}) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const [tasksMap, setTasksMap] = useState<{
    scheduled: Map<string, number>;
    deadlines: Map<string, number>;
  }>({
    scheduled: new Map(),
    deadlines: new Map(),
  });

  const loadTasks = async () => {
    const tasks = await taskRepository.getTasksForCalendar();
    setTasksMap(tasks);
  };

  useEffect(() => {
    loadTasks();
  }, [refreshTrigger]);

  // Синхронізуємо currentMonth з selectedDate при зміні
  useEffect(() => {
    const selectedMonth = startOfMonth(selectedDate);
    if (!isSameMonth(currentMonth, selectedMonth)) {
      setCurrentMonth(selectedMonth);
    }
  }, [selectedDate]);

  // Отримуємо всі дні для відображення (включаючи дні з попереднього/наступного місяця)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Понеділок
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  const getTasksCount = (
    date: Date
  ): { scheduled: number; deadlines: number } => {
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      scheduled: tasksMap.scheduled.get(dateStr) || 0,
      deadlines: tasksMap.deadlines.get(dateStr) || 0,
    };
  };

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button onClick={handlePrevMonth} className="calendar__nav">
          ‹
        </button>
        <h2 className="calendar__month">
          {format(currentMonth, "MMMM yyyy", { locale: uk })}
        </h2>
        <button onClick={handleNextMonth} className="calendar__nav">
          ›
        </button>
      </div>

      <div className="calendar__weekdays">
        {weekDays.map((day) => (
          <div key={day} className="calendar__weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar__days">
        {days.map((day) => {
          const tasks = getTasksCount(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected =
            format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`calendar__day ${
                !isCurrentMonth ? "calendar__day--other-month" : ""
              } ${isSelected ? "calendar__day--selected" : ""} ${
                isTodayDate ? "calendar__day--today" : ""
              }`}
              onClick={() => handleDateClick(day)}
            >
              <div className="calendar__day-number">{format(day, "d")}</div>
              <div className="calendar__day-tasks">
                {tasks.scheduled > 0 && (
                  <span className="calendar__task-dot calendar__task-dot--scheduled">
                    {tasks.scheduled}
                  </span>
                )}
                {tasks.deadlines > 0 && (
                  <span className="calendar__task-dot calendar__task-dot--deadline">
                    {tasks.deadlines}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="calendar__legend">
        <div className="calendar__legend-item">
          <span className="calendar__legend-dot calendar__legend-dot--scheduled" />
          Дати виконання
        </div>
        <div className="calendar__legend-item">
          <span className="calendar__legend-dot calendar__legend-dot--deadline" />
          Дедлайни (до дати)
        </div>
      </div>
    </div>
  );
};
