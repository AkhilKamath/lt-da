'use client'

import { PublicKey } from "@solana/web3.js"
import { redirect, useParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { LTPage } from "./linktree-ui"

export default function LinktreeUserPage() {

  const pageThemes = {
    red: {
      '--lt-background': 'rgb(239 68 68)',
      '--lt-foreground': 'rgb(255 255 255)'
    },
    yellow: {
      '--lt-background': 'rgb(234 179 8)',
      '--lt-foreground': 'rgb(0 0 0)'
    },
    blue: {
      '--lt-background': 'rgb(59 130 246)',
      '--lt-foreground': 'rgb(255 255 255)'
    },
    green: {
      '--lt-background': 'rgb(34 197 94)',
      '--lt-foreground': 'rgb(0 0 0)'
    },
    darkgreen: {
      '--lt-background': 'rgb(20 83 45)',
      '--lt-foreground': 'rgb(255 255 255)'
    },
  }

  const params = useParams()

  //set themes
  useEffect(() => {
    const theme = 'yellow'
    const selectedTheme = pageThemes[theme] || pageThemes.red;
    
    Object.entries(selectedTheme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  const pdaAddress = useMemo(() => {
    if(!params?.pdaAddress) return;

    try {
      return new PublicKey(params.pdaAddress)
    } catch (e) {
      console.error('Invalid pda ', e);
    }
  }, [params])

  if(!pdaAddress) {
    return redirect(`/linktree`)
  }
  
  return (
    <LTPage pdaAddress={pdaAddress}/>
  )
}