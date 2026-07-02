"use client"

import { useState, useCallback } from "react"

interface Theme {
  primary: string
  background: string
  text: string
}

function generateRandomColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`
}

export function useRandomTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>({
    primary: generateRandomColor(),
    background: generateRandomColor(),
    text: generateRandomColor(),
  })

  const changeTheme = useCallback(() => {
    setTheme({
      primary: generateRandomColor(),
      background: generateRandomColor(),
      text: generateRandomColor(),
    })
  }, [])

  return [theme, changeTheme]
}
