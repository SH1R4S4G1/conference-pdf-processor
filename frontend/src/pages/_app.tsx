// _app.tsx
import '.././app/globals.css';
import { NextPage } from 'next';
import { AppProps } from 'next/app';

const MyApp: NextPage<AppProps> = ({ Component, pageProps }) => {
  console.log("initialized");
  return <Component {...pageProps} />;
}

export default MyApp;
