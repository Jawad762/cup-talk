import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { User } from '../types'

type initialStateTypes = {
  currentUsername: string;
  currentPassword: string;
  usernameStatus: usernameStatus;
  auth: boolean;
  user: User
}

type usernameStatus = {
  status: string;
  message: string;
}

const initialState: initialStateTypes = {
  currentUsername: '',
  currentPassword: '',
  usernameStatus: {
    status: '',
    message: ''
  },
  auth: false,
  user: { strikes: 0 }
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    changeUsername: (state, action: PayloadAction<string | null>) => {
      state.currentUsername = action.payload || ''
    },
    changePassword: (state, action: PayloadAction<string | null>) => {
      state.currentPassword = action.payload || ''
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = {...action.payload}
    },
    setStatus: (state, action: PayloadAction<usernameStatus>) => {
      state.usernameStatus = action.payload
    },
    setAuth: (state, action: PayloadAction<boolean>) => {
      state.auth = action.payload
    },
    logout: (state) => {
      state.user = { strikes: 0 }
      state.auth = false
    },
    clearAllInput: (state) => {
      state.currentUsername = ''
      state.currentPassword = ''
      state.usernameStatus = {
        status: '',
        message: ''
      }
    },
    updateUserPfp: (state, action: PayloadAction<string>) => {
      state.user.profilePicture = action.payload
    },
    updateUsernameState: (state, action: PayloadAction<string>) => {
      state.user.username = action.payload
    },
    updateDescriptionState: (state, action: PayloadAction<string>) => {
      state.user.description = action.payload
    },
    addStrikes: (state) => {
      return {
        ...state,
        user: {
          ...state.user,
          strikes: state.user.strikes + 1
        }
      };
    }
  },
})

export const { changeUsername, changePassword, setUser, setStatus, clearAllInput, setAuth, logout, updateUserPfp, updateUsernameState, updateDescriptionState, addStrikes } = userSlice.actions

export default userSlice.reducer