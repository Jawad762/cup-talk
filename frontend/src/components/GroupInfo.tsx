import { useQuery, useQueryClient } from '@tanstack/react-query'
import AxiosInstance from '../Axios'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { RootState } from '../redux/store'
import defaultPfp from '../../public/pfp-default.jpg'
import { MdEdit, MdPhotoCamera } from 'react-icons/md'
import { TextareaAutosize } from '@mui/base'
import { useEffect, useRef, useState } from 'react'
import { FaCheck } from 'react-icons/fa6'
import WarningModal from './WarningModal'
import { addStrikes, logout } from '../redux/userSlice'
import { uploadImageToFirebase } from '../uploadImageToFirebase'
import LoadingSpinner from './LoadingSpinner'
import { roomType } from './Conversations'

const GroupInfo = () => {

  const axios = AxiosInstance()
  const { id } = useParams()
  const currentUser = useSelector((state: RootState) => state.user.user)
  const [isInputDisabled, setIsInputDisabled] = useState(true)
  const [imageLoading, setImageLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()
  const warningModalRef = useRef<HTMLDialogElement>(null)
  const dispatch = useDispatch()

  const findRoomInfo = async () => {
    try {
      const res = await axios.get(`/api/user/find/${id}/${currentUser.userId}/0`)
      if (res.data[0].roomType !== 'group') throw new Error('Invalid room type.')
      else return res.data
    } catch (error) {
      console.error(error)
    }
  }

  const { data: roomInfo, isLoading } = useQuery({ queryKey: ['groupInfo', id], queryFn: findRoomInfo })

  const handleEditDescription = () => {
    setIsInputDisabled(false)
  }

  const handleSubmitDescription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const form = new FormData(e.currentTarget)
      const description = form.get('description')
      queryClient.setQueryData(['roomInfo', id], (prevRoom: any) => {
        const newRoom = prevRoom.map((room: any) => {
          return {
            ...room,
            groupDescription: description
          }
        })
        return newRoom
      })

      setIsInputDisabled(true)
      
      const res = await axios.put(`/api/room/update-description/${id}`, { description })
      console.log(res)
    } catch (error) {
      console.error(error)
    }
  }

  const banUser = async () => {
    try {
        await axios.delete(`/api/user/ban/${currentUser.userId}`, { withCredentials: true })
        dispatch(logout())
        await axios.post('/api/auth/signout', {}, { withCredentials: true })
    } catch (error) {
        console.error(error)
    }
  }

  const addUserStrikes = async () => {
      warningModalRef.current?.showModal()
      setTimeout(() => {
          warningModalRef.current?.close()
          dispatch(addStrikes())
      }, 4000)
      await axios.put(`/api/user/strike/${currentUser.userId}`, {}, { withCredentials: true })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageLoading(true)
      const res = await uploadImageToFirebase(e.target.files?.[0] as File, 'group-profile-pictures/')
      if (res === 'rejected') addUserStrikes()
      else uploadProfilePicture(res)
      setImageLoading(false)
      e.target.value = ''
  }

  const uploadProfilePicture = async (profilePicture: string) => {
    try {
      queryClient.setQueryData(['roomInfo', id], (prevRoom: any) => {
        const newRoom = prevRoom.map((room: any) => {
          return {
            ...room,
            groupProfilePicture: profilePicture
          }
        })
        return newRoom
      })
      queryClient.setQueryData(['rooms'], (prevRooms: roomType[]) => {
        const newRooms = prevRooms.map(room => {
          if (room.roomId === roomInfo[0].roomId) {
            return {
              ...room,
              groupProfilePicture: profilePicture
            }
          }
          return room
        })
        return newRooms
      })
      await axios.put(`/api/room/update-pfp/${id}`, { profilePicture })
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    !isInputDisabled && inputRef.current?.focus()
  }, [isInputDisabled])

  useEffect(() => {
    if (currentUser.strikes > 2) banUser() 
  }, [currentUser.strikes])

  return (
    <section className='_bg-pattern-2 w-full md:max-w-[70%] lg:max-w-[50%] pt-6 pb-12 md:pb-0 h-full px-4 md:px-10 flex gap-3 flex-col text-white md:rounded-r-xl'>
      
      <div className='relative w-40 h-40 mx-auto rounded-full shrink-0'>
        <img alt='profile-picture' className='absolute object-cover w-full h-full rounded-full' src={roomInfo?.[0].groupProfilePicture || defaultPfp}/>
        <label htmlFor='profile' className='absolute bottom-0 right-0 z-50 grid rounded-full cursor-pointer w-14 h-14 place-items-center bg-purpleFour'>
            {!imageLoading && <MdPhotoCamera className='text-3xl'/>}
            {imageLoading && <LoadingSpinner/>}
        </label>
        <input onChange={handleImageUpload} type="file" name="profile" id="profile" className='hidden'/>
      </div>

      <h2 className='mx-auto text-2xl'>{roomInfo?.[0].groupName}</h2>

      <div className='flex items-center'>
        <form onSubmit={handleSubmitDescription} className='flex-grow'>
          <label className='block mb-1 text-xs opacity-75'>Group Description</label>
          <div className='flex items-center'>
            <TextareaAutosize name='description' ref={inputRef} minRows={1} className='w-full py-2 pr-2 bg-transparent outline-none resize-none focus:border-b border-purpleFour' defaultValue={roomInfo?.[0].groupDescription} disabled={isInputDisabled}/>
            {!isInputDisabled && <button type='submit'><FaCheck className='text-2xl text-purpleFour'/></button>}
          </div>
        </form>
        {isInputDisabled && <button onClick={handleEditDescription}><MdEdit className='mt-4 text-2xl text-purpleFour'/></button>}
      </div>

      <h2 className='text-xs opacity-75'>Members</h2>
      {isLoading ?
       <div className='flex justify-center w-full mt-2'><LoadingSpinner/></div>
       :
       <div className='space-y-2 overflow-y-auto'>
       {roomInfo?.map((member: any) => (
         <Link to={`/profile/${member.userId}`} key={member.userId} className='flex items-center gap-3 p-2 rounded-full cursor-pointer hover:bg-purpleHover'>
           <div className='relative w-12 h-12 rounded-full'>
             <img alt='profile-picture' className='absolute object-cover w-full h-full rounded-full' src={member.userProfilePicture || defaultPfp}/>
           </div>
           <p>{member.username}</p>
         </Link>
       ))}
      </div>
      }

      <WarningModal modalRef={warningModalRef}/>

    </section>
  )
}

export default GroupInfo