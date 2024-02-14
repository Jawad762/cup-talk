import { useDispatch, useSelector } from 'react-redux'
import { User } from '../types'
import { RootState } from '../redux/store'
import { MdEdit } from "react-icons/md";
import { MdOutlineInfo } from "react-icons/md";
import { LuUser2 } from "react-icons/lu";
import defaultPfp from '../../public/pfp-default.jpg'
import { MdPhotoCamera } from "react-icons/md";
import { updateDescriptionState, updateUsernameState, logout, addStrikes } from '../redux/userSlice';
import AxiosInstance from '../Axios'
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { FaCheck } from "react-icons/fa6";
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../App';
import WarningModal from './WarningModal';
import { uploadImageToFirebase } from '../uploadImageToFirebase';
import LoadingSpinner from './LoadingSpinner';

interface SocketProp {
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

const Profile = ({ socket }: SocketProp) => {

    const axiosInstance = AxiosInstance()
    const currentUser: User = useSelector((state: RootState) => state.user.user)
    const dispatch = useDispatch()
    const [isUsernameInputDisabled, setIsUsernameInputDisabled] = useState(true)
    const [isDescriptionInputDisabled, setIsDescriptionInputDisabled] = useState(true)
    const [usernameError, setUsernameError] = useState<string | null>(null)
    const [imageLoading, setImageLoading] = useState(false)
    const usernameInputRef = useRef<HTMLInputElement>(null)
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
    const id = useParams().id || currentUser.userId
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const warningModalRef = useRef<HTMLDialogElement>(null)

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
        await axiosInstance.put(`/api/user/strike/${currentUser.userId}`, {}, { withCredentials: true })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageLoading(true)
        const res = await uploadImageToFirebase(e.target.files?.[0] as File, 'profile-pictures/')
        if (res === 'rejected') addUserStrikes()
        else updateProfile(res)
        setImageLoading(false)
      }

    const findProfileUser = async () => {
        const res = await axiosInstance.get(`/api/user/${id}`)
        return res.data
    }

    const { data: profileUser } = useQuery({ queryKey: ['profileUser', id], queryFn: findProfileUser })

    const updateProfile = async (url: string) => {
        try {
            await axiosInstance.put(`/api/user/updateProfile/${currentUser.userId}`, { profilePicture: url }, { withCredentials: true })
            queryClient.invalidateQueries({ queryKey: ['profileUser', id]})
        } catch (error) {
            console.error(error)
        }
    }

    const updateUsername = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const form = new FormData(e.currentTarget)
            const username = form.get('username')
            if (username !== currentUser.username) {
                await axiosInstance.put(`/api/user/updateUsername/${currentUser.userId}`, { username }, { withCredentials: true })
                username && typeof username === 'string' && dispatch(updateUsernameState(username))
            }
            setIsUsernameInputDisabled(true)
            setUsernameError(null)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(error.response?.data)
                setUsernameError(error.response?.data)
            }
        }
    }

    const updateDescription = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const form = new FormData(e.currentTarget)
            const description = form.get('description')
            if (description !== currentUser.description) {
                await axiosInstance.put(`/api/user/updateDescription/${currentUser.userId}`, { description }, { withCredentials: true })
                description && typeof description === 'string' && dispatch(updateDescriptionState(description))
            }
            setIsDescriptionInputDisabled(true)
        } catch (error) {
            console.error(error)
        }
    }

    const handleOpenChat = async () => {
        const res = await axiosInstance.post('/api/room/create', { userOneId: currentUser.userId, userTwoId: profileUser.userId })
        // if a room already exists, it will return its id, if not it will create a new room and return its id
        const createdRoomId = res.data
        navigate(`/${createdRoomId}`)
    }

    useEffect(() => {
        !isUsernameInputDisabled && usernameInputRef.current?.focus()
    }, [isUsernameInputDisabled])

    useEffect(() => {
        !isDescriptionInputDisabled && descriptionInputRef.current?.focus()
    }, [isDescriptionInputDisabled])

    useEffect(() => {
        socket.on('userStatusChange', () => {
            queryClient.invalidateQueries({ queryKey: ['profileUser', id] })
        })
    },[])

    useEffect(() => {
        if (currentUser.strikes > 2) banUser() 
    }, [currentUser.strikes])
    
  return (
    <section className="_bg-pattern-2 items-center w-full md:max-w-[70%] lg:max-w-[50%] py-10 h-full px-4 md:px-10 flex flex-col text-white md:rounded-r-xl">
        
        <div className='relative grid w-40 h-40 rounded-full place-items-center'>
            <img src={profileUser?.profilePicture || defaultPfp} className='absolute object-cover object-center w-full h-full rounded-full'></img>
            {profileUser?.userId === currentUser.userId && (
                <>
                    <label htmlFor='profile' className='z-50 grid overflow-hidden translate-x-full translate-y-full rounded-full cursor-pointer w-14 h-14 place-items-center bg-purpleFour'>
                        {!imageLoading && <MdPhotoCamera className='text-3xl'/>}
                        {imageLoading && <LoadingSpinner/>}
                    </label>
                    <input type="file" onChange={handleImageUpload} name="profile" id="profile" className='hidden'/>
                </>
            )}
        </div>
        
        <div className='flex items-center gap-2 mt-4 text-xl'>
            <p className='capitalize'>{profileUser?.status}</p>
            <span className={`inline-block w-2 h-2 rounded-full ${profileUser?.status === 'online' ? 'bg-purpleFour' : 'bg-red-600' }`}></span>
        </div>
        
        <div className='flex items-center w-full gap-4 pb-4 mt-10 border-b border-slate-400'>
            <LuUser2 className='flex-none text-2xl opacity-75'/>
            <form onSubmit={updateUsername} className='w-full'>
                <label htmlFor='username' className='block text-xs opacity-75'>Username</label>
                {usernameError && <p className='text-red-500'>{usernameError}</p>}
                <div className='flex justify-between w-full'>
                    <input
                        ref={usernameInputRef}
                        id='username' name='username' defaultValue={profileUser?.username}
                        className='w-full pb-1 mr-2 text-lg bg-transparent outline-none focus:border-b border-purpleFour' 
                        disabled={isUsernameInputDisabled ? true : false}>
                     </input>
                    {!isUsernameInputDisabled && <button type='submit'><FaCheck className='text-2xl cursor-pointer text-purpleFour'/></button>}
                </div>
            </form>
            {isUsernameInputDisabled && profileUser?.userId === currentUser.userId && <button type='button' onClick={() => setIsUsernameInputDisabled(false)}><MdEdit className='mt-auto text-2xl cursor-pointer text-purpleFour'/></button>}
        </div>
        
        <div className='flex items-center w-full gap-4 mt-4'>
            <MdOutlineInfo className='flex-none text-2xl opacity-75'/>
            <form onSubmit={updateDescription} className='w-full'>
                <label htmlFor='description' className='block text-xs opacity-75'>Description</label>
                <div className='flex justify-between w-full'>
                    <TextareaAutosize
                       ref={descriptionInputRef}
                       minRows={1} maxRows={5} maxLength={180} 
                       id='description' name='description' defaultValue={profileUser?.description} 
                       className='w-full pb-1 mr-2 text-lg bg-transparent outline-none resize-none focus:border-b border-purpleFour' 
                       disabled={isDescriptionInputDisabled ? true : false}>
                    </TextareaAutosize>
                    {!isDescriptionInputDisabled && <button type='submit'><FaCheck className='text-2xl cursor-pointer text-purpleFour'/></button>}
                </div>
            </form>
            {isDescriptionInputDisabled && profileUser?.userId === currentUser.userId && <button type='button' onClick={() => setIsDescriptionInputDisabled(false)}><MdEdit className='mt-auto text-2xl cursor-pointer text-purpleFour'/></button>}
        </div>

        {profileUser?.userId !== currentUser.userId && (
            <div className='w-full mt-4'>
                <button onClick={handleOpenChat} className='px-6 py-2 rounded-full shadow-lg bg-purpleFour hover:bg-purpleHover'>Chat with {profileUser?.username}</button>
            </div>
        )}

        <WarningModal modalRef={warningModalRef}/>

    </section>
  )
}

export default Profile