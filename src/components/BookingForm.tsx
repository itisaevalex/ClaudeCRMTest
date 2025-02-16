import React, { useState, useEffect } from 'react';
import { Home, Mail, Phone, User, Plus, X, Clock, Edit2 } from 'lucide-react';
import { useBookingPrice } from '../hooks/useBookingPrice';
import type { CustomerDetails, ServiceItem, BookingDetails } from '../types/booking';
import PriceEditor from './PriceEditor';
import SubmitButton from './SubmitButton';
import { PreviewButton, PreviewModal } from './PDFPreview';
import Calendar from './Calendar';
import { supabase } from '../lib/supabaseClient'; // importing supabase to handle authentication

const API_URL = 'http://localhost:5001';

// Available duration options in hours
const DURATION_OPTIONS = [
  { value: 2, label: '2 hours' },
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' },
  { value: 5, label: '5 hours' },
  { value: 6, label: '6 hours' },
  { value: 7, label: '7 hours' },
  { value: 8, label: 'Full day (8 hours)' }
];

export default function BookingForm() {
  const [area, setArea] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(2); // Default 2 hours
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cleaningType, setCleaningType] = useState<string>('');
  const [isBusinessCustomer, setIsBusinessCustomer] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [calendarUrl, setCalendarUrl] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const fetchCalendarUrl = async () => {
      try {
        const response = await fetch(`${API_URL}/api/calendar-url`);
        if (response.ok) {
          const data = await response.json();
          setCalendarUrl(data.url);
        } else {
          console.error('Failed to fetch calendar URL');
        }
      } catch (error) {
        console.error('Error fetching calendar URL:', error);
      }
    };

    fetchCalendarUrl();
  }, []);

  const DurationSelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Service Duration
      </label>
      <div className="relative">
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none pr-10"
        >
          {DURATION_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { name: '', description: '', frequency: '' }]);
  };

  const removeServiceItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  const updateServiceItem = (index: number, field: keyof ServiceItem, value: string) => {
    const updatedItems = [...serviceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setServiceItems(updatedItems);
  };

  const formatDateTime = (date: Date | undefined, time: string | null): string => {
    if (!date || !time) return '';
    
    const [hours, minutes] = time.split(':');
    const dateTime = new Date(date);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime.toISOString();
  };

  const handleInputBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getInputClassName = (field: string) => {
    const baseClasses = "block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors";
    return `${baseClasses} ${
      touched[field] && !customerDetails[field as keyof CustomerDetails]
        ? 'border-gray-300 bg-gray-50'
        : 'border-gray-300'
    }`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    if (!selectedDate || !selectedTime || !area || !cleaningType) {
      alert('Please fill in all required fields and select a cleaning type');
      return;
    }
  
    try {
      setIsSubmitting(true);
      
      // Get Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Format the date and time properly
      const dateTimeString = formatDateTime(selectedDate, selectedTime);
      if (!dateTimeString) {
        throw new Error('Invalid date/time format');
      }
      
    const bookingDetails = {
      area,
      dateTime: dateTimeString,
      customerDetails,
      price: manualPrice || price,
      cleaningType,
      isBusinessCustomer,
      serviceItems: serviceItems.map(item => ({
        name: item.name || null,
        description: item.description || null,
        frequency: item.frequency || null
      })),
      duration
    };

      
      const jwtToken = session.access_token;  // Use the session from above

      /// sending the request to the endpoint
      try {
        console.log('Sending booking data:', bookingDetails);

        const response = await fetch(`${API_URL}/api/bookings/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${session.access_token}`, // **ADD THIS LINE: Include JWT in header**
          },
          body: JSON.stringify(bookingDetails),
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        try { // Wrap JSON.parse in a try-catch block
          const data = JSON.parse(responseText);
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create booking');
          }
          const result = await response.json(); // Redundant, data is already parsed
          alert('Booking submitted successfully!');
          console.log('Booking created:', result);

          // Reset form
          resetForm();
          return data; // Return parsed data
          
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          throw new Error('Failed to parse server response.'); // Indicate parsing error
        }

      } catch (error) {
        console.error('Error details:', error);
        throw error;
      }
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add a helper function to reset the form
  const resetForm = () => {
    setArea(0);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setCleaningType('');
    setServiceItems([]);
    setDuration(2);
    setManualPrice(0);
    setCustomerDetails({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
    setIsBusinessCustomer(false);
  };

  // Calculate price using the useBookingPrice hook
  const dateTime = formatDateTime(selectedDate, selectedTime);
  const price = useBookingPrice(area, dateTime, cleaningType);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Book Cleaning Service</h2>
          <p className="mt-2 text-gray-600">Professional cleaning for your space</p>
        </div>

        {/* Customer Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Select Customer Type
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsBusinessCustomer(false)}
              className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                !isBusinessCustomer
                  ? 'bg-blue-50 border-blue-600 text-blue-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Private Customer
            </button>
            <button
              type="button"
              onClick={() => setIsBusinessCustomer(true)}
              className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                isBusinessCustomer
                  ? 'bg-blue-50 border-blue-600 text-blue-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Business Customer
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Cleaning Type Selection */}
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Cleaning Type
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setCleaningType('Home')}
                className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  cleaningType === 'Home'
                    ? 'bg-blue-50 border-blue-600 text-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Home Cleaning
              </button>
              <button
                type="button"
                onClick={() => setCleaningType('Office')}
                className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  cleaningType === 'Office'
                    ? 'bg-blue-50 border-blue-600 text-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Office Cleaning
              </button>
              <button
                type="button"
                onClick={() => setCleaningType('Move-out')}
                className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  cleaningType === 'Move-out'
                    ? 'bg-blue-50 border-blue-600 text-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Move-out Cleaning
              </button>
            </div>
          </div>

        {/* Service Items Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Additional Services (Optional)
            </label>
            <button
              type="button"
              onClick={addServiceItem}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Service
            </button>
          </div>
          
          {serviceItems.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              {/* ... rest of the service item fields ... */}
              <input
                type="text"
                placeholder="Service Name (Optional)"
                value={item.name || ''}
                onChange={(e) => updateServiceItem(index, 'name', e.target.value)}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              
              <textarea
                placeholder="Service Description (Optional)"
                value={item.description || ''}
                onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
              
              <input
                type="text"
                placeholder="Frequency (Optional)"
                value={item.frequency || ''}
                onChange={(e) => updateServiceItem(index, 'frequency', e.target.value)}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}
        </div>

          {/* Area Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Area (square meters)
            </label>
            <input
              type="number"
              min="1"
              required
              className="pr-3 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={area || ''}
              onChange={(e) => setArea(Number(e.target.value))}
              onBlur={() => handleInputBlur('area')}
            />
          </div>
          
          {/* Add DurationSelector here */}
          <DurationSelector />
  
  
          {/* Calendar Component */}
          <div>
            <Calendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
            />
  
            {/* Google Calendar Embed */}
            <div className="mt-8">
              {calendarUrl ? (
                <iframe 
                  src={`${calendarUrl}&height=600&wkst=1&bgcolor=%23ffffff&ctz=Europe%2FLondon&showPrint=0&mode=WEEK&showCalendars=0&showTz=0`}
                  style={{ border: 'solid 1px #777' }}
                  width="100%" 
                  height="600" 
                  frameBorder="0" 
                  scrolling="no"
                  className="rounded-lg"
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center">
                  <p>Loading calendar...</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <div className="relative">
              <input
                type="text"
                required
                className="pr-10 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={customerDetails.name}
                onChange={(e) =>
                  setCustomerDetails({ ...customerDetails, name: e.target.value })
                }
                onBlur={() => handleInputBlur('name')}
              />
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
  
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
            <input
              type="email"
              required
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
              className="pr-10 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={customerDetails.email}
              onChange={(e) =>
                setCustomerDetails({ ...customerDetails, email: e.target.value })
              }
              onBlur={() => handleInputBlur('email')}
            />
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
  
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <div className="relative">
              <input
                type="tel"
                required
                className="pr-10 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={customerDetails.phone}
                onChange={(e) =>
                  setCustomerDetails({ ...customerDetails, phone: e.target.value })
                }
                onBlur={() => handleInputBlur('phone')}
              />
              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <div className="relative">
              <textarea
                required
                rows={3}
                className="pr-10 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={customerDetails.address}
                onChange={(e) =>
                  setCustomerDetails({ ...customerDetails, address: e.target.value })
                }
                onBlur={() => handleInputBlur('address')}
              />
              <Home className="absolute right-3 top-4 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* PriceEditor */}
          <PriceEditor 
            price={manualPrice || price}
            onPriceChange={setManualPrice}
          />

          {/* Preview and Submit Buttons */}
          <div className="flex gap-4">
            <PreviewButton
              onClick={() => {
                if (selectedDate && selectedTime) {
                  setShowPreview(true);
                }
              }}
            />
            <div className="flex-1">
              <SubmitButton 
                isLoading={isSubmitting}
                disabled={!selectedDate || !selectedTime || !cleaningType}
              />
            </div>
          </div>

          {/* Preview Modal */}
          {showPreview && (
            <PreviewModal
              customerDetails={customerDetails}
              cleaningType={cleaningType}
              area={area}
              price={manualPrice || price}
              dateTime={formatDateTime(selectedDate, selectedTime)}
              duration={duration}
              isBusinessCustomer={isBusinessCustomer}
              serviceItems={serviceItems}
              onClose={() => setShowPreview(false)}
            />
          )}
        </form>
      </div>
    </div>
  );
}