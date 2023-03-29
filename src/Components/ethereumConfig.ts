import { goerli } from "wagmi/chains";
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { configureChains, createClient } from "wagmi";
import {
    EthereumClient,
    modalConnectors
  } from "@web3modal/ethereum";


// Wagmi client

const { chains, provider } = configureChains(
  [goerli],
  [alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY! })],
)

export const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({
    projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
    version: "1", // or "2"
    appName: "Stake",
    chains,
  }),
  provider,
});

// Web3Modal Ethereum Client
export const ethereumClient = new EthereumClient(wagmiClient, chains);