import React, { useState, useEffect } from 'react';
import { CalendarIcon, Clock, DollarSign, MapPin } from 'lucide-react';

interface Booking {
  id: number;
  customerName: string;
  dateTime: string;
  duration: number;
  price: number;
  address: string;
  status: string;
  cleaningType: string;
  notes?: string;
}

function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarUrl, setCalendarUrl] = useState<string>('');

  useEffect(() => {
    fetchBookings();
    fetchCalendarUrl();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      
      const transformedBookings = data.map((booking: any) => ({
        id: booking.id,
        customerName: booking.customer.name,
        dateTime: booking.dateTime,
        duration: booking.duration,
        price: booking.price,
        address: booking.customer.address,
        status: new Date(booking.dateTime) > new Date() ? 'pending' : 'completed',
        cleaningType: booking.cleaningType,
        notes: booking.serviceItems?.length 
          ? `Additional services: ${booking.serviceItems.map((item: any) => item.name).join(', ')}`
          : undefined
      }));

      setBookings(transformedBookings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const fetchCalendarUrl = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/calendar-url');
      if (response.ok) {
        const data = await response.json();
        setCalendarUrl(data.url);
      }
    } catch (error) {
      console.error('Error fetching calendar URL:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Calendar</h3>
          
          {/* Google Calendar Integration */}
          {calendarUrl ? (
            <iframe
              src={`${calendarUrl}&height=700&wkst=1&bgcolor=%23ffffff&ctz=Europe%2FLondon&showPrint=0&mode=WEEK&showCalendars=0&showTz=0`}
              style={{ border: 'solid 1px #777' }}
              width="100%"
              height="700"
              frameBorder="0"
              scrolling="no"
              className="rounded-lg"
            />
          ) : (
            <div className="h-700px] flex items-center justify-center">
              <p>Loading calendar...</p>
            </div>
          )}
        </div>

        {/* Upcoming Bookings Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Bookings</h3>
          </div>
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading bookings...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bookings
                .filter(booking => new Date(booking.dateTime) > new Date())
                .map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{booking.customerName}</h4>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(booking.dateTime).toLocaleDateString()}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(booking.dateTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} ({booking.duration} hours)
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {booking.address}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${booking.price}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    {booking.notes && (
                      <p className="mt-2 text-sm text-gray-500">{booking.notes}</p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingsPage;