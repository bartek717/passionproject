"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createClass, getClasses } from './actions';

interface Document {
  id: string;
  name: string;
  file_path: string;
}

interface Class {
  id: string;
  name: string;
  description: string;
  documents: Document[];
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const result = await getClasses();
    if (result.success) {
      setClasses(result.data);
    } else {
      setError(result.error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createClass(newClassName, files);
      if (result.success) {
        setModalOpen(false);
        setNewClassName('');
        setFiles([]);
        await loadClasses(); // Reload classes
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create class');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Side - Chat/Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'mr-80' : 'mr-0'}`}>
        {!selectedClass ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">A New Way to Study</h1>
              <p className="text-xl text-gray-400">Smarter. Together.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Chat messages will go here */}
            </div>
            
            <div className="border-t border-gray-700 p-4 bg-gray-800">
              <h3 className="font-semibold text-gray-300 mb-2">Related Content</h3>
            </div>

            <div className="border-t border-gray-700 p-4">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask a question about your class..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-l-lg shadow-lg z-10"
      >
        {isSidebarOpen ? '→' : '←'}
      </button>

      {/* Right Side - Classes List */}
      <div
        className={`fixed right-0 top-0 h-full w-80 border-l border-gray-700 bg-gray-800 p-4 overflow-y-auto transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Classes</h2>
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setModalOpen(true)}
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
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <h3 className="font-medium">{cls.name}</h3>
              <p className="text-sm text-gray-400">{cls.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-4">Create New Class</h2>
            {error && (
              <div className="mb-4 p-2 bg-red-500 bg-opacity-10 border border-red-500 rounded text-red-500">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter class name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Upload Files
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isLoading}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Selected Files:</p>
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between text-sm text-gray-400">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300"
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 