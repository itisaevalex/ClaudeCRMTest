import React, { useState, useEffect } from 'react';
import { CalendarIcon, Clock, DollarSign, MapPin, User, CheckCircle, XCircle } from 'lucide-react';

interface ServiceItem {
  id: number;
  name: string;
  description: string | null;
  frequency: string | null;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Booking {
  id: number;
  dateTime: string;
  duration: number;
  price: number;
  cleaningType: string;
  customer: Customer;
  serviceItems: ServiceItem[];
}

function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarUrl, setCalendarUrl] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsResponse, calendarResponse] = await Promise.all([
          fetch('http://localhost:5001/api/bookings'),
          fetch('http://localhost:5001/api/calendar-url')
        ]);

        if (!bookingsResponse.ok) throw new Error('Failed to fetch bookings');
        if (!calendarResponse.ok) throw new Error('Failed to fetch calendar URL');

        const bookingsData = await bookingsResponse.json();
        const calendarData = await calendarResponse.json();

        setBookings(bookingsData);
        setCalendarUrl(calendarData.url);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const { date, time } = formatDateTime(booking.dateTime);
    const isPending = new Date(booking.dateTime) > new Date();

    return (
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <h4 className="font-medium text-gray-900">{booking.customer.name}</h4>
            </div>
            
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{date}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{time} ({booking.duration}h)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{booking.customer.address}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">€{booking.price.toFixed(2)}</span>
            </div>

            {booking.serviceItems.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 font-medium">Additional Services:</p>
                <ul className="mt-1 space-y-1">
                  {booking.serviceItems.map((item, index) => (
                    <li key={item.id} className="text-sm text-gray-500 flex items-center space-x-1">
                      <span>• {item.name}</span>
                      {item.frequency && (
                        <span className="text-gray-400">({item.frequency})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium flex items-center
              ${isPending 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-green-100 text-green-700'
              }
            `}>
              {isPending ? (
                <Clock className="h-4 w-4 mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              {isPending ? 'Pending' : 'Completed'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load bookings</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Calendar</h3>
          </div>
          
          {calendarUrl ? (
            <iframe
              src={`${calendarUrl}&height=600&wkst=1&bgcolor=%23ffffff&ctz=Europe%2FLondon&showPrint=0&mode=WEEK&showCalendars=0&showTz=0`}
              style={{ border: 0 }}
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
              className="w-full"
            />
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <p className="text-gray-500">Loading calendar...</p>
            </div>
          )}
        </div>

        {/* Bookings List Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Upcoming Bookings
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No bookings found
              </div>
            ) : (
              bookings
                .filter(booking => new Date(booking.dateTime) > new Date())
                .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                .map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingsPage;