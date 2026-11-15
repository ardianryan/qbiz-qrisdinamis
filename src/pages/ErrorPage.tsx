interface ErrorPageProps {
  statusCode: number;
  title?: string;
  message?: string;
  requestPath?: string;
}

const ERROR_DEFAULTS: Record<number, { title: string; subtitle: string; message: string; badgeClass: string }> = {
  400: {
    title: 'Bad Request',
    subtitle: 'The server could not understand your request.',
    message: 'Please check the submitted parameters or URL and try again.',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  401: {
    title: 'Unauthorized',
    subtitle: 'Authentication is required to access this resource.',
    message: 'Your session may have expired. Please sign in again to continue.',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  403: {
    title: 'Access Forbidden',
    subtitle: 'You do not have permission to view this page.',
    message: 'Your current account role does not have access to this resource. Contact your administrator if you believe this is an error.',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  404: {
    title: 'Page Not Found',
    subtitle: 'The requested page or resource could not be found.',
    message: 'The URL may have been moved, deleted, or typed incorrectly.',
    badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  },
  500: {
    title: 'Internal Server Error',
    subtitle: 'Something went wrong on our side.',
    message: 'An unexpected error occurred while processing your request. Please try again in a moment.',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  502: {
    title: 'Bad Gateway',
    subtitle: 'Upstream service returned an invalid response.',
    message: 'A downstream service is temporarily unreachable. Please retry shortly.',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  503: {
    title: 'Service Unavailable',
    subtitle: 'System is temporarily unavailable or under maintenance.',
    message: 'We are performing scheduled maintenance to improve reliability. Please check back shortly.',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
};

export const ErrorPage = ({ statusCode, title, message, requestPath }: ErrorPageProps) => {
  const preset = ERROR_DEFAULTS[statusCode] || {
    title: title || 'Unexpected Error',
    subtitle: 'An error occurred while processing your request.',
    message: message || 'Please return to the dashboard or try again later.',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-zinc-400 border-slate-500/20',
  };

  const displayTitle = title || preset.title;
  const displayMessage = message || preset.message;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-5">
          <img
            src="/static/brand/qbiz-mark.svg"
            alt="QBiz Gateway"
            className="w-12 h-12 rounded-xl shadow-sm"
          />
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold mb-4 ${preset.badgeClass}`}>
          <span>{`HTTP ${statusCode}`}</span>
          <span>•</span>
          <span>{displayTitle}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 font-mono">
          {statusCode}
        </h1>
        <p className="mt-2 text-base font-semibold text-slate-800 dark:text-zinc-200">
          {preset.subtitle}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          {displayMessage}
        </p>

        {requestPath && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-500 dark:text-zinc-400 truncate">
            {requestPath}
          </div>
        )}

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all active:scale-95"
          >
            Back to Dashboard
          </a>
          <button
            type="button"
            id="btn-error-go-back"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
          >
            Go Back
          </button>
          <script
            dangerouslySetInnerHTML={{
              __html:
                "document.getElementById('btn-error-go-back')?.addEventListener('click',function(){if(window.history.length>1){window.history.back();}else{window.location.href='/login';}});",
            }}
          />
          {(statusCode === 401 || statusCode === 403) && (
            <a
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Sign In
            </a>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 dark:text-zinc-500">
        QBiz Gateway Hub
      </p>
    </div>
  );
};
