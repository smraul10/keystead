import { PasswordGenerator } from './features/generator/PasswordGenerator';

function App() {
  return (
    <main className='min-h-screen flex flex-col items-center justify-center gap-2 bg-zinc-950 text-zinc-50'>
      <h1 className='text-4xl font-bold'>Welcome to Keystead</h1>
      <p className='text-zinc-400'>Your passwords, stored locally</p>
      <PasswordGenerator />
    </main>
  );
}

export default App;
