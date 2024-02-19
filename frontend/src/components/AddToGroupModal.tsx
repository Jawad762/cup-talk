import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import profile from '../../public/pfp-default.jpg'
import { User } from '../types'
import AxiosInstance from '../Axios'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '../App'

type Props = {
    modalRef: React.RefObject<HTMLDialogElement>
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

const AddToGroupModal = ({ modalRef, socket }: Props) => {
    
  const axios = AxiosInstance()
  const [users, setUsers] = useState([])
  const [chosenMembers, setChosenMembers] = useState<Set<User>>(new Set())
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)
  const currentUser = useSelector((state: RootState) => state.user.user)
  const queryClient = useQueryClient()
  const { id } = useParams()
  const divRef = useRef<HTMLDivElement>(null)
  
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
          const searchText = e.target.value.trim()
          if (searchText.length > 0) {
            const { data } = await axios.get(`/api/user/search/${currentUser.userId}/${searchText}`)
            setUsers(data)
          }
          else setUsers([])
      } catch (error) {
          console.error(error)
      }
  }

  const handleAddToGroup = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      try {
          await axios.post('/api/room/add-users-to-group', { users: [...chosenMembers], roomId: id })
          setIsFormSubmitted(true)
          setTimeout(() => {
            modalRef.current?.close()
            cleanup()
          }, 1000)
          queryClient.invalidateQueries({ queryKey: ['roomInfo', id] })
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

  if (isFormSubmitted) return (
    <dialog ref={modalRef} className='space-y-4 p-4 text-center text-green-400 shadow-xl text-sm rounded-lg w-72 bg-[#252837]'>
        User(s) added successfully &#10003;
    </dialog>
  )
  
  return (
        <dialog className='p-4 text-sm text-white rounded-lg shadow-xl w-[90%] md:w-96 bg-[#252837]' ref={modalRef}>
            <form onSubmit={handleAddToGroup} className='relative space-y-4'>
                <div ref={divRef} tabIndex={0} className='group'>
                    <label className='block mb-1'>Members to add:</label>
                    <input onChange={handleSearch} placeholder='Type to see suggestions' className='w-full px-2 py-1.5 bg-transparent border-2 border-gray-500 rounded-md outline-none focus:border-white'/>
                    <div className='hidden space-y-2 py-4 w-full bg-[#1d1f2b] group-focus-within:block overflow-y-auto h-40'>
                        {users?.map((user: User) => (
                            <article key={user.userId} onClick={() => {
                                setChosenMembers(prev => new Set(prev).add(user))
                                divRef.current?.blur()
                            }} className='flex items-center gap-3 p-1 rounded-full cursor-pointer hover:bg-purpleFour'>
                                <img alt='profile-picture' className='object-cover w-10 h-10 rounded-full' src={user.profilePicture || profile}></img>
                                <p>{user.username}</p>
                            </article>
                        ))}
                    </div> 
                </div>

                {chosenMembers.size > 0 && 
                <div className='flex flex-wrap items-center gap-3 overflow-y-auto max-h-32'>
                    {[...chosenMembers].map(member => (
                        <article className='flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-purpleFour'>
                            <img alt='profile-picture' className='object-cover w-6 h-6 rounded-full' src={member.profilePicture || profile}></img>
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
                    <button type='submit' className='px-6 py-1 rounded-md bg-purpleFour hover:bg-purpleHover disabled:opacity-50 disabled:cursor-not-allowed' disabled={chosenMembers.size === 0}>Add To Group</button>
                    <button type='button' onClick={() => {
                        modalRef.current?.close()
                    }} className='px-6 py-1 ml-4 bg-gray-500 rounded-md hover:bg-gray-600'>Cancel</button>
                </div>
            </form>                 
        </dialog>
    )
}

export default AddToGroupModal