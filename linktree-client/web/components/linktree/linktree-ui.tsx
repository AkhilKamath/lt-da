'use client';

import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconRefresh } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AppModal, ellipsify } from '../ui/ui-layout';
import { useCluster } from '../cluster/cluster-data-access';
import { ExplorerLink } from '../cluster/cluster-ui';
import {
  useCreateLinktreeAccount,
  useGetBalance,
  useGetLinktreeAccounts,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
} from './linktree-data-access';

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address });

  return (
    <div>
      <h1
        className="text-5xl font-bold cursor-pointer"
        onClick={() => query.refetch()}
      >
        {query.data ? <BalanceSol balance={query.data} /> : '...'} SOL
      </h1>
    </div>
  );
}
export function AccountChecker() {
  const { publicKey } = useWallet();
  if (!publicKey) {
    return null;
  }
  return <AccountBalanceCheck address={publicKey} />;
}
export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const { cluster } = useCluster();
  const mutation = useRequestAirdrop({ address });
  const query = useGetBalance({ address });

  if (query.isLoading) {
    return null;
  }
  if (query.isError || !query.data) {
    return (
      <div className="alert alert-warning text-warning-content/80 rounded-none flex justify-center">
        <span>
          You are connected to <strong>{cluster.name}</strong> but your account
          is not found on this cluster.
        </span>
        <button
          className="btn btn-xs btn-neutral"
          onClick={() =>
            mutation.mutateAsync(1).catch((err) => console.log(err))
          }
        >
          Request Airdrop
        </button>
      </div>
    );
  }
  return null;
}

export function LinktreeButtons({ address }: { address: PublicKey }) {
  const wallet = useWallet();
  const [showCreateModal, setShowCreateMondal] = useState(false);

  return (
    <div>
      <ModalCreate
        address={address}
        show={showCreateModal}
        hide={() => setShowCreateMondal(false)}
      />
      <div className="space-x-2">
        <button
          disabled={wallet.publicKey?.toString() !== address.toString()}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowCreateMondal(true)}
        >
          Create Linktree Account
        </button>
      </div>
    </div>
  );
}

export function LinktreeAccounts({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  // const query = useGetTokenAccounts({ address });
  const anchorWallet = useAnchorWallet()
  if (!address || !anchorWallet ) {
    return <div>Wallet not connected</div>;
  }
  const ltAccountInfoQuery = useGetLinktreeAccounts( { address, anchorWallet });
  const client = useQueryClient();
  // const items = useMemo(() => {
  //   if (showAll) return query.data;
  //   return query.data?.slice(0, 5);
  // }, [query.data, showAll]);

  const ltAccountInfoItems = useMemo(() => {
    if (showAll) return ltAccountInfoQuery.data
    return ltAccountInfoQuery.data?.slice(0, 5)
  }, [ltAccountInfoQuery.data, showAll])

  return (
    <div className="space-y-2">
      <div className="justify-between">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Linktree Accounts</h2>
          <div className="space-x-2">
            {ltAccountInfoQuery.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  await ltAccountInfoQuery.refetch();
                  await client.invalidateQueries({
                    queryKey: ['getTokenAccountBalance'],
                  });
                }}
              >
                <IconRefresh size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {ltAccountInfoQuery.isError && (
        <pre className="alert alert-error">
          Error: {ltAccountInfoQuery.error?.message.toString()}
        </pre>
      )}
      {ltAccountInfoQuery.isSuccess && (
        <div>
          {ltAccountInfoQuery.data.length === 0 ? (
            <div>No linktree accounts found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Public Key</th>
                  <th>username</th>
                  <th>onwer</th>
                </tr>
              </thead>
              <tbody>
                {ltAccountInfoItems?.map(({ username, pubkey, owner }) => (
                  <tr key={pubkey.toString()}>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(pubkey.toString())}
                            path={`account/${pubkey.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-mono">
                        {username}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(owner.toString())}
                            path={`account/${owner.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {(ltAccountInfoQuery.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}


function BalanceSol({ balance }: { balance: number }) {
  return (
    <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
  );
}

function ModalCreate({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  
  if (!address || !wallet.sendTransaction || !anchorWallet ) {
    return <div>Wallet not connected</div>;
  }
  
  const mutation = useCreateLinktreeAccount({ address, anchorWallet });
  const [username, setUsername] = useState('');

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Create"
      submitDisabled={!username || mutation.isPending}
      submitLabel="Create"
      submit={() => {
        mutation
          .mutateAsync({username})
          .then(() => hide());
      }}
    >
      <input
        disabled={mutation.isPending}
        type="text"
        placeholder="username"
        className="input input-bordered w-full"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
    </AppModal>
  );
}
