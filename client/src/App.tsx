import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Compare from "@/pages/compare";

// Navigation component
function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">Content Evaluator</div>
          <div className="flex space-x-4">
            <Link href="/" className={`px-3 py-2 rounded hover:bg-primary-700 transition-colors ${location === '/' ? 'bg-primary-800' : ''}`}>
              Evaluate
            </Link>
            <Link href="/compare" className={`px-3 py-2 rounded hover:bg-primary-700 transition-colors ${location === '/compare' ? 'bg-primary-800' : ''}`}>
              Compare
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/compare" component={Compare} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
