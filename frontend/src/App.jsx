import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Home from "@/pages/Home";
import Report from "@/pages/Report";
import RouteSafety from "@/pages/RouteSafety";
import ZoneDetails from "@/pages/ZoneDetails";
import Recommendations from "@/pages/Recommendations";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="h-[100dvh] w-full overflow-hidden bg-background">
              <Navbar />
              <Routes>
                {/* Auth screens — not gated, but redirect away if already signed in */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Everything else requires a session — reports themselves still stay anonymous */}
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/route-safety" element={<ProtectedRoute><RouteSafety /></ProtectedRoute>} />
                <Route path="/zone-details" element={<ProtectedRoute><ZoneDetails /></ProtectedRoute>} />
                <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
              </Routes>
              <Toaster richColors position="top-center" />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}