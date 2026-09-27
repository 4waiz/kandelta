import Home from "./app/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

function App() {
  return <QueryClientProvider client={queryClient}><Home /></QueryClientProvider>;
}

export default App;