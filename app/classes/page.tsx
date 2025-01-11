import { getClassesAction } from './server-actions';
import { headers } from 'next/headers';

export default async function ClassesPage() {
  // Force dynamic rendering
  headers();
  
  try {
    const result = await getClassesAction();
    
    return (
      <div className="p-4">
        <h1>Classes Page</h1>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    );
  } catch (error) {
    console.error('Error in ClassesPage:', error);
    return (
      <div className="p-4 text-red-500">
        <h1>Error loading classes</h1>
        <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
      </div>
    );
  }
}