/** @type {import('next').NextConfig} */
const nextConfig = {
  // Não precisamos mais definir valores hardcoded aqui
  // As variáveis de ambiente serão carregadas dos arquivos .env apropriados
  
  // Configuração de imagens para resolver problemas de otimização
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Desativar a verificação de tamanho de imagem para evitar warnings
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig; 