const LoadingPage = () => {
  return (
    <section className="grid w-full h-full max-h-screen overflow-hidden place-items-center _bg-pattern-2">
      <video width="500" height="500" autoPlay muted playsInline>
        <source src="/animated-logo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </section>
  );
};

export default LoadingPage;
