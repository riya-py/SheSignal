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
                {/* Public — anonymous browsing is core to the product */}
                <Route path="/" element={<Home />} />
                <Route path="/route-safety" element={<RouteSafety />} />
                <Route path="/zone-details" element={<ZoneDetails />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Requires a session — the report itself still stays anonymous */}
                <Route
                  path="/report"
                  element={
                    <ProtectedRoute>
                      <Report />
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <Toaster richColors position="top-center" />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}