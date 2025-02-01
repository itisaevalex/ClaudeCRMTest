import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface CalendarProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date) => void;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelect,
  selectedTime,
  onSelectTime
}) => {
  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Ensure the date is set to midnight in the local timezone
      const selectedDateMidnight = new Date(date);
      selectedDateMidnight.setHours(0, 0, 0, 0);
      onSelect(selectedDateMidnight);
    }
  };

  const handleTimeSelect = (time: string) => {
    onSelectTime(time);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-gray-700 font-medium">Date and Time</h3>
      <div className="flex gap-12">
        {/* Calendar Section */}
        <div className="flex-1">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            fromDate={today}
            modifiers={{
              disabled: [
                { dayOfWeek: [0] },
                { before: today }
              ],
            }}
            modifiersStyles={{
              selected: {
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '100%'
              }
            }}
            styles={{
              caption: { fontWeight: '600' },
              nav_button_previous: { color: '#000000' },
              nav_button_next: { color: '#000000' }
            }}
          />
        </div>

        {/* Time Slots Section */}
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-6">Available Time Slots</h2>
          <div className="grid grid-cols-2 gap-4">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`px-6 py-2 rounded-lg text-center border transition-colors
                  ${selectedTime === time 
                    ? 'bg-[#f0f4ff] border-[#2563eb] text-[#2563eb]' 
                    : 'border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;