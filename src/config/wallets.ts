import { InjectedConnector } from "@web3-react/injected-connector";

export const ChainId = {
  ETHEREUM: 1,
  BSC: 56,
  BSC_TESTNET: 97,
};

export const ChainIdHex = {
  ETHEREUM: '0x1',
  BSC: '0x38',
  BSC_TESTNET: '0x61',
}

const supportedChainIds = Object.values(ChainId);

export const injected = new InjectedConnector({
  supportedChainIds,
});


