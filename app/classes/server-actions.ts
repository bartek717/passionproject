'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import OpenAI from 'openai';
import { extractTextFromDocument } from './utils/documentProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.]/g, '_');
}

export async function getClassesAction() {
  const supabase = await createClient();
  
  try {
    // First get the user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError){
      console.log('Supabase error:', userError);
      throw userError;
    }

    // Get classes with documents as a join
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        description,
        documents!class_id (
          id,
          name,
          file_path
        )
      `)
      .eq('user_id', user?.id);

    if (error) {
      console.log('Supabase error:', error);
      console.error('Supabase error:', error);
      throw error;
    }
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { success: false, data: null, error: error instanceof Error ? error.message : 'Failed to fetch classes' };
  }
}

export async function createClassAction(name: string, files: File[]) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert([{ 
        name,
        user_id: user.id
      }])
      .select()
      .single();

    if (classError) throw classError;

    for (const file of files) {
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${classData.id}/${sanitizedName}`;
      
      const content = await extractTextFromDocument(file);
      
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      });

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
          class_id: classData.id,
          user_id: user.id,
          content: content,
          embedding: embedding.data[0].embedding
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

export async function deleteClassAction(classId: string) {
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

export async function deleteDocumentAction(documentId: string) {
  const supabase = await createClient();
  
  try {
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!document) throw new Error('Document not found');

    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (storageError) throw storageError;

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

export async function addDocumentsToClassAction(classId: string, files: File[]) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    for (const file of files) {
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${classId}/${sanitizedName}`;
      
      const content = await extractTextFromDocument(file);
      
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      });

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
          user_id: user.id,
          content: content,
          embedding: embedding.data[0].embedding
        }]);

      if (documentError) throw documentError;
    }

    revalidatePath('/classes');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error adding documents:', error);
    return { success: false, error: 'Failed to add documents' };
  }
} 