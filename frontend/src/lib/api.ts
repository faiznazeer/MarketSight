const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Token management
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token)
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token')
}

// Auth API calls
export interface SignUpData {
  email: string
  password: string
  name?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  id_token?: string
  token_type: string
  expires_in: number
}

export interface UserProfile {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  updated_at?: string
}

export const api = {
  // Auth endpoints
  async signup(data: SignUpData): Promise<{ message: string; user_id: string; email: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Signup failed')
    }

    return response.json()
  },

  async login(data: LoginData): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    return response.json()
  },

  async getUserProfile(): Promise<UserProfile> {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${API_BASE_URL}/auth/user/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch user profile')
    }

    return response.json()
  },

  async validateToken(): Promise<{ valid: boolean; user: any }> {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Token validation failed')
    }

    return response.json()
  },

  async logout(): Promise<void> {
    removeAuthToken()
  },

  async getGoogleAuthUrl(redirectUri?: string): Promise<{ authorization_url: string }> {
    const url = new URL(`${API_BASE_URL}/auth/google/authorize`)
    if (redirectUri) {
      url.searchParams.set('redirect_uri', redirectUri)
    }
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error('Failed to get Google auth URL')
    }

    return response.json()
  },

  // Query endpoint
  async query(question: string, k: number = 5): Promise<{
    question: string
    answer: string
    sources: Array<{ source: string; chunk_index: number; score: number }>
    context_used: number
    user_id: string
  }> {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ question, k }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Query failed')
    }

    return response.json()
  },
}

