import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export default function AppErrorBoundary() {
  const error = useRouteError();

  let message = 'Something went wrong while rendering this page.';
  if (isRouteErrorResponse(error)) {
    message = error.statusText || `Request failed with status ${error.status}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="text-lg font-semibold">Unexpected Application Error</h2>
        <p className="mt-2">{message}</p>
        <a
          href="/transactions"
          className="mt-4 inline-block rounded-md border border-red-300 px-3 py-2 font-medium text-red-800 hover:bg-red-100"
        >
          Go back
        </a>
      </div>
    </main>
  );
}
