import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../Axios'
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from 'react';

type Props = {
    modalRef: React.RefObject<HTMLDialogElement>
}

const ExitGroupModal = ({ modalRef }: Props) => {
    const axios = AxiosInstance()
    const { id } = useParams()
    const currentUser = useSelector((state: RootState) => state.user.user)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const handleExitGroup = async () => {
        try {
            await axios.delete(`/api/room/exit-group/${currentUser.userId}/${id}`)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitted(true)
            queryClient.invalidateQueries({ queryKey: ['rooms'] })
            setTimeout(() => {
                modalRef.current?.close()
                setIsSubmitted(false)
                navigate('/')
            }, 1000)
        }
    }

    if (isSubmitted) return (
        <dialog ref={modalRef} className='space-y-4 p-4 text-center text-green-400 shadow-xl text-sm rounded-lg min-w-72 bg-[#252837]'>
            You left.
        </dialog>
      )
    
  return (
    <dialog ref={modalRef} className="relative p-4 rounded-lg shadow-xl min-w-72 bg-[#252837]">
        <h3 className="mb-5 font-normal text-white">Leave Group ?</h3>
        <div className="flex flex-col items-end gap-3">
            <button onClick={handleExitGroup} type="button" className="px-4 py-1 font-bold rounded-full text-purpleFour hover:bg-purpleHover hover:text-white">
                Yes, I'm sure
            </button>
            <button onClick={() => modalRef.current?.close()} type="button" className="px-4 py-1 font-bold rounded-full text-purpleFour hover:bg-purpleHover hover:text-white">No, cancel</button>
        </div>
    </dialog>
  )
}

export default ExitGroupModal