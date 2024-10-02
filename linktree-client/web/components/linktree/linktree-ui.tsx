'use client';
import {motion} from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconRefresh } from '@tabler/icons-react';
import { useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { AppModal, ellipsify } from '../ui/ui-layout';
import { useCluster } from '../cluster/cluster-data-access';
import { ExplorerLink } from '../cluster/cluster-ui';
import {
  useAddLinks,
  useCreateLinktreeAccount,
  useGetBalance,
  useGetLinktreeAccountInfo,
  useGetLinktreeAccounts,
  useRequestAirdrop,
} from './linktree-data-access';
import { Link } from './types';

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

export function LTAddLinks({address, owner, username}: {address: PublicKey, owner: PublicKey, username: string}) {
  const wallet = useWallet();
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <ModalAddLinks
        hide={() => setShowModal(false)}
        show={showModal}
        address={address}
        username={username}
      />
      <div className="space-x-2">
        <motion.button
          disabled={wallet.publicKey?.toString() !== owner.toString()}
          className="px-5 py-2 rounded-lg border border-linktree-fg"
          onClick={() => setShowModal(true)}
          whileHover={"hover"}
          variants={{
            hover: {
              scale: 1.05,
              boxShadow: "0 0 15px var(--lt-foreground)",
              filter: "brightness(1.2)",
              transition: {
                duration: 0.3
              }
            }
          }}
        >
          Add Link
        </motion.button>
      </div>
    </div>
  )
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
  const anchorWallet = useAnchorWallet()
  if (!address || !anchorWallet ) {
    return <div>Wallet not connected 1</div>;
  }
  const ltAccountInfoQuery = useGetLinktreeAccounts( { address, anchorWallet });
  const client = useQueryClient();

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
                </tr>
              </thead>
              <tbody>
                {ltAccountInfoItems?.map(({ username, pubkey }) => (
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
                        <a href={`/lt/${pubkey.toString()}`} className='underline'>@{username}</a>
                      </span>
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
interface LTAccountInfo {
  owner: PublicKey;
  username: string;
  links: any[];
}

export function LTPage({ address }: { address: PublicKey }) {
  const anchorWallet = useAnchorWallet()
  
  if (!address || !anchorWallet ) {
    return <div>Wallet not connected ltp</div>;
  }
  
  const query = useGetLinktreeAccountInfo({ address, anchorWallet })
  const client = useQueryClient();

  const accountInfo = useMemo(() => {
    return query.data
  },[query.data])

  return (
    <div className={`min-h-screen overflow-auto bg-linktree-bg text-linktree-fg`}>
        {
          query.isError && (<pre className="alert alert-error">
            Error: {query.error?.message.toString()}
          </pre>)
        }
        {
          query.isSuccess && (
            <div className="container mx-auto px-4 py-8 flex flex-col items-center">
              <div className="mx-auto px-4 py-8">
                <LTPageHero isLoading={query.isLoading} accountInfo={accountInfo} />
              </div>
                <LTAddLinks address={address} owner={accountInfo?.owner || new PublicKey('')} username={accountInfo?.username || ''}/>
                <LTLinksList isLoading={query.isLoading} accountInfo={accountInfo} />
            </div>
          )
        }
    </div>
  )
}

export function LTPageHero({isLoading, accountInfo}: {isLoading: boolean, accountInfo: LTAccountInfo|undefined}) {
  return (
    isLoading ? <div className='flex flex-col items-center'>
      <Skeleton className='h-28 w-28 rounded-full'/>
      <Skeleton className='h-4 w-[100px] mt-2' />
    </div> :
    <div className='flex flex-col items-center'>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png"/>
        <AvatarFallback>{accountInfo?.username}</AvatarFallback>
      </Avatar>
      <span className='font-semibold mt-2'>@{accountInfo?.username}</span>
    </div>
  )
}

export function LTLink({title, url}: {title: string, url: string}) {
  return (
    <motion.a href={url} target="_blank" className='block py-5 rounded-full border border-linktree text-center font-bold'
    variants={{
      hover: {
        scale: 1.05,
        backgroundColor: 'var(--lt-foreground)',
        color: 'var(--lt-background)'
      }
    }}
    whileHover={"hover"}
    >
      {title}
    </motion.a>
  )
}

export function LTLinksList({isLoading, accountInfo}: {isLoading: boolean, accountInfo: LTAccountInfo|undefined}) {
  return (
    isLoading ? 
    <div className='mt-8 w-full sm:w-1/2'>
      <ul>
        <li>
          <Skeleton className='h-[75px] py-5 rounded-full' />
        </li>
      </ul>
    </div> :
    <div className='mt-8 w-full sm:w-1/2'>
      <ul>
        {
          accountInfo?.links.map((link, idx) => {
            return (
              <li key={idx}>
                <LTLink title={link.title} url={link.url}/>
              </li>
            )
          })
        }
      </ul>
    </div>
  )
}

function BalanceSol({ balance }: { balance: number }) {
  return (
    <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
  );
}

function ModalAddLinks({
  hide,
  show,
  address,
  username
}: {
  hide: () => void,
  show: boolean,
  address: PublicKey,
  username: string,
}) {
  const anchorWallet = useAnchorWallet();

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  if (!address || !anchorWallet || !username.length ) {
    return <div>Wallet not connected</div>;
  }

  const mutation = useAddLinks({address, anchorWallet, username})

  return (
    <div className='text-white'>
      <AppModal
        hide={hide}
        show={show}
        title='Add Links'
        submitDisabled={!title || !url || mutation.isPending}
        submit={() => {
          const links: Link[] = []
          links.push({title, url})
          mutation
          .mutateAsync({links})
          .then(() => hide())
        }}

      >
        <input
          disabled={mutation.isPending}
          type="text"
          placeholder="title"
          className="input input-bordered w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          disabled={mutation.isPending}
          type="text"
          placeholder="url"
          className="input input-bordered w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </AppModal>
    </div>
  )
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
