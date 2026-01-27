const features = [
  { name: 'Open Source', nextmavens: 'Yes (GitHub)', supabase: 'Yes', firebase: 'No' },
  { name: 'Self-Hostable', nextmavens: 'Yes', supabase: 'No (Cloud only)', firebase: 'No' },
  { name: 'MCP Support', nextmavens: 'Native', supabase: 'No', firebase: 'No' },
  { name: 'Multi-tenant Database', nextmavens: 'Built-in RLS', supabase: 'Yes', firebase: 'No' },
  { name: 'Telegram Storage', nextmavens: 'Native', supabase: 'No', firebase: 'Storage only' },
  { name: 'Realtime', nextmavens: 'WebSockets + NOTIFY', supabase: 'WebSockets + Channels', firebase: 'Firestore' },
  { name: 'Developer Portal', nextmavens: 'Professional UI', supabase: 'Dashboard', firebase: 'Console' },
  { name: 'Language Support', nextmavens: 'JS + TypeScript', supabase: 'JS', firebase: 'JS + SDKs' },
  { name: 'Deployment', nextmavens: 'Docker + Dokploy', supabase: 'Hosted only', firebase: 'Firebase only' },
  { name: 'Pricing', nextmavens: 'Open Source', supabase: 'Free tier + Paid', firebase: 'Free tier + Pay-as-you-go' },
]

export default function Comparison() {
  return (
    <section id="comparison" className="py-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Why NextMavens?</h2>
          <p className="text-lg text-slate-600 max-w-[600px] mx-auto">
            See how we compare to other backend platforms.
          </p>
        </div>

        <div className="overflow-x-auto mb-12">
          <table className="w-full bg-white rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                  Feature
                </th>
                <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                  NextMavens
                </th>
                <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                  Supabase
                </th>
                <th className="text-left py-4 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                  Firebase
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-slate-200 last:border-b-0">
                  <td className="py-4 px-5 text-sm text-slate-700 font-semibold">{feature.name}</td>
                  <td className="py-4 px-5 text-sm text-slate-700">{feature.nextmavens}</td>
                  <td className="py-4 px-5 text-sm text-slate-700">{feature.supabase}</td>
                  <td className="py-4 px-5 text-sm text-slate-700">{feature.firebase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <button className="btn-primary px-10 py-4 text-base">Get Started for Free</button>
        </div>
      </div>
    </section>
  )
}
