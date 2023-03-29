import { useState } from 'react'
import {
    useAccount, useBalance, useSwitchNetwork,
    useNetwork, goerli, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction
} from "wagmi";
import { ethers } from "ethers";
import TOKEN_ABI from "../TOKEN_ABI.json"
import MARKET_ABI from "../MARKET_ABI.json"
import Spinner from 'react-bootstrap/Spinner';
import { Col, Container, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { useWeb3Modal } from '@web3modal/react';



export default function Buy() {
    const [errorR, setErrorR] = useState("");
    const [TokenToBuy, setTokenToBuy] = useState<number | undefined>(undefined);
    const TOKEN_ADDRESS = "0x95245ab700942856BDfa83B7926889087e51F0b7"
    const MARKET_ADDRESS = "0xa0279390592A7453D187fFd123428a36c8eA922f"
    const { address, isConnected } = useAccount();
    const { chain } = useNetwork()
    const { error, isLoading: SwNetworkLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
    const { open } = useWeb3Modal();
    const handleSW = () => switchNetwork?.(goerli.id);


    const handleTokensAmountToBuyChange = (e: any) => {
        setTokenToBuy(e.target.value);
    }

    const price = useContractRead({
        address: MARKET_ADDRESS,
        abi: MARKET_ABI,
        functionName: "price",
    });

    const { data: Balance, internal } = useBalance({
        address: address,
        token: TOKEN_ADDRESS,
        watch: true,
    })

    const totalSupply = useContractRead({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "totalSupply",
    });

    const availabletoBuyTokens = useContractRead({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [MARKET_ADDRESS],
        watch: true,
    })

    const { config, error: BuyError } = usePrepareContractWrite({
        address: MARKET_ADDRESS,
        abi: MARKET_ABI,
        functionName: 'buy',

        args: [
            TokenToBuy ? ethers.utils.parseEther(TokenToBuy.toString()) : ethers.utils.parseEther("1"),
            //@ts-ignore
            TokenToBuy ? price?.data?._hex && { value: ethers.utils.parseEther((TokenToBuy * parseInt(price.data._hex, 16) / 10000).toFixed(18)) } : price?.data?._hex && { value: ethers.utils.parseEther((1 * parseInt(price.data._hex, 16) / 10000).toString()) }],
    })
    const { data: writeData, write } = useContractWrite(config)

    const { isLoading: TXisLoading, isSuccess } = useWaitForTransaction({
        hash: writeData?.hash,
    })

    const checkAvailableToBuyTokens = () => {
        //@ts-ignore
        const available = parseInt(availabletoBuyTokens.data._hex, 16);
        const toBuy = ethers.utils.parseEther(TokenToBuy!.toString());
        //@ts-ignore
        if (available < toBuy) {
            return false;
        } else {
            return true;
        }
    }

    const handleBuyTokens = async (e: { preventDefault: () => void; }) => {
        try {
            e.preventDefault();
            setErrorR("");
            if (chain?.unsupported) {
                handleSW();
            }
            //@ts-ignore
            if (!checkAvailableToBuyTokens()) {
                setErrorR("Available tokens to buy exceeded!")
                setTokenToBuy(undefined);
                return
            }
            write?.()
            setTokenToBuy(undefined);
        } catch (error: any) {
            console.log(error);
            console.log("55");

            setErrorR(error.message);
            document.documentElement.scrollTop = 0;
        }
    };

    const formatUnixTimestamp = (unixTimestamp: number): string => {
        const date = new Date(unixTimestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        return ` ${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }


    return (
        <div className='buyBackground'>
            <Container>
                <Row>
                    <Col className='Col'>
                        <p></p>
                        <Table striped bordered hover variant="dark" className='minWidth_320'>
                            <thead>
                                <tr>
                                    <th>Token Symbol:</th>
                                    <th className="tdWidth_244">{Balance?.symbol}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Your token balance:</td>
                                    <td>{Balance?.formatted}</td>
                                </tr>
                                <tr>
                                    <td>Refresh time:</td>
                                    <td>{(internal.dataUpdatedAt === 0)
                                        ? ""
                                        : formatUnixTimestamp(internal.dataUpdatedAt)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className={"tdHeight_30"}></td>
                                </tr>
                                <tr>
                                    <td>Available tokens to buy:</td>
                                    <td>{Balance?.symbol
                                        /* @ts-ignore */
                                        ? " " + availabletoBuyTokens && availabletoBuyTokens.data && availabletoBuyTokens.data._hex && ethers.utils.formatEther(availabletoBuyTokens?.data?._hex || "11111111") + " " + Balance?.symbol
                                        : ""}</td>
                                </tr>
                                <tr>
                                    <td>Current price per token:</td>
                                    <td>{Balance?.symbol
                                        /* @ts-ignore */
                                        ? " " + price && price.data && price.data._hex && parseInt(price.data._hex, 16) / 10000 + " ETH"
                                        : ""}</td>
                                </tr>
                                <tr>
                                    <td>TotalSupply:</td>
                                    <td>{Balance?.symbol
                                        /* @ts-ignore */
                                        ? " " + totalSupply && totalSupply.data && totalSupply.data._hex && ethers.utils.formatEther(totalSupply.data._hex) + " " + Balance?.symbol
                                        : ""}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </Col>

                    <Col>
                        <h1 className='white'>Buy tokens</h1>
                        <form
                            onSubmit={handleBuyTokens}>
                            <div className="my-4 ">
                                <input
                                    type="number"
                                    name="valueAddBalance"
                                    className="input input-bordered block w-full focus:ring focus:outline-none"
                                    placeholder="tokens amount to buy"
                                    onChange={handleTokensAmountToBuyChange}
                                    value={TokenToBuy || ""} />
                            </div>
                            <footer>
                                {isConnected
                                    ? (SwNetworkLoading || TXisLoading
                                        ? <Spinner as="span" animation="grow" />
                                        : <Button type="submit">Buy tokens</Button>)
                                    /* @ts-ignore */
                                    : <Button type="button" onClick={open}>Buy tokens</Button>
                                }
                            </footer>
                            {isSuccess
                                ? (<div ><p className='green'>Successfully purchase tokens!</p>

                                    <div>
                                        <a href={`https://goerli.etherscan.io/tx/${writeData?.hash}`}>Etherscan</a>
                                    </div>
                                </div>)
                                : ""}
                        </form>
                        <div className="alerts ">{error && error.message}</div>
                        <div className="alerts ">{errorR} </div>
                        {/* @ts-ignore */}
                        <div className="alerts "> {BuyError && BuyError.code} </div>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}












