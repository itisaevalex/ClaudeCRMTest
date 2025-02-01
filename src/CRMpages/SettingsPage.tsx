import React from 'react';
import { Building, Mail, DollarSign, Calendar } from 'lucide-react';

function SettingsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Settings</h2>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {/* Company Information */}
        <div className="p-6">
          <div className="flex items-center">
            <Building className="h-6 w-6 text-gray-400" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">
              Company Information
            </h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                name="company-name"
                id="company-name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="p-6">
          <div className="flex items-center">
            <Mail className="h-6 w-6 text-gray-400" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">
              Email Settings
            </h3>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send booking confirmation emails
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send reminder emails
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing Settings */}
        <div className="p-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-gray-400" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">
              Pricing Settings
            </h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="base-rate" className="block text-sm font-medium text-gray-700">
                Base Hourly Rate
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  name="base-rate"
                  id="base-rate"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Settings */}
        <div className="p-6">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-gray-400" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">
              Calendar Settings
            </h3>
          </div>
          <div className="mt-6 space-y-4">
            <div className="sm:col-span-3">
              <label htmlFor="work-hours" className="block text-sm font-medium text-gray-700">
                Working Hours
              </label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <input
                  type="time"
                  name="start-time"
                  id="start-time"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="time"
                  name="end-time"
                  id="end-time"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default SettingsPanel;