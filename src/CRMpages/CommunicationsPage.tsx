import React from 'react';
import { MessageSquare, Mail } from 'lucide-react';

// Mock data for demonstration
const mockCommunications = [
  {
    id: 1,
    customerName: 'Sarah Johnson',
    type: 'email',
    subject: 'Booking Confirmation',
    message: 'Your cleaning service has been scheduled for March 15th at 9:00 AM.',
    date: '2024-03-10',
    status: 'sent',
  },
  // Add more mock communications as needed
];

function Communications() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Communications</h2>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <Mail className="h-4 w-4 mr-2" />
          New Message
        </button>
      </div>

      {/* Communication List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="divide-y divide-gray-200">
          {mockCommunications.map((comm) => (
            <div key={comm.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  comm.type === 'email' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {comm.type === 'email' ? (
                    <Mail className={`h-5 w-5 ${
                      comm.type === 'email' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {comm.customerName}
                    </p>
                    <p className="text-sm text-gray-500">{comm.date}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {comm.subject}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {comm.message}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      comm.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Communications;