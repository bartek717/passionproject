'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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
      const filePath = `${classData.id}/${file.name}`;
      
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