
import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from './icons';

interface Item {
  id: string;
  text: string;
}

interface ConstraintInputProps {
  title: string;
  items: Item[];
  onAdd: (item: string) => void;
  onRemove: (id: string) => void;
  placeholder: string;
  selectOptions?: { value: string; label: string }[];
}

export const ConstraintInput: React.FC<ConstraintInputProps> = ({ title, items, onAdd, onRemove, placeholder, selectOptions }) => {
  const [newItem, setNewItem] = useState(selectOptions ? selectOptions[0]?.value || '' : '');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAdd(newItem.trim());
      if (selectOptions) {
        setNewItem(selectOptions[0]?.value || '');
      } else {
        setNewItem('');
      }
    }
  };

  const inputStyles = "flex-grow p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition placeholder:text-slate-400 text-slate-900";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 h-full flex flex-col">
      <h3 className="text-xl font-bold text-slate-800 mb-4">{title}</h3>
      <form onSubmit={handleAdd} className="flex items-center mb-4 gap-2">
        {selectOptions ? (
          <select
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className={inputStyles}
          >
            {selectOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-white text-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            className={inputStyles}
          />
        )}
        <button
          type="submit"
          className="bg-primary-500 text-white p-2 rounded-md hover:bg-primary-600 transition-colors flex-shrink-0"
          aria-label={`Add ${title}`}
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </form>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2" style={{maxHeight: '250px'}}>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between bg-slate-100 p-2 rounded-md group"
            >
              <span className="text-slate-700 text-sm truncate">{item.text}</span>
              <div className="flex items-center flex-shrink-0">
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-slate-400 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${item.text}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
           {items.length === 0 && (
            <li className="text-center text-slate-400 py-4">No {title.toLowerCase()} added.</li>
          )}
        </ul>
      </div>
    </div>
  );
};