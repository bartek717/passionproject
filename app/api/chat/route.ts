import { createClient } from '@/utils/supabase/server';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

export async function POST(request: Request) {
  try {
    const { message, classId } = await request.json();
    const supabase = await createClient();

    // Initialize vector store
    const vectorStore = new SupabaseVectorStore(
      new OpenAIEmbeddings(),
      {
        client: supabase,
        tableName: 'documents',
        queryName: 'match_documents',
      }
    );

    // Search for relevant documents
    const searchResults = await vectorStore.similaritySearch(message, 3);

    // Format context from search results
    const context = searchResults.map(doc => doc.pageContent).join('\n\n');

    // Initialize chat model
    const chat = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
    });

    // Generate response
    const response = await chat.call([
      new SystemMessage(
        `You are a helpful study assistant. Use the following context from course materials to answer the user's question. 
         If you use information from the context, make sure to cite it in your response.
         Context: ${context}`
      ),
      new HumanMessage(message),
    ]);

    // Format sources
    const sources = searchResults.map(doc => ({
      document: doc.metadata.filename,
      excerpt: doc.pageContent.substring(0, 200) + '...',
      page: doc.metadata.page,
    }));

    return Response.json({
      response: response.content,
      sources,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 