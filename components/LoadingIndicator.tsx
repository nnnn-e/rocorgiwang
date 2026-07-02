export default function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center h-screen w-full fixed top-0 left-0 bg-white z-50">
      <div className="text-center">
        <div
          className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-solid border-white border-r-transparent align-[-0.125em]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
        <p className="mt-4 text-white/70">Hello, Friend. Please wait...</p>
        <p className="text-xs text-white/50 mt-2">First load may take a moment</p>
      </div>
    </div>
  )
}
