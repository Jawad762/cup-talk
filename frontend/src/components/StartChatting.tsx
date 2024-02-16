import logo from '../../public/logo5.svg'

const StartChatting = () => {
  return (
    <div className='lg:flex flex-col items-center justify-center w-[64%] mx-10 pb-20 hidden'>
        <img src={logo} alt='logo' className='object-contain h-52 w-52'></img>
        <p className='text-2xl font-bold text-center text-white'>You can start chatting with users!</p>
    </div>
  )
}

export default StartChatting