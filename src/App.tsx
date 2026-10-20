import { PasswordGenerator } from './features/generator/PasswordGenerator';

function App() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 text-zinc-900'>
      <h1 className='text-4xl font-bold'>Welcome to Keystead</h1>
      <p className='text-zinc-500'>Your passwords, stored locally</p>
      <PasswordGenerator />
    </main>
  );
}

export default App;
