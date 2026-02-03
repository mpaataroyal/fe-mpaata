import '../styles/globals.css';
import {AuthProvider} from "../context/AuthContext";

export default function App({ Component, pageProps }) {
  // return(// Check if the individual page has a getLayout function
  const getLayout = Component.getLayout || ((page) => page);

  return getLayout(<Component {...pageProps} />);
}