import React, { useState } from 'react';
import { TodayPage } from './pages/TodayPage';
import { Calendar } from './components/Calendar';
import { Button } from './components/Button';
import { addDays } from 'date-fns';
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
        <div className="app__nav-left">
          <button
            className={`app__nav-item ${view === 'today' ? 'app__nav-item--active' : ''}`}
            onClick={() => setView('today')}
          >
            День
          </button>
          <button
            className={`app__nav-item ${view === 'calendar' ? 'app__nav-item--active' : ''}`}
            onClick={() => setView('calendar')}
          >
            Календар
          </button>
        </div>
        <div className="app__nav-right">
          <button
            className="app__nav-arrow"
            onClick={() => handleShiftDay(-1)}
            aria-label="Попередній день"
            type="button"
          >
            ‹
          </button>
          <Button
            variant="primary"
            className="app__nav-today"
            onClick={handleGoToday}
          >
            Сьогодні
          </Button>
          <button
            className="app__nav-arrow"
            onClick={() => handleShiftDay(1)}
            aria-label="Наступний день"
            type="button"
          >
            ›
          </button>
        </div>
      </nav>

      <main className="app__main">
        {view === 'today' && (
          <TodayPage
            selectedDate={selectedDate}
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
