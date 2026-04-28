# Query Hook Template

Use this for backend-backed React Query hooks.

Best fit:

- data that comes from Supabase or another service boundary
- per-user records keyed by `userId`
- mutations that should invalidate a related query

Modeled on:

- `src/queries/profile/useOnboardingStatusQuery.ts`
- `src/queries/profile/useCompleteOnboardingMutation.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRESOURCE_NAME_HERE,
  updateRESOURCE_NAME_HERE,
} from '../../services/PATH_TO_SERVICE';

export function getRESOURCE_NAME_HEREQueryKey(userId: string | null) {
  return ['resource-name-here', userId] as const;
}

export function useRESOURCE_NAME_HEREQuery(userId: string | null) {
  return useQuery({
    queryKey: getRESOURCE_NAME_HEREQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getRESOURCE_NAME_HERE(userId as string),
  });
}

export function useUpdateRESOURCE_NAME_HEREMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UPDATE_RESOURCE_INPUT_HERE) => {
      if (userId == null) {
        throw new Error('Cannot update this resource without a signed-in user.');
      }

      return updateRESOURCE_NAME_HERE(userId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getRESOURCE_NAME_HEREQueryKey(userId),
      });
    },
  });
}
```

## Notes

- Keep the query key helper in the same file as the hook.
- Use `enabled` when the hook depends on `userId`.
- Let the service own the actual API/database call.
- Invalidate the smallest matching query key you can.

## When Not To Use This

Do not use React Query for:

- local-only UI state
- short-lived wizard step state
- domain calculations that belong in `src/lib/`
