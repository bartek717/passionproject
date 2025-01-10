"use client";

import React, { useState } from 'react';

interface Class {
  id: string;
  name: string;
  description: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Side - Chat/Content */}
      <div className="flex-1 flex flex-col">
        {!selectedClass ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">A New Way to Study</h1>
              <p className="text-xl text-slate-600">Smarter. Together.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Chat Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Chat messages will go here */}
            </div>
            
            {/* RAG Results Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <h3 className="font-semibold text-gray-700 mb-2">Related Content</h3>
              {/* RAG results will go here */}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask a question about your class..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Classes List */}
      <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Classes</h2>
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              // TODO: Implement class creation
              console.log('Create new class');
            }}
          >
            Create New Class
          </button>
        </div>

        <div className="space-y-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedClass?.id === cls.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <h3 className="font-medium">{cls.name}</h3>
              <p className="text-sm text-gray-500">{cls.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 