import { useMutation, useQueryClient } from "@tanstack/react-query";
import AxiosInstance from '../Axios'
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../App';
import { MessageType } from "../types";
import { roomType } from "./Conversations";

type ModalProps = {
    selectedMessage: MessageType
    socket: Socket<ServerToClientEvents, ClientToServerEvents>
    modalRef: React.RefObject<HTMLDialogElement>
}

const DeleteMsgModal = ({ selectedMessage, socket, modalRef } : ModalProps) => {

    const axios = AxiosInstance()
    const { id } = useParams()
    const queryClient = useQueryClient()
    const [isSubmitted, setIsSubmitted] = useState(false)

    const deleteMessage = async () => {
        try {
            queryClient.setQueryData(['messages', id], (prevMessages: Array<MessageType>) => {
                                
                const newMessages = prevMessages.map(message => {
                    if (message.messageId === selectedMessage.messageId) {
                        return {
                            ...message,
                            isDeleted: 1
                        }
                    }
                    return message
                })
                return newMessages
            })

            queryClient.setQueryData(['rooms'], (prevRooms: roomType[]) => {
                const newRooms = prevRooms?.map(room => {
                  if (room.roomId === Number(selectedMessage.roomId) && room.lastMessageId === selectedMessage.messageId) {
                    return {
                      ...room,
                      lastMessageIsDeleted: 1,
                    }
                  }
                  else return room
                })
                return newRooms
              })

            socket.emit('deleteMessage', selectedMessage)
            
            setIsSubmitted(true)
            setTimeout(() => {
                modalRef.current?.close()
                setIsSubmitted(false)  
            }, 1000)
            
            // its a put request because we're not actually deleting it, we're simply modifying the isDeleted column
            const res = await axios.put(`/api/message/delete/${selectedMessage.messageId}`)
            return res.data
        } catch (error) {
            console.error(error)
        }
    }

    const deleteMessageMutation = useMutation({
        mutationFn: deleteMessage,
    })
    
    if (isSubmitted) return (
        <dialog ref={modalRef} className='space-y-4 p-4 text-center text-green-400 shadow-xl text-sm rounded-lg min-w-72 bg-[#252837]'>
            Message deleted successfully.
        </dialog>
    )
    
  return (
        <dialog ref={modalRef} className="relative p-4 rounded-lg shadow-xl min-w-72 bg-[#252837]">
            <h3 className="mb-5 font-normal text-white">Delete message ?</h3>
            <div className="flex flex-col items-end gap-3">
                <button onClick={() => deleteMessageMutation.mutate()}  type="button" className="px-4 py-1 font-bold rounded-full text-purpleFour hover:bg-purpleHover hover:text-white">
                    Yes, I'm sure
                </button>
                <button onClick={() => modalRef.current?.close()} type="button" className="px-4 py-1 font-bold rounded-full text-purpleFour hover:bg-purpleHover hover:text-white">No, cancel</button>
            </div>
        </dialog>
  )
}

export default DeleteMsgModal