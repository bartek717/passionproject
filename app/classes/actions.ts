'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

function sanitizeFileName(fileName: string): string {
  // Remove special characters and spaces, replace with underscores
  return fileName.replace(/[^a-zA-Z0-9.]/g, '_');
}

export async function createClass(name: string, files: File[]) {
  const supabase = await createClient();
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    // Create the class with user_id
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert([{ 
        name,
        user_id: user.id
      }])
      .select()
      .single();

    if (classError) throw classError;

    // Upload each file and create document records
    for (const file of files) {
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${classData.id}/${sanitizedName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: documentError } = await supabase
        .from('documents')
        .insert([{
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          class_id: classData.id,
          user_id: user.id
        }]);

      if (documentError) throw documentError;
    }

    revalidatePath('/classes');
    return { success: true, classId: classData.id };
  } catch (error) {
    console.error('Error creating class:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create class'
    };
  }
}

export async function getClasses() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        description,
        documents (
          id,
          name,
          file_path
        )
      `);

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { success: false, data: null, error: 'Failed to fetch classes' };
  }
}

export async function deleteClass(classId: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) throw error;
    revalidatePath('/classes');
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: 'Failed to delete class' };
  }
}

export async function deleteDocument(documentId: string) {
  const supabase = await createClient();
  
  try {
    // First get the document to get its file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!document) throw new Error('Document not found');

    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (storageError) throw storageError;

    // Then delete the document record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;

    revalidatePath('/classes');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: 'Failed to delete document' };
  }
}

export async function addDocumentsToClass(classId: string, files: File[]) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    for (const file of files) {
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${classId}/${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: documentError } = await supabase
        .from('documents')
        .insert([{
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          class_id: classId,
          user_id: user.id
        }]);

      if (documentError) throw documentError;
    }

    revalidatePath('/classes');
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: 'Failed to add documents' };
  }
} 