'use client';
import { usePrivy } from '@privy-io/react-auth';

export default function FundraisesClient({ fundraises }: { fundraises: any[] }) {
  const { login, authenticated, user, ready } = usePrivy();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading wallet...
      </div>
    );
  }

  // Placeholder: render fundraises list
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Fundraises</h1>
      <ul>
        {fundraises.map((f) => (
          <li key={f.id} className="mb-2">
            <div className="font-semibold">{f.title}</div>
            <div className="text-sm text-gray-600">By: {f.user.privyUserId}</div>
            <div className="text-sm">Progress: {f.progress.toFixed(1)}%</div>
          </li>
        ))}
      </ul>
    </div>
  );
} 