import { useOnline } from '@vueuse/core';
import { computed } from 'vue';

import { reachable } from '~/offline/useReachability';

// Module scope: one set of window listeners for the app, not one per caller.
const networkOnline = useOnline();
const online = computed(() => networkOnline.value && reachable.value);

export function useOnlineStatus() {
  return { networkOnline, reachable, online };
}
