import { Dispatch, SetStateAction, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import profile from '../../public/pfp-default.jpg'
import { User } from '../types'
import AxiosInstance from '../Axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '../App'

type Props = {
    parentRef: React.RefObject<HTMLDialogElement>
    setIsFormSubmitted: Dispatch<SetStateAction<boolean>>
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

const ModalMessageTab = ({ parentRef, setIsFormSubmitted, socket } : Props) => {
    
    const axios = AxiosInstance()
    const divRef = useRef<HTMLDivElement>(null)
    const [users, setUsers] = useState([])
    const currentUser = useSelector((state: RootState) => state.user.user)
    const [recipient, setRecipient] = useState<null | User>(null)
    const [_searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const searchText = e.target.value
            if (searchText.length > 0) {
                const { data } = await axios.get(`/api/user/search/${currentUser.userId}/${searchText}`)
                setUsers(data)
            }
            else setUsers([])
        } catch (error) {
            console.error(error)
        }
    }

    const handleComposeMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const form = new FormData(e.currentTarget)
            const messageText = form.get('message-text')
            if (!messageText) return
            const { data } = await axios.post('/api/message/compose', { messageText, senderId: currentUser.userId, receiverId: recipient?.userId})
            const { roomId } = data
            setIsFormSubmitted(true)
            setTimeout(() => {
                parentRef.current?.close()
                navigate(`/${roomId}`)
                cleanup()
            }, 1000)
            socket.emit('sendMessage')
        } catch (error) {
            console.error(error)
        } finally {
            queryClient.invalidateQueries({ queryKey: ['rooms'] })
        }
    }

    const cleanup = () => {
        setIsFormSubmitted(false)
        setUsers([])
        setRecipient(null)
    }
    
  return (
    <form onSubmit={handleComposeMessage} className='relative space-y-4 text-sm outline-none'>
        <div className='text-sm'>
            <label className='block mb-1'>Text</label>
            <input name='message-text' type='text' minLength={1} className='w-full px-2 py-1.5 bg-transparent border-2 border-gray-500 rounded-md outline-none focus:border-white'/>
        </div>
        
        <div ref={divRef} className='group' tabIndex={0}>
            <label className='mb-1 mr-2'>To:</label>
            {recipient && <span className='text-green-400'>{recipient.username}(id: {recipient.userId})</span>}
            <input onChange={handleSearch} placeholder='Type to see suggestions' className='w-full px-2 py-1.5 bg-transparent border-2 border-gray-500 rounded-md outline-none focus:border-white'/>
            <div className='hidden space-y-2 py-4 w-full bg-[#1d1f2b] group-focus-within:block overflow-y-auto h-40'>
                {users?.map((user: User) => (
                    <article key={user.userId} onClick={() => {
                        setRecipient(user)
                        divRef.current?.blur()
                    }} className='flex items-center gap-3 p-1 rounded-full cursor-pointer hover:bg-purpleFour'>
                        <img alt='profile-picture' className='object-cover w-10 h-10 rounded-full' src={user.profilePicture || profile}></img>
                        <p>{user.username}</p>
                    </article>
                ))}
            </div> 
        </div>

        <div>
            <button type='submit' className='px-6 py-1 rounded-md bg-purpleFour hover:bg-purpleHover disabled:opacity-50 disabled:cursor-not-allowed' disabled={recipient === null}>Send</button>
            <button type='button' onClick={() => {
                parentRef.current?.close()
                setSearchParams('')
            }} className='px-6 py-1 ml-4 bg-gray-500 rounded-md'>Cancel</button>
        </div>
    </form>      
  )
}

export default ModalMessageTab