import React, { useState, KeyboardEvent } from 'react';
import { Edit2, X } from 'lucide-react';

interface PriceEditorProps {
  price: number;
  onPriceChange: (price: number) => void;
}

const PriceEditor: React.FC<PriceEditorProps> = ({ price, onPriceChange }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedPrice, setEditedPrice] = useState<string>(price.toString());

  const handleEditClick = (): void => {
    setIsEditing(true);
    setEditedPrice(price.toString());
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
    setEditedPrice(price.toString());
    onPriceChange(price);
  };

  const handleConfirmEdit = (): void => {
    setIsEditing(false);
    const finalPrice = editedPrice === '' ? 0 : parseFloat(editedPrice);
    onPriceChange(finalPrice);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      e.stopPropagation(); // Stop event bubbling
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
      setEditedPrice(value);
      onPriceChange(value === '' ? 0 : parseFloat(value));
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-3 rounded-lg" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center">
        <span className="text-lg font-medium text-gray-900">Total Price:</span>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">€</span>
            <input
              type="text"
              value={editedPrice}
              onChange={handlePriceChange}
              onKeyDown={handleKeyPress}
              className="w-32 px-3 py-2 border rounded-md text-2xl font-bold text-blue-600"
              autoFocus
              // Prevent form submission on enter
              onSubmit={(e) => e.preventDefault()}
            />
            <button
              type="button" // Explicitly set button type
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              €{Number(price).toFixed(2)}
            </span>
            <button
              type="button" // Explicitly set button type
              onClick={handleEditClick}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceEditor;