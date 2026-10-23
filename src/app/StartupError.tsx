import { type CommandError, errorMessage } from '@/api';
import { CardScreen } from '@/components/CardScreen';

interface StartupErrorProps {
  error: CommandError;
}

// When Rust can't say at launch whether there is a vault (e.g. the data
// folder can't be read), Keystead can't go on: say why
export function StartupError({ error }: StartupErrorProps) {
  return (
    <CardScreen subtitle="Couldn't start">
      <p role='alert' className='text-center text-sm text-rose-700'>
        {errorMessage(error)}
      </p>
    </CardScreen>
  );
}
