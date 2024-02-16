import logo from '../../public/logo.jpg'

const Error = () => {
  return (
    <div className='flex flex-col items-center justify-center w-full h-full pb-8 bg-purpleOne'>
      <img alt='logo' src={logo} className='object-contain h-60 w-60'></img>
      <p className='-mt-4 text-3xl font-medium text-center text-white sm:text-4xl'>Page could not be found</p>
    </div>
  )
}

export default Error