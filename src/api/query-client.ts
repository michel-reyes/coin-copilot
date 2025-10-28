import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Keep cache forever
            gcTime: Infinity,

            // Data becomes stale after 2 minutes, this is a flag to refetch the data when the refetch times out
            staleTime: 1000 * 60 * 60 * 2, // 2 hours

            // Force refetch every x time when data is stale
            refetchInterval: 1000 * 60 * 60 * 4, // 4 hours

            // Always return cached data first and refresh in background
            refetchOnMount: false,
            refetchOnWindowFocus: false,
        },
    },
});

export default queryClient;
