import { redirect } from 'next/navigation';

// use later for home page and links to login page
export default function Home() {
  redirect('/login');
}
