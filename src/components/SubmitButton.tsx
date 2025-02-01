import React from 'react';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  isLoading: boolean;
  disabled: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isLoading, disabled }) => {
  return (
    <button
      type="submit"
      className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
          Submitting...
        </>
      ) : (
        'Book Now'
      )}
    </button>
  );
};

export default SubmitButton;