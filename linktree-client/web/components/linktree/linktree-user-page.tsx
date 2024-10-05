'use client'

import { PublicKey } from "@solana/web3.js"
import { redirect, useParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { LTPage } from "./linktree-ui"
import { colors } from "./colors"

export default function LinktreeUserPage() {

  const pageThemes = colors

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