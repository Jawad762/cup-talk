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

const ModalGroupTab = ({ parentRef, setIsFormSubmitted, socket } : Props) => {
    
    const axios = AxiosInstance()
    const divRef = useRef<HTMLDivElement>(null)
    const [users, setUsers] = useState([])
    const [chosenMembers, setChosenMembers] = useState<Set<User>>(new Set())
    const currentUser = useSelector((state: RootState) => state.user.user)
    const [_searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const searchText = e.target.value || ''
            const { data } = await axios.get(`/api/user/search/${currentUser.userId}/${searchText}`)
            setUsers(data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const form = new FormData(e.currentTarget)
            const groupName = form.get('group-name')
            if (!groupName) return
            const { data } = await axios.post('/api/room/create-group', { groupName, groupMembers: [...chosenMembers, currentUser] })
            setIsFormSubmitted(true)
            queryClient.invalidateQueries({ queryKey: ['rooms'] })
            setTimeout(() => {
                navigate(`/${data.groupId}`)
                parentRef.current?.close()
                cleanup()
            }, 1000)
            socket.emit('addToGroup')
        } catch (error) {
            console.error(error)
        }
    }

    const cleanup = () => {
        setIsFormSubmitted(false)
        setUsers([])
        setChosenMembers(new Set())
    }
    
    return (
        <form onSubmit={handleCreateGroup} className='relative space-y-4 text-sm outline-none'>
            <div className='text-sm'>
                <label className='block mb-1'>Group Name</label>
                <input name='group-name' minLength={1} className='w-full px-2 py-1.5 bg-transparent border-2 border-gray-500 rounded-md outline-none focus:border-white'/>
            </div>
            
            <div ref={divRef} className='group' tabIndex={0}>
                <label className='block mb-1'>Members</label>
                <input onChange={handleSearch} placeholder='Type to see suggestions' className='w-full px-2 py-1.5 bg-transparent border-2 border-gray-500 rounded-md outline-none focus:border-white'/>
                <div className='hidden space-y-2 py-4 w-full bg-[#1d1f2b] group-focus-within:block overflow-y-auto h-40'>
                    {users?.map((user: User) => (
                        <article key={user.userId} onClick={() => {
                            setChosenMembers(prev => new Set(prev).add(user))
                            divRef.current?.blur()
                        }} className='flex items-center gap-3 p-1 rounded-full cursor-pointer hover:bg-purpleFour'>
                            <img className='object-cover w-10 h-10 rounded-full' src={user.profilePicture || profile}></img>
                            <p>{user.username}</p>
                        </article>
                    ))}
                </div> 
            </div>

            {chosenMembers.size > 0 && 
            <div className='flex flex-wrap items-center gap-3 overflow-y-auto max-h-32'>
                {[...chosenMembers].map(member => (
                    <article className='flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-purpleFour'>
                        <img className='object-cover w-6 h-6 rounded-full' src={member.profilePicture || profile}></img>
                        <p>{member.username}</p>
                        <button type='button' onClick={() => setChosenMembers(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(member)
                            return newSet
                        })} className='ml-2 mt-0.5 transition-all hover:text-red-600'>&#x2716;</button>
                    </article>
                ))}
            </div>}
    
            <div>
                <button type='submit' className='px-6 py-1 rounded-md bg-purpleFour hover:bg-purpleHover disabled:opacity-50 disabled:cursor-not-allowed' disabled={chosenMembers.size === 0}>Create</button>
                <button type='button' onClick={() => {
                    parentRef.current?.close()
                    setSearchParams('')
                }} className='px-6 py-1 ml-4 bg-gray-500 rounded-md'>Cancel</button>
            </div>
        </form>      
      )
}

export default ModalGroupTab