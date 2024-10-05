import { PublicKey } from "@solana/web3.js";
import { Dispatch, SetStateAction } from "react";

export interface Link {
  title: string,
  url: string
}

export interface LinktreeAccount {
  username: string;
  pubkey: PublicKey;
  owner: PublicKey;
}

export interface LTAccountInfo {
  owner: PublicKey;
  username: string;
  avatarUri: string;
  links: any[];
  colorHex: string;
}

export type ColorKey = 'red' | 'yellow' | 'blue' | 'violet' | 'green' | 'pink';

export interface ThemeContextType {
  currentTheme: ColorKey;
  setCurrentTheme: Dispatch<SetStateAction<ColorKey>>;
}
