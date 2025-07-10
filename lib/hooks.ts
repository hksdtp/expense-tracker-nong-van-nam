"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url)
    
    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText || response.statusText}`);
    }
    
    // Check if the response is empty
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Empty response from server');
    }
    
    // Try to parse JSON
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}. Raw response: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export function useTransactions(month: number, year: number) {
  const [isManualRefresh, setIsManualRefresh] = useState(false)
  const { data, error, mutate } = useSWR(
    `/api/transactions?month=${month}&year=${year}&refresh=${isManualRefresh}`,
    fetcher,
    {
      revalidateOnFocus: true, // Revalidate khi focus lại tab
      revalidateIfStale: true, // Revalidate nếu data cũ
      dedupingInterval: 5000, // Giảm xuống 5 giây để cập nhật nhanh hơn
      refreshInterval: 10000, // Auto refresh mỗi 10 giây
    }
  )

  useEffect(() => {
    setIsManualRefresh(false)
  }, [data, error])

  return {
    transactions: data?.transactions || [],
    isLoading: !error && !data,
    isError: !!error,
    errorMessage: error instanceof Error ? error.message : data?.error || null,
    mutate,
    refresh: () => mutate(), // Thêm function để force refresh
  }
}

export function useAccountData(month: number, year: number) {
  const { data, error, mutate } = useSWR(`/api/account-data?month=${month}&year=${year}`, fetcher, {
    revalidateOnFocus: true, // Revalidate khi focus lại tab
    revalidateIfStale: true, // Revalidate nếu data cũ
    dedupingInterval: 5000, // Giảm xuống 5 giây
    refreshInterval: 15000, // Auto refresh mỗi 15 giây
  })

  return {
    accountData: data?.data || null,
    isLoading: !error && !data,
    isError: !!error,
    errorMessage: error instanceof Error ? error.message : data?.error || null,
    refresh: () => mutate(), // Thêm function để force refresh
  }
}

export function useCarData(month: number, year: number) {
  const { data, error } = useSWR(`/api/car-data`, fetcher, {
    revalidateOnFocus: false
  })

  return {
    carData: data?.carData || null,
    isLoading: !error && !data,
    isError: !!error,
    errorMessage: error instanceof Error ? error.message : data?.error || null,
  }
}

export function useTransactionSummary() {
  const { data, error } = useSWR("/api/transaction-summary", fetcher, {
    revalidateOnFocus: false
  })

  return {
    summary: data || { totalIncome: 0, totalExpense: 0, balance: 0 },
    isLoading: !error && !data,
    isError: !!error,
    errorMessage: error instanceof Error ? error.message : data?.error || null,
  }
}
