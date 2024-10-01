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

function decodeAccountData(data: Uint8Array) {
  // Try to decode as UTF-8
  const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
  
  let decodedString = '';
  let binaryParts = [];
  
  for (let i = 0; i < data.length; i++) {
    try {
      decodedString += utf8Decoder.decode(data.subarray(i, i + 1));
    } catch {
      // If we can't decode as UTF-8, store as hexadecimal
      binaryParts.push(data[i].toString(16).padStart(2, '0'));
    }
  }
  
  return {
    text: decodedString.replace(/\0/g, ''),  // Remove null characters
    binary: binaryParts.join(' ')
  };
}

export function useGetLinktreeAccounts({ address, anchorWallet }: { address: PublicKey, anchorWallet: AnchorWallet }) {
  const { connection } = useConnection()
  console.log('in here')
  return useQuery({
    queryKey: [
      'get-pda-accounts',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      // return new Promise(async (resolve, reject) => {
        const pdas = await connection.getProgramAccounts(new PublicKey(idl.address));
        const anchorProvider = new AnchorProvider(connection, anchorWallet)
        const program = new Program<Linktree>(idl as Linktree, anchorProvider);
        const usernames = await Promise.all(
          pdas.map(async (pda, idx) => {
            try {
              const account = await program.account.linkTreeAccount.fetch(pda.pubkey)
              return {username: account.username, pubkey: pda.pubkey, owner: account.owner}
            } catch (error) {
              console.error('error in fetching account info', error)
              return {username: '', pubkey: '', owner: ''}
            }
          })
        )
        return usernames
        // resolve(usernames)
      // })
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

export function useCreateLinktreeAccount({ address, anchorWallet }: { address: PublicKey, anchorWallet: AnchorWallet }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  const anchorProvider = new AnchorProvider(connection, anchorWallet)
  const program = new Program<Linktree>(idl as Linktree, anchorProvider);

  return useMutation({
    mutationKey: [
      'transfer-sol',
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async (input: { username: string }) => {
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
        console.log('error', `Transaction failed! ${error}`, signature);

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
