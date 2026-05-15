import type { ReactNode } from "react";

type NotFoundPageProps = {
  children?: ReactNode;
};

export function NotFoundPage({ children }: NotFoundPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl font-semibold tracking-tight text-foreground sm:text-7xl">404</p>
        <h1 className="mt-4 text-lg font-medium text-foreground sm:text-xl">
          This page could not be found.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested URL was not found on this server.
        </p>
        {children}
      </div>
    </div>
  );
}
