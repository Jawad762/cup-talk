import './App.css'
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Signin from './components/Signin'
import Signup from './components/Signup'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from './redux/store'
import Error from './components/Error'
import Sidebar from './components/Sidebar'
import Conversations from './components/Conversations'
import StartChatting from './components/StartChatting'
import Conversation from './components/Conversation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Profile from './components/Profile'
import Explore from './components/Explore'
import axios from 'axios'
import { Socket, io } from 'socket.io-client'
import GroupInfo from './components/GroupInfo'
import LoadingPage from './components/Loading'
import { logout, setAuth, setUserOnlineStatus } from './redux/userSlice'
import EnableNotifications from './components/EnableNotifications'
import { MessageType } from './types'

export interface ServerToClientEvents {
    receivedMessage: (message: any) => void;
    typing: () => void;
    stopTyping: () => void;
    userStatusChange: (status: string) => void;
    messageStatusChange: (seenById: number) => void;
    deletedMessage: (message: MessageType) => void
    addedToGroup: () => void
}
  
export interface ClientToServerEvents {
    userStatusChange: (status: string) => void;
    sendMessage: (message: any) => void;
    messageStatusChange: (id: string | undefined, seenById: number) => void;
    joinRoom: (id: string | undefined) => void;
    typing: (id: string | undefined) => void;
    stopTyping: (id: string | undefined) => void;
    deleteMessage: (message: MessageType) => void;
    leaveRoom: (id: string | undefined) => void
    addToGroup: () => void
}

function App() {

  const dispatch = useDispatch()
  const userId = useSelector((state: RootState) => state.user.user.userId)
  const auth = useSelector((state: RootState) => state.user.auth)
  const queryClient = new QueryClient()
  const [showAnimation, setShowAnimation] = useState(false)
  
  // connect to socket
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('https://cuptalk.onrender.com', { withCredentials: true })

  const GeneralLayout = () => {

    const enableNotificationsModalRef = useRef<HTMLDialogElement>(null)

    const updateUserStatus = async (status: string) => {
      dispatch(setUserOnlineStatus(status))
      await axios.put(`/api/user/updateStatus/${userId}`, { status }, { withCredentials: true });
      socket.emit('userStatusChange', status);
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        updateUserStatus('offline');
      } else {
        updateUserStatus('online');
      }
    };

    useEffect(() => {
      'Notification' in window && Notification.permission !== 'granted' && enableNotificationsModalRef.current?.showModal()
    },[])

    useEffect(() => {
      if (userId) {
        updateUserStatus('online');
        document.addEventListener('visibilitychange', handleVisibilityChange);
  
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          updateUserStatus('offline')
        };
      } 
    }, [userId]);

    return (
      <main className='flex w-full h-full p-0 md:p-4 bg-[#100023]'>
        <Sidebar socket={socket}/>
        <Outlet/>
        <EnableNotifications modalRef={enableNotificationsModalRef}/>
      </main>
    )
  }

  const HomeLayout = () => {
    return (
      <>
        <Conversations socket={socket}/>
        <Outlet/>
      </>
    )
  }

  useEffect(() => {
    socket.connect()

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!sessionStorage.getItem('animationShown')) {
      setShowAnimation(true)
      setTimeout(() => {
        setShowAnimation(false)
        sessionStorage.setItem('animationShown', 'true')
      }, 3500)
    }
  }, [])

  const checkAuth = async () => {
    try {
      await axios.get('/api/auth/check-auth', { withCredentials: true })
      dispatch(setAuth(true))
    } catch (error) {
      dispatch(logout())
    }
  }

  useEffect(() => {
    checkAuth()
  }, [auth])

  const router = createBrowserRouter([
    {
      path: '/',
      element: auth ? <GeneralLayout/> : <Navigate to='/signin'/>,
      errorElement: <Error/>,
      children: [
        {
          path: '/',
          element: <HomeLayout/>,
          children: [
            {
              path: '/',
              element: <StartChatting/>
            },
            {
              path: '/:id',
              element: <Conversation socket={socket}/>
            }
          ]
        },
        {
          path: '/:id/info',
          element: <GroupInfo/>
        },
        {
          path: '/profile',
          element: <Profile socket={socket}/>
        },
        {
          path: '/profile/:id',
          element: <Profile socket={socket}/>
        },
        {
          path: '/explore',
          element: <Explore/>
        }
      ]
    },
    {
      path: '/signin',
      element: <Signin/>
    },
    {
      path: '/signup',
      element: <Signup/>
    }
  ])

  if (showAnimation) return <LoadingPage/>

  return (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}/>
      </QueryClientProvider>
  )

}

export default App
