export default function CTA() {
  return (
    <section className="bg-gradient-to-br from-emerald-700 to-emerald-800 py-20 text-center text-white">
      <div className="container-custom">
        <h2 className="text-4xl font-bold mb-4">Ready to build?</h2>
        <p className="text-lg opacity-90 max-w-[500px] mx-auto mb-8">
          Join thousands of developers building the future with NextMavens. Get your free API key in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/Mkid095/nextmavens-js"
            className="px-6 py-3 text-sm font-semibold text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            View SDK on GitHub
          </a>
          <a
            href="https://portal.nextmavens.cloud"
            className="px-6 py-3 text-sm font-semibold text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Go to Dashboard
          </a>
          <button className="px-8 py-3 text-sm font-semibold text-emerald-700 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            Create Free Account
          </button>
        </div>
      </div>
    </section>
  )
}
