import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    updateAccountSetting,
    createTransactionAnomaly,
    updateAppSettings,
    deleteTransactionsAnomaly,
    fetchTransactionsAnomaly,
    markAllTransactionAnomalyAsRead,
    createMessageAlert,
    deleteMessageAlert,
    updateMessageAlert,
    fetchMessageAlerts,
} from '@/api/prisma-api-service';
import { PRISMA_KEYS } from '@/api/constants/apiSettings';
import { accountSettingsQuery, appSettingsQuery } from '@/api/constants/queryOptions';

// ------------------------------------------------------------------

export const useGetAccountSettings = (accountId?: string) => {
    return useQuery(accountSettingsQuery(accountId));
};

// ------------------------------------------------------------------

export const useUpdateAccountSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ accountId, updateData }: { accountId: string; updateData: any }) => {
            return updateAccountSetting(accountId, updateData);
        },
        onSuccess: (data, variables) => {
            // Invalidate the specific account settings query
            queryClient.invalidateQueries({ queryKey: [PRISMA_KEYS.accountSettings] });

            // Also update the query cache directly for immediate UI updates
            queryClient.setQueryData(
                [PRISMA_KEYS.accountSettings, variables.accountId],
                (oldData: any) => {
                    // If we have the specific account in cache, update it
                    if (oldData) {
                        return {
                            ...oldData,
                            ...variables.updateData,
                        };
                    }
                    return oldData;
                },
            );
        },
    });
};

// ------------------------------------------------------------------

export const useFetchTransactionsAnomaly = () => {
    return useQuery({
        queryKey: [PRISMA_KEYS.transactionsAnomaly],
        queryFn: fetchTransactionsAnomaly,
    });
};

// ------------------------------------------------------------------

export const useCreateTransactionAnomaly = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            date,
            anomalyMessage,
            type,
            score,
        }: {
            date: string;
            anomalyMessage: string;
            type: string;
            score: number;
        }) => {
            // Pass arguments as a single-element array to match the updated service
            return createTransactionAnomaly([{ date, anomalyMessage, type, score, read: false }]);
        },
        onSuccess: (data, variables) => {
            // Invalidate the specific transaction anomaly query
            queryClient.invalidateQueries({ queryKey: [PRISMA_KEYS.transactionsAnomaly] });

            // Also update the query cache directly for immediate UI updates
            queryClient.setQueryData([PRISMA_KEYS.transactionsAnomaly], (oldData: any) => {
                // If we have the specific transaction anomaly in cache, update it
                if (oldData) {
                    return {
                        ...oldData,
                        ...variables,
                    };
                }
                return oldData;
            });
        },
    });
};

// ------------------------------------------------------------------

export const useMarkAllTransactionAnomalyAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => {
            return markAllTransactionAnomalyAsRead();
        },
        onSuccess: () => {
            // Invalidate the specific transaction anomaly query
            queryClient.invalidateQueries({ queryKey: [PRISMA_KEYS.transactionsAnomaly] });
        },
    });
};

// ------------------------------------------------------------------

export const useDeleteTransactionsAnomaly = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cutoffDate: string) => {
            return deleteTransactionsAnomaly(cutoffDate);
        },
        onSuccess: () => {
            // Invalidate the specific transaction anomaly query
            queryClient.invalidateQueries({ queryKey: [PRISMA_KEYS.transactionsAnomaly] });
        },
    });
};

// ------------------------------------------------------------------

export const useGetAppSettings = () => {
    return useQuery(appSettingsQuery());
};

// ------------------------------------------------------------------

export const useUpdateAppSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updateData: any) => {
            return updateAppSettings(updateData);
        },
        onSuccess: (data, variables) => {
            // Invalidate the specific app settings query
            queryClient.invalidateQueries({ queryKey: [PRISMA_KEYS.appSettings] });

            // Also update the query cache directly for immediate UI updates
            queryClient.setQueryData([PRISMA_KEYS.appSettings], (oldData: any) => {
                // If we have the specific app settings in cache, update it
                if (oldData) {
                    return {
                        ...oldData,
                        ...variables,
                    };
                }
                return oldData;
            });
        },
    });
};

// ------------------------------------------------------------------

export const useFetchMessageAlerts = () => {
    return useQuery({
        queryKey: [PRISMA_KEYS.messageAlerts],
        queryFn: fetchMessageAlerts,
    });
};

// ------------------------------------------------------------------

export const useCreateMessageAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updateData: any) => {
            return createMessageAlert(updateData);
        },
        onSuccess: (data, variables) => {
            // Invalidate the specific app settings query
            queryClient.invalidateQueries({ queryKey: [PRISMA_KEYS.messageAlerts] });

            // Also update the query cache directly for immediate UI updates
            queryClient.setQueryData([PRISMA_KEYS.messageAlerts], (oldData: any) => {
                // If we have the specific app settings in cache, update it
                if (oldData) {
                    return {
                        ...oldData,
                        ...variables,
                    };
                }
                return oldData;
            });
        },
    });
};

// ------------------------------------------------------------------

export const useDeleteMessageAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updateData: any) => {
            return deleteMessageAlert(updateData);
        },
        onSuccess: (data, variables) => {
            // Invalidate the specific app settings query
            queryClient.invalidateQueries({ queryKey: [PRISMA_KEYS.messageAlerts] });

            // Also update the query cache directly for immediate UI updates
            queryClient.setQueryData([PRISMA_KEYS.messageAlerts], (oldData: any) => {
                // If we have the specific app settings in cache, update it
                if (oldData) {
                    return {
                        ...oldData,
                        ...variables,
                    };
                }
                return oldData;
            });
        },
    });
};

// ------------------------------------------------------------------

export const useUpdateMessageAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updateData: any) => {
            return updateMessageAlert(updateData);
        },
        onSuccess: (data, variables) => {
            // Invalidate the specific app settings query
            queryClient.invalidateQueries({ queryKey: [PRISMA_KEYS.messageAlerts] });

            // Also update the query cache directly for immediate UI updates
            queryClient.setQueryData([PRISMA_KEYS.messageAlerts], (oldData: any) => {
                // If we have the specific app settings in cache, update it
                if (Array.isArray(oldData)) {
                    return oldData.map((alert) =>
                        alert.id === variables.id ? { ...alert, ...variables } : alert,
                    );
                }
                return oldData || [];
            });
        },
    });
};
