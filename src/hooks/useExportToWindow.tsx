import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import useOffChainDatabase from 'hooks/useOffChainDatabase';

export default () => {
  (window as any).store = useStore();
  (window as any).database = useDatabase();
  (window as any).offChainDatabase = useOffChainDatabase();
};
