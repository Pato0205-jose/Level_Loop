import { useCallback, useEffect, useState } from 'react';

import { checkBackendHealth } from '../config/backend';

type Status = 'checking' | 'ok' | 'fail';

export function useBackendReachable() {
  const [status, setStatus] = useState<Status>('checking');
  const [message, setMessage] = useState<string | null>(null);

  const recheck = useCallback(async () => {
    setStatus('checking');
    const result = await checkBackendHealth();
    if (result.ok) {
      setStatus('ok');
      setMessage(null);
    } else {
      setStatus('fail');
      setMessage(result.error);
    }
  }, []);

  useEffect(() => {
    void recheck();
  }, [recheck]);

  return { status, message, recheck };
}
