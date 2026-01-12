import React, { useState } from 'react';
import { TodayPage } from './pages/TodayPage';
import { Calendar } from './components/Calendar';
import { addDays, format } from 'date-fns';
import './App.css';

type View = 'today' | 'calendar';

export const App: React.FC = () => {
  const [view, setView] = useState<View>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setView('today');
  };

  const handleGoToday = () => {
    setSelectedDate(new Date());
    setView('today');
  };

  const handleShiftDay = (direction: -1 | 1) => {
    setSelectedDate((prev) => addDays(prev, direction));
    setView('today');
  };

  return (
    <div className="app">
      <nav className="app__nav">
        <button
          className="app__nav-today"
          onClick={handleGoToday}
        >
          Сьогодні
        </button>
        <div className="app__nav-date">
          <button
            className="app__nav-arrow"
            onClick={() => handleShiftDay(-1)}
            aria-label="Попередній день"
            type="button"
          >
            ‹
          </button>
          <button
            className={`app__nav-item ${view === 'today' ? 'app__nav-item--active' : ''}`}
            onClick={() => setView('today')}
          >
            {format(selectedDate, 'd MMMM yyyy')}
          </button>
          <button
            className="app__nav-arrow"
            onClick={() => handleShiftDay(1)}
            aria-label="Наступний день"
            type="button"
          >
            ›
          </button>
        </div>
        <button
          className={`app__nav-item ${view === 'calendar' ? 'app__nav-item--active' : ''}`}
          onClick={() => setView('calendar')}
        >
          Календар
        </button>
      </nav>

      <main className="app__main">
        {view === 'today' && (
          <TodayPage
            selectedDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date);
              setRefreshTrigger((prev) => prev + 1);
            }}
            onTaskChange={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}
        {view === 'calendar' && (
          <div className="app__calendar-wrapper">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}
      </main>
    </div>
  );
};
