import { PublicKey } from "@solana/web3.js";

export interface Link {
  title: string,
  url: string
}

export interface LTAccountInfo {
  owner: PublicKey;
  username: string;
  links: any[];
  avatarUri: string;
  colorHex: string;
}