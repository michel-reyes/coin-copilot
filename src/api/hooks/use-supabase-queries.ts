import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SUPABASE_KEYS } from '@/api/constants/apiSettings';
import { accountSettingsQuery } from '@/api/constants/queryOptions';
import { upsertAccountSettings } from '@/lib/accountSettingsService';

// ------------------------------------------------------------------

export const useGetAccountSettings = (
    accountId: string,
    institutionName: string
) => {
    return useQuery(accountSettingsQuery(accountId, institutionName));
};

// ------------------------------------------------------------------

export const useUpsertAccountSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            accountId,
            institutionName,
            balanceLimit,
            dueDay,
        }: {
            accountId: string;
            institutionName: string;
            balanceLimit?: number | null;
            dueDay?: number | null;
        }) => {
            return upsertAccountSettings(
                accountId,
                institutionName,
                balanceLimit,
                dueDay
            );
        },
        onSuccess: (data, variables) => {
            // Invalidate all account settings queries
            queryClient.invalidateQueries({
                queryKey: [SUPABASE_KEYS.accountSettings],
            });

            // Also update the query cache directly for immediate UI updates
            queryClient.setQueryData(
                [
                    SUPABASE_KEYS.accountSettings,
                    variables.accountId,
                    variables.institutionName,
                ],
                data
            );
        },
    });
};
