'use client';
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconPlus, IconRefresh, IconSettings2, IconTrash, IconTrashX } from '@tabler/icons-react';
import { useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AppModal, ellipsify } from '../ui/ui-layout';
import { useCluster } from '../cluster/cluster-data-access';
import { ExplorerLink } from '../cluster/cluster-ui';
import {
  useAddLinks,
  useCreateLinktreeAccount,
  useDeleteLinktreeAccount,
  useEditSettings,
  useGetBalance,
  useGetLinktreeAccountInfo,
  useGetLinktreeAccounts,
  useRequestAirdrop,
} from './linktree-data-access';
import { Link, LTAccountInfo } from './types';

import { styles } from './styles';
import { colors, hexToColorsKeyMap } from './colors';
import { UNCHANGED } from './constants';
import { ThemeContext } from './contexts';

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

export function LTButtons({ address, pdaAddress, accountInfo }: { address: PublicKey, pdaAddress: PublicKey, accountInfo: LTAccountInfo|undefined }) {
  const wallet = useWallet();
  const [showAddLinksModal, setShowAddLinksModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const { connection } = useConnection();
  const client = useQueryClient();

  function isButtonDisabled() {
    return wallet.publicKey?.toString() !== address.toString()
  }

  const buttonAnimations = {
    hover: {
      scale: 1.07,
    },
    tap: {
      scale: 0.955,
    }
  }

  return (
    <div>
      <ModalSettings
        hide={() => setShowSettingsModal(false)}
        show={showSettingsModal}
        address={address}
        pdaAddress={pdaAddress}
        username={accountInfo?.username || ''}
        accountInfo={accountInfo}
      />
      <ModalAddLinks
        hide={() => setShowAddLinksModal(false)}
        show={showAddLinksModal}
        address={address}
        pdaAddress={pdaAddress}
        username={accountInfo?.username || ''}
      />
      <ModalDeleteAccount
        hide={() => setShowDeleteAccountModal(false)}
        show={showDeleteAccountModal}
        address={address}
        pdaAddress={pdaAddress}
        username={accountInfo?.username || ''}
      />
      <div className="flex space-x-2">
        {!isButtonDisabled() && 
          <>
            <motion.button
              className={styles.ltPageButton}
              disabled={isButtonDisabled()}
              onClick={() => setShowSettingsModal(true)}
              whileHover={buttonAnimations.hover}
              whileTap={buttonAnimations.tap}
            >
              <IconSettings2 size={20} />
            </motion.button>
            <motion.button
              className={styles.ltPageButton}
              disabled={isButtonDisabled()}
              onClick={() => setShowAddLinksModal(true)}
              whileHover={buttonAnimations.hover}
              whileTap={buttonAnimations.tap}
            >
              <IconPlus size={20} />
            </motion.button>
            <motion.button
              className={styles.ltPageButton}
              disabled={isButtonDisabled()}
              onClick={() => setShowDeleteAccountModal(true)}
              whileHover={buttonAnimations.hover}
              whileTap={buttonAnimations.tap}
            >
              <IconTrash size={20} />
            </motion.button>
          </>
        }
        <motion.button
          disabled={isButtonDisabled()}
          className={styles.ltPageButton}
          onClick={async () => {
            await client.invalidateQueries({
              queryKey: [
                'get-linktree-account-info',
                { endpoint: connection.rpcEndpoint, pdaAddress },
              ],
            });
          }}
          whileHover={{
            scale: 1.025,
          }}
          whileTap={{
            scale: 0.955,
          }}
        >
          <IconRefresh size={20} />
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
  // const [showAll, setShowAll] = useState(false);
  const anchorWallet = useAnchorWallet()
  if (!address || !anchorWallet) {
    return <div>Wallet not connected 1</div>;
  }
  const query = useGetLinktreeAccounts({ address, anchorWallet });
  const client = useQueryClient();

  return (
    <div className="space-y-2">
      <div className="justify-between">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Linktree Accounts</h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  await query.refetch();
                  await client.invalidateQueries({
                    queryKey: ['get-balance'], // TODO
                  });
                }}
              >
                <IconRefresh size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {query.isError && (
        <pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
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
                {query.data.map(({ username, pubkey }) => (
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

                {/* {(query.data?.length ?? 0) > 5 && (
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
                )} */}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export function LTPage({ pdaAddress }: { pdaAddress: PublicKey }) {
  const anchorWallet = useAnchorWallet()

  if (!pdaAddress || !anchorWallet) {
    return <div>Wallet not connected ltp</div>;
  }

  const query = useGetLinktreeAccountInfo({ pdaAddress, anchorWallet })
  const client = useQueryClient();

  const accountInfo = useMemo(() => {
    return query.data
  }, [query.data])

  const { setCurrentTheme } = useContext(ThemeContext)

  useEffect(() => {
    if(accountInfo)
      setCurrentTheme(hexToColorsKeyMap[accountInfo?.colorHex] || 'yellow')
  }, [accountInfo])

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
            <LTButtons address={accountInfo?.owner || new PublicKey('')} pdaAddress={pdaAddress} accountInfo={accountInfo} />
            <LTLinksList isLoading={query.isLoading} accountInfo={accountInfo} />
          </div>
        )
      }
    </div>
  )
}

export function LTPageHero({ isLoading, accountInfo }: { isLoading: boolean, accountInfo: LTAccountInfo | undefined }) {
  return (
    isLoading ? <div className='flex flex-col items-center'>
      <Skeleton className='h-28 w-28 rounded-full' />
      <Skeleton className='h-4 w-[100px] mt-2' />
    </div> :
      <div className='flex flex-col items-center'>
        <Avatar>
          <AvatarImage src={accountInfo?.avatarUri || "https://github.com/shadcn.png"} />
          <AvatarFallback>{accountInfo?.username}</AvatarFallback>
        </Avatar>
        <span className='font-semibold mt-2'>@{accountInfo?.username}</span>
      </div>
  )
}

export function LTLink({ title, url }: { title: string, url: string }) {
  return (
    <div className='flex gap-x-5 w-full'>
      <motion.a href={url} target="_blank" className='flex-grow block py-5 rounded-full border border-linktree text-center font-bold'
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
      {/* <motion.button
        whileHover={{
          scale: 1.2
        }}
        whileTap={{
          scale: 0.9
        }}
      >
        <IconTrashX size={20}/>
      </motion.button> */}
    </div>
  )
}

export function LTLinksList({ isLoading, accountInfo }: { isLoading: boolean, accountInfo: LTAccountInfo|undefined }) {
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
        <ul className='space-y-5'>
          {
            accountInfo?.links.map((link, idx) => {
              return (
                <li key={idx}>
                  <LTLink title={link.title} url={link.url} />
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

function ModalSettings({
  hide,
  show,
  address,
  pdaAddress,
  username,
  accountInfo,
}: {
  hide: () => void,
  show: boolean,
  address: PublicKey,
  pdaAddress: PublicKey,
  username: string,
  accountInfo: LTAccountInfo|undefined,
}) {
  const anchorWallet = useAnchorWallet();

  const currentColorHex = accountInfo?.colorHex;
  const currentAvatarUri = accountInfo?.avatarUri;

  const [colorHex, setColorHex] = useState(currentColorHex || '')
  const [avatarUri, setAvatarUri] = useState(currentAvatarUri || '')

  if (!address || !anchorWallet || !username.length) {
    return <div>Wallet not connected</div>;
  }

  function shouldSubmitBeDisabled() {
    return mutation.isPending || (colorHex.trim() === '' && avatarUri.trim() === '') || (colorHex === currentColorHex && avatarUri === currentAvatarUri)
  }

  const mutation = useEditSettings({ address, anchorWallet, pdaAddress, username })

  function ColorSquare({color}: {color: {'--lt-background': string}}) {
    return (
      <motion.div className={`input input-bordered w-10 h-10 cursor-pointer ${colorHex === color['--lt-background'] ? 'border-white border-2' : ''}`}
        style={{
          backgroundColor: color['--lt-background']
        }}
        whileTap={{
          scale: 0.95
        }}
        whileHover={{
          scale: 1.05
        }}
        onClick={() => setColorHex(color['--lt-background'])}
      />
    )
  }
  return (
    <div className='text-white'>
      <AppModal
        hide={hide}
        show={show}
        title='Settings'
        submitDisabled={shouldSubmitBeDisabled()}
        submit={() => {
          mutation
            .mutateAsync({
              avatarUri: avatarUri === currentAvatarUri ? UNCHANGED : avatarUri, 
              colorHex: colorHex === currentColorHex ? UNCHANGED : colorHex, 
            })
            .then(() => hide())
        }}

      >
        <div className='space-y-5'>
          <label htmlFor='avatarUri'>Avatar URI</label>
          <input
            name='avatarUri'
            disabled={mutation.isPending}
            type="url"
            placeholder="title"
            className="input input-bordered w-full"
            value={avatarUri}
            onChange={(e) => setAvatarUri(e.target.value)}
          />
          <div>Background Color</div>
          <input
            hidden={true}
            name='colorHex'
            type="color"
            value={colorHex}
          />
          <div className='grid grid-cols-3 w-1/4 gap-y-2 place-items-center'>
            <ColorSquare color={colors.red}/>
            <ColorSquare color={colors.yellow}/>
            <ColorSquare color={colors.green}/>
            <ColorSquare color={colors.blue}/>
            <ColorSquare color={colors.violet}/>
            <ColorSquare color={colors.pink}/>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

function ModalAddLinks({
  hide,
  show,
  address,
  pdaAddress,
  username,
}: {
  hide: () => void,
  show: boolean,
  address: PublicKey,
  pdaAddress: PublicKey,
  username: string,
}) {
  const anchorWallet = useAnchorWallet();

  const [urls, setUrls] = useState([''])
  const [titles, setTitles] = useState([''])
  const [numLinks, setNumLinks] = useState(1)

  if (!address || !anchorWallet || !username.length) {
    return <div>Wallet not connected</div>;
  }

  function addFieldRow() {
    setNumLinks(numLinks + 1)
    setUrls([...urls, ''])
    setTitles([...titles, ''])
  }

  function removeFieldRow(idx: number) {
    setNumLinks(numLinks - 1)
    setUrls(urls.filter((_, i) => i !== idx))
    setTitles(titles.filter((_, i) => i !== idx))
  }

  function shouldSubmitBeDisabled() {
    if (mutation.isPending)
      return true
    if (urls.some(val => val.trim() === ''))
      return true
    if (titles.some(val => val.trim() === ''))
      return true
    return false
  }

  const mutation = useAddLinks({ address, anchorWallet, pdaAddress, username })

  const inputFields = Array.from({ length: numLinks }, (_, idx) => {
    return (
      <div key={idx} className='flex space-x-5'>
        <input
          disabled={mutation.isPending}
          type="text"
          placeholder="title"
          className="input input-bordered"
          value={titles[idx]}
          onChange={(e) => setTitles(prev => prev.map((title, i) => i === idx ? e.target.value : title))}
        />
        <input
          disabled={mutation.isPending}
          type="text"
          placeholder="url"
          className="input input-bordered"
          value={urls[idx]}
          onChange={(e) => setUrls(prev => prev.map((url, i) => i === idx ? e.target.value : url))}
        />
        <div className="space-x-2">
          <button className='btn btn-square' disabled={numLinks === 1 && idx === 0} onClick={() => removeFieldRow(idx)}>-</button>
          {
            idx === numLinks - 1 &&
            <button className='btn btn-square' onClick={addFieldRow}>+</button>
          }
        </div>
      </div>
    )
  })

  return (
    <div className='text-white'>
      <AppModal
        hide={hide}
        show={show}
        title='Add Links'
        submitDisabled={shouldSubmitBeDisabled()}
        submit={() => {
          const links: Link[] = []
          urls.forEach((url, idx) => {
            links.push({
              url: url.trim(),
              title: titles[idx].trim()
            })
          })
          mutation
            .mutateAsync({ links })
            .then(() => hide())
        }}

      >
        {inputFields}
      </AppModal>
    </div>
  )
}

function ModalDeleteAccount({
  hide,
  show,
  address,
  pdaAddress,
  username
}: {
  hide: () => void,
  show: boolean,
  address: PublicKey,
  pdaAddress: PublicKey,
  username: string,
}) {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  if (!address || !wallet.sendTransaction || !anchorWallet) {
    return <div>Wallet not connected</div>;
  }

  const mutation = useDeleteLinktreeAccount({ address, anchorWallet });

  return (
    <div className='text-white'>
      <AppModal
        hide={hide}
        show={show}
        title="Delete"
        submitDisabled={!username || mutation.isPending}
        submitLabel="Yes, Delete"
        submit={() => {
          mutation
            .mutateAsync({ username })
            .then(() => hide());
        }}
      >
        <span>We are sorry to see you go, are you sure you want to go ahead?</span>
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

  if (!address || !wallet.sendTransaction || !anchorWallet) {
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
          .mutateAsync({ username })
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
