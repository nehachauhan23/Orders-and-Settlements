import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AuthProvider } from "@/lib/hooks/useAuth";

export const metadata: Metadata = {
  title: "Order Tracker — Order & Payment Tracker",
  description: "Track orders, record payments, and see what's outstanding at a glance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
