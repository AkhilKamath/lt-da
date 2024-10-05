'use client';

import { AnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Linktree } from '@/idl/linktree';
import idl from '@/idl/linktree.json';
import { Link, LinktreeAccount } from './types';
import { UNCHANGED } from './constants';

const LINK_TREE_ACCOUNT_NAME = 'linkTreeAccount'

export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getBalance(address),
  });
}

export function useGetSignatures({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getConfirmedSignaturesForAddress2(address),
  });
}

export function useGetLinktreeAccounts({ address, anchorWallet }: { address: PublicKey, anchorWallet: AnchorWallet|undefined }) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: [
      'get-pda-accounts',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if(!anchorWallet) return []
      const pdas = await connection.getProgramAccounts(new PublicKey(idl.address));
      const anchorProvider = new AnchorProvider(connection, anchorWallet)
      const program = new Program<Linktree>(idl as Linktree, anchorProvider);
      const pdaAccounts = await Promise.all(
        pdas.map(async pda => {
          try {
            const accountData = program.coder.accounts.decode(
              LINK_TREE_ACCOUNT_NAME,
              pda.account.data
            );
            if(accountData?.owner.toString() !== address.toString()) return
            const account = await program.account.linkTreeAccount.fetch(pda.pubkey)
            return {username: account.username, pubkey: pda.pubkey, owner: account.owner}
          } catch (error) {
            console.error('error in fetching account info', error)
            return null
          }
        })
      )
      return pdaAccounts.filter((acc): acc is LinktreeAccount => !!acc);
    },
    enabled: !!anchorWallet
  })
}

export function useGetLinktreeAccountInfo({ pdaAddress, anchorWallet }: { pdaAddress: PublicKey, anchorWallet: AnchorWallet|undefined }) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: [
      'get-linktree-account-info',
      { endpoint: connection.rpcEndpoint, pdaAddress },
    ],
    queryFn: async () => {
      if (!anchorWallet) {
        throw new Error('Wallet not connected');
      }

      const anchorProvider = new AnchorProvider(connection, anchorWallet)
      const program = new Program<Linktree>(idl as Linktree, anchorProvider);
      let accountInfo
      try {
        accountInfo = await program.account.linkTreeAccount.fetch(pdaAddress)
      } catch (error) {
        console.error('error in fetching account info', error)
      }
      return accountInfo
    },
    enabled: !!anchorWallet
  }) 
}

export function useEditSettings({ address, anchorWallet, pdaAddress, username }: { address: PublicKey, anchorWallet: AnchorWallet|undefined, pdaAddress: PublicKey, username: string }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'edit-settings',
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async (input: { avatarUri: string, colorHex: string }) => {
      if(!anchorWallet) return;

      const anchorProvider = new AnchorProvider(connection, anchorWallet);
      const program = new Program<Linktree>(idl as Linktree, anchorProvider);

      let signature: TransactionSignature = '';
      try {
        const { transaction, latestBlockhash } = await editSettingsTransaction({
          publicKey: address,
          username,
          avatarUri: input.avatarUri,
          colorHex: input.colorHex,
          connection,
          program
        })
        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection);

        // Send transaction and await for signature
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          'confirmed'
        );

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.log('error', 'Transaction failed!!', error);
        return;
      }
    },
    onSuccess: (signature) => {
      if(signature) {
        transactionToast(signature)
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-linktree-account-info',
            { endpoint: connection.rpcEndpoint, pdaAddress },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    }
  })
}

export function useAddLinks({ address, anchorWallet, pdaAddress, username }: { address: PublicKey, anchorWallet: AnchorWallet|undefined, pdaAddress: PublicKey, username: string }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'add-links',
      { endpoint: connection.rpcEndpoint, address }
    ],
    mutationFn: async (input: { links: Link[] }) => {
      if(!anchorWallet) return;

      const anchorProvider = new AnchorProvider(connection, anchorWallet)
      const program = new Program<Linktree>(idl as Linktree, anchorProvider);

      let signature: TransactionSignature = '';
      try {
        const { transaction, latestBlockhash } = await addLinksTransaction({
          publicKey: address,
          username,
          links: input.links,
          connection,
          program
        });

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection);

        // Send transaction and await for signature
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          'confirmed'
        );

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.log('error', 'Transaction failed!', error);
        return;
      }
    },
    onSuccess: (signature) => {
      if(signature) {
        transactionToast(signature)
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-linktree-account-info',
            { endpoint: connection.rpcEndpoint, pdaAddress },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    }
  })
}

export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      'get-token-accounts',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ]);
      return [...tokenAccounts.value, ...token2022Accounts.value];
    },
  });
}

export function useCreateLinktreeAccount({ address, anchorWallet }: { address: PublicKey, anchorWallet: AnchorWallet|undefined }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'create-linktree-account',
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async (input: { username: string }) => {
      if(!anchorWallet) return;

      const anchorProvider = new AnchorProvider(connection, anchorWallet)
      const program = new Program<Linktree>(idl as Linktree, anchorProvider);

      let signature: TransactionSignature = '';
      try {
        const { transaction, latestBlockhash } = await createLinktreeAccountTransaction({
          publicKey: address,
          username: input.username,
          connection,
          program
        });

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection);

        // Send transaction and await for signature
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          'confirmed'
        );

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.log('error', `Transaction failed!`, error);
        return;
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}

export function useDeleteLinktreeAccount({ address, anchorWallet }: { address: PublicKey, anchorWallet: AnchorWallet|undefined }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'delete-linktree-account',
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async (input: { username: string }) => {
      if(!anchorWallet) return;

      const anchorProvider = new AnchorProvider(connection, anchorWallet)
      const program = new Program<Linktree>(idl as Linktree, anchorProvider);

      let signature: TransactionSignature = '';
      try {
        const { transaction, latestBlockhash } = await deleteLinktreeAccountTransaction({
          publicKey: address,
          username: input.username,
          connection,
          program
        });

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection);

        // Send transaction and await for signature
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          'confirmed'
        );

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.error('Transaction failed:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        return
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}

export function useRequestAirdrop({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['airdrop', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ]);

      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        'confirmed'
      );
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
  });
}

async function createLinktreeAccountTransaction({
  publicKey,
  username,
  connection,
  program
}: {
  publicKey: PublicKey;
  username: string,
  connection: Connection,
  program: Program<Linktree>
}): Promise<{
  transaction: VersionedTransaction;
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
}> {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash();

  // Create instructions to send, in this case a simple transfer
  const instructions: TransactionInstruction[] = [];

  const ix = await program.methods.createLinktreeAccount(username)
  .accounts({owner: publicKey})
  .instruction()

  instructions.push(ix)

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage();

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy);

  return {
    transaction,
    latestBlockhash,
  };
}

async function deleteLinktreeAccountTransaction({
  publicKey,
  username,
  connection,
  program
}: {
  publicKey: PublicKey;
  username: string,
  connection: Connection,
  program: Program<Linktree>
}): Promise<{
  transaction: VersionedTransaction;
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
}> {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash();

  // Create instructions to send, in this case a simple transfer
  const instructions: TransactionInstruction[] = [];

  const ix = await program.methods.deleteLinktreeAccount(username)
  .accounts({owner: publicKey})
  .instruction()

  instructions.push(ix)

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage();

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy);

  return {
    transaction,
    latestBlockhash,
  };
}

async function editSettingsTransaction({
  publicKey,
  username,
  avatarUri,
  colorHex,
  connection,
  program
}: {
  publicKey: PublicKey;
  username: string,
  avatarUri: string,
  colorHex: string,
  connection: Connection,
  program: Program<Linktree>
}): Promise<{
  transaction: VersionedTransaction;
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
}> {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash();

  // Create instructions to send, in this case a simple transfer
  const instructions: TransactionInstruction[] = [];
  if(avatarUri !== UNCHANGED) {
    const ix = await program.methods.editAvatarUri(username, avatarUri)
    .accounts({owner: publicKey})
    .instruction()
    instructions.push(ix)
  }
  if(colorHex !== UNCHANGED) {
    const ix = await program.methods.editColorHex(username, colorHex)
    .accounts({owner: publicKey})
    .instruction()
    instructions.push(ix)
  }

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage();

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy);

  return {
    transaction,
    latestBlockhash,
  };
}


async function addLinksTransaction({
  publicKey,
  username,
  links,
  connection,
  program
}: {
  publicKey: PublicKey;
  username: string,
  links: Link[],
  connection: Connection,
  program: Program<Linktree>
}): Promise<{
  transaction: VersionedTransaction;
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
}>  {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash();

  // Create instructions to send, in this case a simple transfer
  const instructions: TransactionInstruction[] = [];
  const titles = links.map(l => l.title)
  const urls = links.map(l => l.url)
  const ix = await program.methods.addLinks(username, urls, titles)
  .accounts({owner: publicKey})
  .instruction()

  instructions.push(ix)

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage();

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy);

  return {
    transaction,
    latestBlockhash,
  };
}