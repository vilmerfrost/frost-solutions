import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface AuthState {
  token: string | null
  user: { id: string; email: string; tenantId: string } | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadToken: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  loadToken: async () => {
    const token = await SecureStore.getItemAsync('auth_token')
    const userJson = await SecureStore.getItemAsync('auth_user')
    set({
      token,
      user: userJson ? JSON.parse(userJson) : null,
      isLoading: false,
    })
  },

  login: async (email, password) => {
    const res = await fetch('https://frostsolutions.se/app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    await SecureStore.setItemAsync('auth_token', data.token)
    await SecureStore.setItemAsync('auth_user', JSON.stringify(data.user))
    set({ token: data.token, user: data.user })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('auth_user')
    set({ token: null, user: null })
  },
}))
