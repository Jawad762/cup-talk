import { IoMdClose, IoMdDownload } from "react-icons/io"

type Props = {
    modalRef: React.RefObject<HTMLDialogElement>
    imageSrc: string
}

const OpenImageModal = ({ modalRef, imageSrc }: Props) => {
  return (
    <dialog className="space-y-2 text-white bg-transparent outline-none" ref={modalRef}>
        <div className="flex items-center justify-end gap-3 text-4xl">
            <a href={imageSrc} download><IoMdDownload/></a>
            <button onClick={() => modalRef.current?.close()}><IoMdClose/></button>
        </div>
        <img src={imageSrc} className="object-cover max-w-[100%] mx-auto"></img>
    </dialog>
  )
}

export default OpenImageModal