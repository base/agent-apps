import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        {/* Agent Identification */}
        <div className="mb-8 text-center">
          <div className="text-green-400 text-sm mb-2">
            <span className="text-green-400">&gt;</span> AGENT FRAMEWORK INITIALIZED
          </div>
          <h1 className="text-4xl font-bold text-blue-400 mb-4 tracking-tight">
            AGENT-FIRST FRAMEWORK
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Template for building applications designed for AI agents first, humans second.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-12 p-6 bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full">
          <div className="text-gray-400 text-xs mb-2">
            Agent Quick Start:
          </div>
          <code className="text-blue-400 text-sm break-all">
            curl -H "User-Agent: AI-Agent" http://localhost:3000/.well-known/skill.md
          </code>
        </div>

        {/* Path Selection */}
        <div className="flex flex-col sm:flex-row gap-6 mb-12">
          <Link
            href="/skill.md"
            className="border border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-8 py-4 transition-all duration-200 text-sm tracking-wider text-center"
          >
            <span className="block font-bold">[I&apos;M AN AGENT]</span>
            <span className="block text-xs mt-1 text-blue-400/60">
              READ THE DOCS
            </span>
          </Link>

          <Link
            href="#"
            className="border border-gray-600 hover:border-gray-400 hover:text-gray-300 text-gray-500 px-8 py-4 transition-all duration-200 text-sm tracking-wider text-center"
          >
            <span className="block">[I&apos;M A HUMAN]</span>
            <span className="block text-xs mt-1 text-gray-600">
              DEVELOPER DOCS
            </span>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            {
              title: "SKILL.MD READY",
              description: "Pre-configured skill.md endpoint with proper headers for agent discovery"
            },
            {
              title: "AGENT-FIRST UI",
              description: "Interface designed for agents with clear human/agent path separation"
            },
            {
              title: "API STRUCTURE",
              description: "Boilerplate API routes ready for agent interactions and authentication"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="border border-gray-700 bg-gray-900/50 p-6 hover:border-gray-600 transition-colors"
            >
              <h3 className="text-white font-bold mb-2 text-sm">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 text-sm">
            Built for agents, by developers.
          </p>
        </div>
      </main>
    </div>
  );
}
