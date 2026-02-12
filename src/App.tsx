import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChatBox from "@/components/ChatBox";
import { VoiceController } from "@/components/VoiceController";
import SplashScreen from "./pages/SplashScreen";
import LanguageSelection from "./pages/LanguageSelection";
import Dashboard from "./pages/Dashboard";
import ExploreMode from "./pages/ExploreMode";
import Tutorial from "./pages/Tutorial";
import ExpenseTracker from "./pages/ExpenseTracker";
import AmbulanceSelection from "./pages/AmbulanceSelection";
import AmbulanceUser from "./pages/AmbulanceUser";
import AmbulanceAdmin from "./pages/AmbulanceAdmin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SplashScreen />} />
              <Route path="/language" element={<LanguageSelection />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/explore/:modeId" element={<ExploreMode />} />
              <Route path="/tutorial/:modeId" element={<Tutorial />} />
              <Route path="/expenses" element={<ExpenseTracker />} />
              <Route path="/ambulance" element={<AmbulanceSelection />} />
              <Route path="/ambulance/user" element={<AmbulanceUser />} />
              <Route path="/ambulance/admin" element={<AmbulanceAdmin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatBox />
            <VoiceController />
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
