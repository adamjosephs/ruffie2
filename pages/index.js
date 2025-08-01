export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          RUFfie2 - Next.js Version
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Risk Up Front Friendly Intelligence Engine
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-sm text-gray-500">
            ✅ Next.js app is running!<br/>
            ✅ API route should be available at /api/claude
          </p>
        </div>
      </div>
    </div>
  )
}
