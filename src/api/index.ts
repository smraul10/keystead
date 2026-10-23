export {
  createVault,
  getVaultStatus,
  lockVault,
  type VaultStatus,
} from './commands';
export {
  type CommandError,
  CommandFailedError,
  commandErrorOf,
  errorMessage,
} from './errors';
