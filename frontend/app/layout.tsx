import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";

export const metadata: Metadata = {
  title: "MARP — Multi-Agent Market Research Platform",
  description: "Next-Generation Out-Of-Home & Retail Field Research Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <ClientShellWrapper>{children}</ClientShellWrapper>
      </body>
    </html>
  );
}

function ClientShellWrapper({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
