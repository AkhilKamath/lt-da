'use client';

import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

import { useParams } from 'next/navigation';

import { ExplorerLink } from '../cluster/cluster-ui';
import { AppHero, ellipsify } from '../ui/ui-layout';
import {
  AccountBalance,
  AccountButtons,
  AccountTokens,
  AccountTransactions,
} from './linktree-ui';

export default function LinktreeDetailFeature() {
  const params = useParams();
  const address = useMemo(() => {
    console.log('params', params)
    if (!params.address) {
      return;
    }
    try {
      return new PublicKey(params.address);
    } catch (e) {
      console.log(`Invalid public key`, e);
    }
  }, [params]);
  if (!address) {
    return <div>Error loading account</div>;
  }

  return (
    <div>
      
    </div>
  );
}
