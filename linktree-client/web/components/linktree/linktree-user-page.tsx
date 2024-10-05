'use client'

import { PublicKey } from "@solana/web3.js"
import { redirect, useParams } from "next/navigation"
import { createContext, useEffect, useMemo, useState } from "react"
import { LTPage } from "./linktree-ui"
import { colors } from "./colors"
import { ThemeContext } from "./contexts"
import { ColorKey } from "./types"

const pageThemes = colors

export default function LinktreeUserPage() {

  const params = useParams()

  const [currentTheme, setCurrentTheme] = useState<ColorKey>('yellow')

  //set themes
  useEffect(() => {
    const selectedTheme = pageThemes[currentTheme] || pageThemes.red;
    
    Object.entries(selectedTheme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [currentTheme]);

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
    <ThemeContext.Provider value={{currentTheme, setCurrentTheme}}>
      <LTPage pdaAddress={pdaAddress}/>
    </ThemeContext.Provider>
  )
}