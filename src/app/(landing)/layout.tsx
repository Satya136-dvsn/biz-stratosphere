export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <header className="bg-deep-blue p-4 text-white">
        {/* Landing page header */}
        <p>Biz Stratosphere</p>
      </header>
      <main>{children}</main>
    </div>
  )
}
