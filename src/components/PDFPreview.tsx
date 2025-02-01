import React from 'react';
import { Eye } from 'lucide-react';

interface PreviewProps {
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  cleaningType: string;
  area: number;
  price: number;
  dateTime: string;
  duration: number;
  isBusinessCustomer: boolean;
  serviceItems: Array<{
    name: string;
    description?: string;
    frequency?: string;
  }>;
}

const PDFPreview: React.FC<PreviewProps> = ({
  customerDetails,
  cleaningType,
  area,
  price,
  dateTime,
  serviceItems
}) => {
  const formattedDate = new Date(dateTime).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="font-sans text-[11px] leading-normal text-black p-5">
      {/* Logo */}
      <div className="mb-5">
        <div className="text-[32px] font-bold tracking-wider">
          RE<span className="text-[#4CAF50]">CT</span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2.5">{formattedDate}</div>
        <p>Thank you for your inquiry. We hope you find this offer advantageous!</p>
      </div>

      {/* Customer Info */}
      <div className="mb-5">
        <strong>Customer:</strong> {customerDetails.name}<br />
        <strong>Address:</strong> {customerDetails.address}
      </div>

      {/* Work Description */}
      <div className="mb-5">
        <div className="font-bold mb-2 uppercase">WORK DESCRIPTION:</div>
        
        <div className="mb-4 border-b border-black pb-4">
          {cleaningType} Cleaning - {area} square meters
        </div>

        {serviceItems.length > 0 && (
          <div className="mb-5">
            {serviceItems.map((item, index) => (
              <div key={index} className="flex justify-between mb-2.5 py-1">
                <div className="flex-1">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-[#444] mt-0.5">{item.description}</div>
                </div>
                <div className="text-right min-w-[120px] pl-4">{item.frequency}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-black my-4"></div>

      {/* Periodic Services */}
      <div className="mt-4">
        <div className="font-bold mb-2 uppercase">PERIODIC SERVICES</div>
        <div className="flex justify-between mb-2.5 py-1">
          <div className="flex-1">
            Window cleaning inside, between, and outside, as well as thorough cleaning of the stairwell
          </div>
          <div className="text-right min-w-[120px] pl-4">Upon request/order</div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4 mb-5">
        The work description is based on your requirements, but it's always possible to add or remove services as needed. 
        The price includes all necessary cleaning materials.
      </div>

      {/* Price Section */}
      <div className="mt-8">
        <div className="font-bold text-[13px] my-2.5">
          Your discounted price is: €{price.toFixed(2)} excl. VAT
        </div>
        <div className="mt-2.5">
          We will clean for 4-5 hours per session, depending on the needs and to ensure your satisfaction!
        </div>
      </div>
    </div>
  );
};

export const PreviewModal: React.FC<PreviewProps & { onClose: () => void }> = ({ onClose, ...props }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-[21cm] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b flex justify-between items-center px-4 py-2">
          <h2 className="text-lg font-semibold">Offer Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>
        <PDFPreview {...props} />
      </div>
    </div>
  );
};

export const PreviewButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <Eye className="w-4 h-4 mr-2" />
      Preview Offer
    </button>
  );
};

export default PDFPreview;