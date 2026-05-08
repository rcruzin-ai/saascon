// Root layout — replace metadata and global styles for your project.
import type { ReactNode } from "react";

export const metadata = {
  title: "{{ project-name }}",
  description: "{{ one-line description }}",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
