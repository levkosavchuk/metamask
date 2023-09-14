import { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import { useWeb3React } from "@web3-react/core";
import {formatUnits} from '@ethersproject/units'

import {
  Button,
  Box,
  Text,
  Input,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import {ChainIdHex, injected} from "../config/wallets";
import abi from "./abi.json";
import { AbiItem } from "web3-utils";
import {BigNumberish, ethers} from 'ethers';
import {Web3Provider} from "@ethersproject/providers";
import {InterfaceAbi} from "ethers/lib.commonjs/abi";
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;
import {Deferrable} from "@ethersproject/properties";
import {TransactionRequest, TransactionResponse} from "@ethersproject/abstract-provider";

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function ConnectButton({provider}: {provider: Web3Provider}) {
  const signer = provider.getSigner()
  const [account, setAccount] = useState<string>('')
  // const { account, active, activate, library, deactivate } = useWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [connected, setConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>("0");
  const [babyBalance, setBabyBalance] = useState<string>("0");
  const [mode, setMode] = useState<string>("BNB");
  const [recieverAdd, setRecieverAdd] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [gasFee, setGasFee] = useState<string>("");
  const [gasLimit, setGasLimit] = useState<number>(0);
  const toast = useToast();

  async function handleConnectWallet() {
      if (window.ethereum) {
        try {
          // check if the chain to connect to is installed
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: ChainIdHex.BSC_TESTNET}]
          });
        } catch (error: any) {
          // This error code indicates that the chain has not been added to MetaMask
          // if it is not, then install it into the user MetaMask
          if (error.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: ChainIdHex.BSC_TESTNET,
                    chainName: 'Smart Chain - Testnet',
                    nativeCurrency: {
                      name: 'Binance coin',
                      symbol: 'BNB',
                      decimals: 18,
                    },
                    blockExplorerUrls: ['https://testnet.bscscan.com'],
                    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                  }
                ]
              })
            } catch (addError) {
              console.error(addError);
            }
          }
          console.error(error);
        }
      } else {
        // if no window.ethereum then MetaMask is not installed
        alert('MetaMask is not installed. Please consider installing it: https://metamask.io/download.html');
      }
    // connected ? deactivate() : await activate(injected);
    setConnected(!connected);
  }

  async function getAccount() {
   return await provider.listAccounts().then((res: string[]) => {
     return res[0]
   })
  }

  useEffect(() => {
    provider.listAccounts().then((accounts: string[]) => {
     setAccount(accounts[0])
    })
    if (connected && window.ethereum) {
      window.ethereum.on('chainChanged', (chainId: string) => {
        if (chainId !== ChainIdHex.ETHEREUM) {
          // deactivate()
          setConnected(!connected)
        }
      })
      window.ethereum.on('accountsChanged', (params: any) => {
        console.log(123)
        console.log(params, 'params')
        // deactivate()
        // setConnected(!connected);
      })
    }
  }, [connected]);

  function handleMode() {
    setMode(mode === "BNB" ? "BabyDoge" : "BNB");
  }

  function handleChangeAddress(event: any) {
    setRecieverAdd(event.target.value);
  }

  function handleChangeAmount(event: any) {
    setSendAmount(event.target.value);
  }

  async function handleOpenModal() {
    if (!recieverAdd) {
      return toast({
        description: "Please input Receiver Address",
        status: "error",
      });
    }
    if (!sendAmount || sendAmount === 0) {
      return toast({
        description: "Please input send amount",
        status: "error",
      });
    }

    const block = await provider.getBlock("latest");
    setGasLimit(+block.gasLimit.toString());

    const gasPrice = await provider.getGasPrice()
    setGasFee(toGWei(gasPrice.toString()));

    onOpen();
  }

  // const sendBaby = useCallback(async () => {
  //   const ctx = new ethers.Contract(
  //       "0xc748673057861a797275CD8A068AbB95A902e8de",
  //     abi as InterfaceAbi,
  //   );
  //
  //   await ctx.methods.approve(account, sendAmount).call();
  //   await ctx.deployTransaction(recieverAdd, sendAmount);
  // }, [account, library]);

  const sendAction = useCallback(async () => {
    const txParams: Deferrable<TransactionRequest> = {
      from: account ?? '',
      to: recieverAdd,
      gasLimit: gasLimit,
      gasPrice: gasFee,
      value: formatUnits(sendAmount.toString(), "wei"),
    };
    await signer.sendTransaction(txParams).catch(error => console.error(error)).then((res: any) => {
      console.log(`Transaction hash: ${res.hash}`);
      provider.getTransaction(res.hash).then((transaction) => {
        console.log('Transaction receipt: ', transaction.wait().then((receipt) => receipt))
      })
    })
    onClose();
    valueload();
  }, []);

  function fromWei(val?: string) {
    return val ? formatUnits(val, 'gwei') : '0'
  }

  function toGWei(val?: string) {
    return val ? formatUnits(val, "gwei") : '0'
  }

  const valueload = useCallback(async () => {
    const ctx = new ethers.Contract(
        "0xc748673057861a797275CD8A068AbB95A902e8de",
        abi as InterfaceAbi,
    );
      if (account) {
        const balance = await provider.getBalance(account);
        console.log(account, 'acc')
        console.log(balance, 'bal')
        setBalance(Number(fromWei(balance.toString())).toFixed(5));

        const gasPrice = await provider.getGasPrice();
        setGasFee(gasPrice.toString());

        // const value1 = await ctx.methods.balanceOf(account).call({gasPrice: Number(gasPrice) * 100});
        // console.log('[baby amount]', value1)
        // setBabyBalance(value1);
      }
    }, [account]);

    useEffect(() => {
      // active && valueload();
    }, [account, valueload]);

    return (
        <>
          <h1 className="title">Metamask login demo from Enva Division</h1>
          {connected ? (
              <Box
                  display="block"
                  alignItems="center"
                  background="white"
                  borderRadius="xl"
                  p="4"
                  width="300px"
              >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb="2"
                >
                  <Text color="#158DE8" fontWeight="medium">
                    Account:
                  </Text>
                  <Text color="#6A6A6A" fontWeight="medium">
                    {`${account.slice(0, 6)}...${account.slice(
                        account.length - 4,
                        account.length
                    )}`}
                  </Text>
                </Box>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb="2"
                >
                  <Text color="#158DE8" fontWeight="medium">
                    BabyDoge Balance :
                  </Text>
                  <Text color="#6A6A6A" fontWeight="medium">
                    {babyBalance}
                  </Text>
                </Box>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb="2"
                >
                  <Text color="#158DE8" fontWeight="medium">
                    BNB Balance:
                  </Text>
                  <Text color="#6A6A6A" fontWeight="medium">
                    {balance}
                  </Text>
                </Box>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb="2"
                >
                  <Text color="#158DE8" fontWeight="medium">
                    BNB / BabyDoge
                  </Text>
                  <Switch size="md" value={mode} onChange={handleMode}/>
                </Box>
                <Box
                    display="block"
                    justifyContent="space-between"
                    alignItems="center"
                    mb="4"
                >
                  <Text color="#158DE8" fontWeight="medium">
                    Send {mode}:
                  </Text>
                  <Input
                      bg="#EBEBEB"
                      size="lg"
                      value={recieverAdd}
                      onChange={handleChangeAddress}
                  />
                </Box>
                <Box display="flex" alignItems="center" mb="4">
                  <Input
                      bg="#EBEBEB"
                      size="lg"
                      value={sendAmount}
                      onChange={handleChangeAmount}
                  />
                  <Button
                      onClick={handleOpenModal}
                      bg="#158DE8"
                      color="white"
                      fontWeight="medium"
                      borderRadius="xl"
                      ml="2"
                      border="1px solid transparent"
                      _hover={{
                        borderColor: "blue.700",
                        color: "gray.800",
                      }}
                      _active={{
                        backgroundColor: "blue.800",
                        borderColor: "blue.700",
                      }}
                  >
                    Send
                  </Button>
                </Box>
                <Box display="flex" justifyContent="center" alignItems="center">
                  <Button
                      onClick={handleConnectWallet}
                      bg="#158DE8"
                      color="white"
                      fontWeight="medium"
                      borderRadius="xl"
                      border="1px solid transparent"
                      width="300px"
                      _hover={{
                        borderColor: "blue.700",
                        color: "gray.800",
                      }}
                      _active={{
                        backgroundColor: "blue.800",
                        borderColor: "blue.700",
                      }}
                  >
                    Disconnect Wallet
                  </Button>
                </Box>
                <Modal isOpen={isOpen} onClose={onClose}>
                  <ModalOverlay/>
                  <ModalContent>
                    <ModalHeader>Are you Sure?</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody>
                      <div>
                        Are you sure {sendAmount} {mode} to {recieverAdd} user?
                      </div>
                      <div>Gas Limit: {gasLimit}</div>
                      <div>Gas Price: {gasFee}</div>
                    </ModalBody>
                    <ModalFooter>
                      <Button colorScheme="blue" mr={3} onClick={onClose}>
                        Close
                      </Button>
                      <Button variant="ghost" onClick={sendAction}>
                        Send
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </Box>
          ) : (
              <Box bg="white" p="4" borderRadius="xl">
                <Button
                    onClick={handleConnectWallet}
                    bg="#158DE8"
                    color="white"
                    fontWeight="medium"
                    borderRadius="xl"
                    border="1px solid transparent"
                    width="300px"
                    _hover={{
                      borderColor: "blue.700",
                      color: "gray.800",
                    }}
                    _active={{
                      backgroundColor: "blue.800",
                      borderColor: "blue.700",
                    }}
                >
                  Connect Wallet
                </Button>
              </Box>
          )}
        </>
    )};
