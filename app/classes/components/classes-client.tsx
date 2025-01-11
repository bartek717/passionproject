"use client";

import React, { useState, useEffect } from 'react';

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

interface ClassesClientProps {
  getClasses: () => Promise<{ success: boolean; data: Class[] | null; error: string | null }>;
  createClass: (name: string, files: File[]) => Promise<{ success: boolean; classId?: string; error?: string }>;
  deleteClass: (classId: string) => Promise<{ success: boolean; error: string | null }>;
  deleteDocument: (documentId: string) => Promise<{ success: boolean; error: string | null }>;
  addDocumentsToClass: (classId: string, files: File[]) => Promise<{ success: boolean; error: string | null }>;
}

export default function ClassesClient({ 
  getClasses, 
  createClass, 
  deleteClass, 
  deleteDocument, 
  addDocumentsToClass 
}: ClassesClientProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchClasses();
  }, [getClasses]);

  async function fetchClasses() {
    console.log('Fetching classes...');
    setIsLoading(true);
    const result = await getClasses();
    console.log('Classes result:', result);
    if (result.success && result.data) {
      setClasses(result.data);
      setError(null);
    } else {
      setClasses([]);
      setError(result.error || 'Failed to load classes');
    }
    setIsLoading(false);
  }

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
        await fetchClasses();
        if (result.classId) {
          const newClass = (await getClasses()).data?.find(c => c.id === result.classId);
          if (newClass) {
            setSelectedClass(newClass);
          }
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
      await fetchClasses();
    } else {
      setError(result.error || 'Failed to delete class');
    }
    setIsLoading(false);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    setLoadingDocuments(prev => ({ ...prev, [documentId]: true }));
    const result = await deleteDocument(documentId);
    if (result.success) {
      await fetchClasses();
    } else {
      setError(result.error || 'Failed to delete document');
    }
    setLoadingDocuments(prev => {
      const newState = { ...prev };
      delete newState[documentId];
      return newState;
    });
  };

  const handleAddDocuments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingClass || !e.target.files?.length) return;
    
    const uploadId = 'upload-' + Date.now();
    setLoadingDocuments(prev => ({ ...prev, [uploadId]: true }));
    
    try {
      const files = Array.from(e.target.files);
      const result = await addDocumentsToClass(editingClass.id, files);
      if (result.success) {
        await fetchClasses();
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
      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Your Classes</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Class
          </button>
        </div>

        {isLoading ? (
          <div className="text-white">Loading classes...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : classes.length === 0 ? (
          <div className="text-gray-400">No classes found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="relative group bg-gray-800 p-4 rounded-lg"
              >
                <button
                  onClick={() => setSelectedClass(cls)}
                  className="w-full text-left"
                >
                  <h2 className="text-xl font-semibold text-white">{cls.name}</h2>
                  <p className="text-gray-400">{cls.documents.length} documents</p>
                </button>
                
                <button
                  onClick={() => setEditingClass(cls)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
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
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  disabled={isLoading}
                />
              </div>

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
                      onChange={handleAddDocuments}
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
                          className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          disabled={loadingDocuments[doc.id]}
                        >
                          {loadingDocuments[doc.id] ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
    </div>
  );
} 