'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';

import { redirect } from 'next/navigation';

export default function LinktreeListFeature() {
  const { publicKey } = useWallet();

  if (publicKey) {
    return redirect(`/linktree/${publicKey.toString()}`);
  }

  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <WalletButton />
      </div>
    </div>
  );
}
