"use client"

import type React from "react"
import { createContext, useState, useContext, type ReactNode } from "react"

interface Document {
  id: string
  title: string
  content: string
}

interface DocumentContextType {
  documents: Document[]
  currentDocument: Document | null
  setCurrentDocument: (document: Document) => void
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export const useDocumentContext = () => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error("useDocumentContext must be used within a DocumentProvider")
  }
  return context
}

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([{ id: "1", title: "Untitled", content: "" }])
  const [currentDocument, setCurrentDocument] = useState<Document>(documents[0])

  const addDocument = (document: Document) => {
    setDocuments([...documents, document])
  }

  const updateDocument = (id: string, updates: Partial<Document>) => {
    setDocuments((docs) => docs.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc)))
    if (currentDocument.id === id) {
      setCurrentDocument((prev) => ({ ...prev, ...updates }))
    }
  }

  return (
    <DocumentContext.Provider
      value={{
        documents,
        currentDocument,
        setCurrentDocument,
        addDocument,
        updateDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}
