"use client"

import { useState } from "react"
import { FloatingActionButton } from "./floating-action-button"
import { AddTransactionModal } from "./add-transaction-modal"

export function AddTransactionFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <FloatingActionButton onClick={handleOpenModal} />
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </>
  )
}
