import Link from 'next/link';
import { siteConfig } from '@/config/site';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[150px] animate-pulse pointer-events-none delay-1000" />

      <div className="z-10 w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <Link
          href="/"
          className="mb-8 text-4xl font-extrabold tracking-tight text-white drop-shadow-lg"
        >
          {siteConfig.name}
        </Link>
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
