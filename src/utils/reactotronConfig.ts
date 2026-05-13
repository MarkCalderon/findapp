import Reactotron from 'reactotron-react-native';
import { QueryClientManager, reactotronReactQuery } from 'reactotron-react-query';

import { queryClient } from './queryClient';

const queryClientManager = new QueryClientManager({ queryClient });

// biome-ignore lint/correctness/useHookAtTopLevel: Reactotron plugin method, not a React hook
Reactotron.configure({
  name: 'FindApp',
  onDisconnect: () => {
    queryClientManager.unsubscribe();
  },
})
  .use(reactotronReactQuery(queryClientManager))
  .useReactNative({
    networking: { ignoreUrls: /symbolicate|hot-update/ },
  })
  .connect();
