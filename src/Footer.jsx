const Footer = () => {
  return (
    <footer className="flex flex-col items-center justify-center bg-black border-t pt-5 border-gray-300">
      <p className="text-lg font-bold text-white mb-0">Desarrollado con la tecnología de</p>
      <img
        src="/scalo.png"
        alt="Logo"
        className="w-44 transition-transform transform hover:scale-110 animate-pulse mt-[-40px]"
      />
    </footer>
  );
};

export default Footer;
