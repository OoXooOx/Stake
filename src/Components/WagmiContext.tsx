import { WagmiConfig, createClient, configureChains, goerli } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { FC, ReactNode } from 'react'


const { chains, provider, webSocketProvider } = configureChains(
    [goerli],
    [alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY! })],
)

// Set up client
const client = createClient({
    autoConnect: true,
    connectors: [
        new MetaMaskConnector({ chains }),
        new WalletConnectConnector({
            chains,
            options: {
                qrcode: true,
            },
        })
    ],
    provider,
    webSocketProvider,
});

interface WagmiProviderProps {
    children: ReactNode
}


export const WagmiProvider: FC<WagmiProviderProps> = ({ children }) => {
    return (
        <WagmiConfig client={client}>
            {children}
        </WagmiConfig>)
}