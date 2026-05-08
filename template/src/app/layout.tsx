// Root layout — replace metadata and global styles for your project.
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "saascon",
  description: "Next.js + Supabase demo template.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
