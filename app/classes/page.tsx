"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createClass, getClasses, deleteClass, deleteDocument, addDocumentsToClass } from './actions';

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
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const result = await getClasses();
    if (result.success && result.data) {
      setClasses(result.data);
      setError(null);
    } else {
      setClasses([]);
      setError(result.error || 'Failed to load classes');
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
        await loadClasses();
        const newClass = (await getClasses()).data?.find(c => c.id === result.classId);
        if (newClass) {
          setSelectedClass(newClass);
        }
      } else {
        setError(result.error || 'Failed to create class');
      }
    } catch (err) {
      setError('Failed to create class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    setIsLoading(true);
    const result = await deleteClass(classId);
    if (result.success) {
      setSelectedClass(null);
      setEditingClass(null);
      await loadClasses();
    } else {
      setError(result.error || 'Failed to delete class');
    }
    setIsLoading(false);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    setLoadingDocuments(prev => ({ ...prev, [documentId]: true }));
    
    try {
      const result = await deleteDocument(documentId);
      if (result.success) {
        const updatedClasses = await getClasses();
        if (updatedClasses.success && updatedClasses.data) {
          const updatedClass = updatedClasses.data.find(c => c.id === editingClass?.id);
          if (updatedClass) {
            setEditingClass(updatedClass);
            if (selectedClass?.id === editingClass?.id) {
              setSelectedClass(updatedClass);
            }
            setClasses(updatedClasses.data);
          }
        }
      } else {
        setError(result.error || 'Failed to delete document');
      }
    } finally {
      setLoadingDocuments(prev => {
        const newState = { ...prev };
        delete newState[documentId];
        return newState;
      });
    }
  };

  const handleAddDocuments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingClass || !e.target.files?.length) return;
    
    const uploadId = 'upload-' + Date.now();
    setLoadingDocuments(prev => ({ ...prev, [uploadId]: true }));
    
    try {
      const files = Array.from(e.target.files);
      const result = await addDocumentsToClass(editingClass.id, files);
      if (result.success) {
        const updatedClasses = await getClasses();
        if (updatedClasses.success && updatedClasses.data) {
          const updatedClass = updatedClasses.data.find(c => c.id === editingClass.id);
          if (updatedClass) {
            setEditingClass(updatedClass);
            if (selectedClass?.id === editingClass.id) {
              setSelectedClass(updatedClass);
            }
            setClasses(updatedClasses.data);
          }
        }
      } else {
        setError(result.error || 'Failed to add documents');
      }
    } finally {
      setLoadingDocuments(prev => {
        const newState = { ...prev };
        delete newState[uploadId];
        return newState;
      });
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
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">{selectedClass.name}</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {/* Chat messages will go here */}
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
            <div
              key={cls.id}
              className="relative group"
            >
              <button
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
              
              {/* Edit button that appears on hover */}
              <button
                onClick={() => setEditingClass(cls)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">{editingClass.name}</h2>
              <button
                onClick={() => setEditingClass(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Documents Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-white">Documents</h3>
                  <label className="cursor-pointer px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add Files
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={(e) => {
                        handleAddDocuments(e);
                        e.target.value = '';
                      }}
                      disabled={isLoading}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  {editingClass.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded"
                    >
                      <span className="text-gray-300">{doc.name}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`)}
                          className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loadingDocuments[doc.id]}
                        >
                          {loadingDocuments[doc.id] ? (
                            <span className="inline-block animate-spin">↻</span>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  {Object.keys(loadingDocuments).some(key => key.startsWith('upload-')) && (
                    <div className="flex items-center justify-center p-4">
                      <span className="inline-block animate-spin text-blue-500 text-2xl">↻</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Class Button */}
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleDeleteClass(editingClass.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={isLoading}
                >
                  Delete Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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