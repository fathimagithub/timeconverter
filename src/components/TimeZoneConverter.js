import React, { useState, useEffect } from 'react';
import { ArrowUpDown, X, Moon, Sun, Link, Copy, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const timezones = [
  { id: 'UTC', name: 'Universal Time Coordinated', offset: 0 },
  { id: 'IST', name: 'India Standard Time', offset: 5.5 },
  { id: 'EST', name: 'Eastern Standard Time', offset: -5 },
  { id: 'PST', name: 'Pacific Standard Time', offset: -8 },
];

const TimeZoneConverter = () => {
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [activeTimezones, setActiveTimezones] = useState(['UTC', 'IST']);
  const [availableTimezones, setAvailableTimezones] = useState(
    timezones.filter(tz => !activeTimezones.includes(tz.id))
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark' : 'light';
    
    setIsLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const encodedState = urlParams.get('state');
    if (encodedState) {
      try {
        const decodedState = JSON.parse(atob(encodedState));
        if (!decodedState.time || !Array.isArray(decodedState.timezones)) {
          throw new Error('Invalid state format');
        }
        setSelectedTime(new Date(decodedState.time));
        setActiveTimezones(decodedState.timezones);
        setAvailableTimezones(timezones.filter(tz => !decodedState.timezones.includes(tz.id)));
      } catch (error) {
        console.error('Failed to parse state from URL', error);
        setError('Failed to load shared configuration. Using default settings.');
      }
    }
    setIsLoading(false);
  }, [isDarkMode]);

  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime);
    setSliderValue(0);
  };

  const handleSliderChange = (event) => {
    const value = parseInt(event.target.value);
    setSliderValue(value);
    const newTime = new Date(selectedTime.getTime() + value * 60000);
    setSelectedTime(newTime);
  };

  const addTimezone = (event) => {
    const tzId = event.target.value;
    if (tzId) {
      setActiveTimezones([...activeTimezones, tzId]);
      setAvailableTimezones(availableTimezones.filter(tz => tz.id !== tzId));
    }
  };

  const removeTimezone = (tzId) => {
    setActiveTimezones(activeTimezones.filter(id => id !== tzId));
    setAvailableTimezones([...availableTimezones, timezones.find(tz => tz.id === tzId)]);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(activeTimezones);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setActiveTimezones(items);
  };

  const reverseOrder = () => {
    setActiveTimezones([...activeTimezones].reverse());
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const getTimeInTimezone = (date, tzOffset) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * tzOffset));
  };

  const generateShareableLink = () => {
    const state = {
      time: selectedTime.toISOString(),
      timezones: activeTimezones,
    };
    const encodedState = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?state=${encodedState}`;
    setShareableLink(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Time Zone Converter</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <DatePicker
                selected={selectedTime}
                onChange={handleTimeChange}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className={`flex-grow border p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
              />
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded ${isDarkMode ? 'bg-yellow-600' : 'bg-gray-300'} text-white`}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <div>
              <input
                type="range"
                min="-1440"
                max="1440"
                value={sliderValue}
                onChange={handleSliderChange}
                className="w-full"
              />
              <div className="text-center mt-2">
                Adjust time: {sliderValue > 0 ? '+' : ''}{sliderValue} minutes
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="timezones">
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {activeTimezones.map((tzId, index) => {
                      const timezone = timezones.find(tz => tz.id === tzId);
                      const timeInZone = getTimeInTimezone(selectedTime, timezone.offset);
                      return (
                        <Draggable key={tzId} draggableId={tzId} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center justify-between p-3 rounded ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}
                            >
                              <span className="font-medium">{timezone.name} ({timezone.id})</span>
                              <div className="flex items-center space-x-4">
                                <span>{timeInZone.toLocaleString()}</span>
                                <button onClick={() => removeTimezone(tzId)} className="text-red-500">
                                  <X size={16} />
                                </button>
                              </div>
                            </li>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex items-center space-x-2">
              <select
                onChange={addTimezone}
                className={`border p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
              >
                <option value="">Add Time Zone</option>
                {availableTimezones.map(tz => (
                  <option key={tz.id} value={tz.id}>{tz.name}</option>
                ))}
              </select>
              <button
                onClick={reverseOrder}
                className={`p-2 rounded ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`}
              >
                <ArrowUpDown size={16} />
                Reverse Order
              </button>
            </div>

            <button
              onClick={generateShareableLink}
              className={`w-full p-2 rounded ${isDarkMode ? 'bg-green-600' : 'bg-green-500'} text-white`}
            >
              <Link size={16} className="inline-block mr-2" />
              Get Shareable Link
            </button>

            {shareableLink && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Shareable Link:</h2>
                <div className="flex">
                  <input
                    type="text"
                    value={shareableLink}
                    readOnly
                    className={`flex-grow p-2 border rounded-l ${
                      isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                    }`}
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`p-2 rounded-r ${
                      isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                    } text-white flex items-center`}
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeZoneConverter;