# Service Template

Use this for Supabase-backed service modules in `src/services/`.

Best fit:

- reads and writes to a single backend resource
- small feature-specific database boundary
- service modules consumed by React Query hooks or top-level flows

Modeled on:

- `src/services/profile/onboardingStatusService.ts`
- `src/services/profile/profileBootstrapService.ts`

```ts
import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';

interface RESOURCE_DATABASE_HERE {
  public: {
    Tables: {
      TABLE_NAME_HERE: {
        Row: {
          user_id: string;
          FIELD_NAME_HERE: string | null;
        };
        Insert: {
          user_id: string;
          FIELD_NAME_HERE?: string | null;
        };
        Update: {
          user_id?: string;
          FIELD_NAME_HERE?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type TableInsert =
  RESOURCE_DATABASE_HERE['public']['Tables']['TABLE_NAME_HERE']['Insert'];

function getRESOURCE_NAME_HEREClient(): SupabaseClientLike<RESOURCE_DATABASE_HERE> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<RESOURCE_DATABASE_HERE>;
}

export async function getRESOURCE_NAME_HERE(userId: string): Promise<string | null> {
  const supabase = getRESOURCE_NAME_HEREClient();

  const { data, error } = await supabase
    .from('TABLE_NAME_HERE')
    .select('FIELD_NAME_HERE')
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return data?.FIELD_NAME_HERE ?? null;
}

export async function updateRESOURCE_NAME_HERE(
  userId: string,
  nextValue: string | null,
): Promise<void> {
  const supabase = getRESOURCE_NAME_HEREClient();
  const payload: TableInsert = {
    user_id: userId,
    FIELD_NAME_HERE: nextValue,
  };

  const { error } = await supabase
    .from('TABLE_NAME_HERE')
    .upsert(payload, { onConflict: 'user_id' });

  if (error != null) {
    throw error;
  }
}
```

## Notes

- Keep the typed database slice local when the service only needs a narrow subset.
- Throw real errors instead of silently defaulting on backend failure.
- Keep data mapping here, not in screens.
- If the service is not wired yet, use the repo’s scaffold style: define the interface and throw a descriptive error naming the intended table, view, or RPC.

## Variants

Use a different shape when:

- the feature writes through an RPC instead of a table
- the resource is not keyed by `user_id`
- the module is an identity/SDK integration and would be better as a core-plus-wrapper pattern
