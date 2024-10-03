// import './global.css';

import { Suspense } from "react";

export default function SpecialPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full flex flex-col">
      <header>
        {/* <h1>Special Page Header</h1> */}
      </header>
      <main className="flex-grow overflow-auto">
      <Suspense
          fallback={
            <div className="text-center my-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>

      </main>
      <footer>
        {/* <p>Special Page Footer</p> */}
      </footer>
    </div>
  );
}