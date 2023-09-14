import './App.css';
import { ChakraProvider, extendTheme  } from "@chakra-ui/react";
import Layout from "./components/Layout";
import ConnectButton from './components/ConnectButton';
import {useEffect, useState} from "react";
import {Web3Provider} from '@ethersproject/providers'

function App() {

  const [provider, setProvider] = useState<Web3Provider | undefined>(undefined);

  useEffect(() => {
    const initializeProvider = async () => {
      if (window.ethereum) {
        const provider = new Web3Provider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setProvider(provider);
      } else {
        setProvider(undefined)
      }
    };

    initializeProvider();
  }, []);


  const theme= extendTheme({
    fonts: {
      body: `'Poppins', sans-serif`,
    },
    fontSizes: {
      md: '14px',
    }
  })

  return (
      <ChakraProvider theme={theme} >
        <Layout>
          {provider ? <ConnectButton provider={provider} /> : <div>please install metamask</div> }
        </Layout>
      </ChakraProvider>
  );
}

export default App;
