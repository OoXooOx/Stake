import React, { useEffect, useState } from 'react'
import {
    useAccount, useBalance, useSwitchNetwork, useProvider, useSigner,
    useNetwork, goerli, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction, useContractReads, useContract
} from "wagmi";
import { ethers } from "ethers";
import { useWeb3Modal } from '@web3modal/react';
import STAKE_ABI from "../STAKE_ABI.json";
import TOKEN_ABI from "../TOKEN_ABI.json";
import Spinner from 'react-bootstrap/Spinner';
import { Col, Container, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

export default function Stake() {
    const [errorR, setErrorR] = useState<string>("");
    const [activeButton, setActiveButton] = useState<string | number | null>();
    const [TokenToStake, setTokenToStake] = useState<number>();
    const [stakeBalances, setStakeBalances] = useState<any[]>();
    const [claimButtonState, setClaimButtonState] = useState<(number | boolean)[][]>([]);
    const [spinner, setSpinner] = useState<boolean>(false);
    const [spinnerClaim, setSpinnerClaim] = useState<number | undefined>();
    const [balancesLoading, setBalancesLoading] = useState<boolean>(false);
    const [balancesError, setBalancesError] = useState<boolean>(false);
    const [stakeTxHash, setStakeTxHash] = useState<string>("");
    const [stakeClaimHash, setStakeClaimHash] = useState<string>("");
    const { address, isConnected } = useAccount();
    const { chain } = useNetwork();
    const provider = useProvider()
    const { open } = useWeb3Modal();
    const { error, isLoading: SwNetworkLoading, pendingChainId, switchNetwork } = useSwitchNetwork();
    const { data: signer, isError, isLoading } = useSigner()
    const handleSW = () => switchNetwork?.(goerli.id);
    const STAKE_ADDRESS = "0xa8FD4A0cd4E21903794deA2b1FB9a584c9815A92";
    const TOKEN_ADDRESS = "0x95245ab700942856BDfa83B7926889087e51F0b7";

    const handleButtonClick = (el: number) => {
        setActiveButton(el)
    }

    const tokenContract = {
        address: TOKEN_ADDRESS as `0x{string}`,
        abi: TOKEN_ABI,
    }

    const TokenProvider = useContract({
        ...tokenContract,
        signerOrProvider: provider,
    })

    const TokenSigner = useContract({
        ...tokenContract,
        signerOrProvider: signer,
    })

    const stakeContract = {
        address: STAKE_ADDRESS as `0x{string}`,
        abi: STAKE_ABI,
    }

    const StakeProvider = useContract({
        ...stakeContract,
        signerOrProvider: provider,
    })

    const StakeSigner = useContract({
        ...stakeContract,
        signerOrProvider: signer,
    })

    const { data: Balance, internal } = useBalance({
        address: address,
        token: TOKEN_ADDRESS,
        watch: true,
    })

    const { data: Rewards, isError: ErrorRewards, isLoading: RewardsLoading } = useContractReads({
        contracts: [
            {
                ...stakeContract,
                functionName: 'rewards_',
                args: [0],
            },
            {
                ...stakeContract,
                functionName: 'rewards_',
                args: [1],
            },
            {
                ...stakeContract,
                functionName: 'rewards_',
                args: [2],
            },
            {
                ...stakeContract,
                functionName: 'rewards_',
                args: [3],
            },
            {
                ...stakeContract,
                functionName: 'rewards_',
                args: [4],
            },
        ],
    })

    const { data: Percents, isError: ErrorPercents, isLoading: PercentsLoading } = useContractReads({
        contracts: [
            {
                ...stakeContract,
                functionName: 'rewards',
                //@ts-ignore
                args: [Rewards && Rewards[0] && Rewards[0]._hex && parseInt(Rewards[0]._hex, 16)],
            },
            {
                ...stakeContract,
                functionName: 'rewards',
                //@ts-ignore
                args: [Rewards && Rewards[1] && Rewards[1]._hex && parseInt(Rewards[1]._hex, 16)],
            },
            {
                ...stakeContract,
                functionName: 'rewards',
                //@ts-ignore
                args: [Rewards && Rewards[2] && Rewards[2]._hex && parseInt(Rewards[2]._hex, 16)],
            },
            {
                ...stakeContract,
                functionName: 'rewards',
                //@ts-ignore
                args: [Rewards && Rewards[3] && Rewards[3]._hex && parseInt(Rewards[3]._hex, 16)],
            },
            {
                ...stakeContract,
                functionName: 'rewards',
                //@ts-ignore
                args: [Rewards && Rewards[4] && Rewards[4]._hex && parseInt(Rewards[4]._hex, 16)],
            },
        ],
    })

    const { data: allowanceData, isError: allowanceError, isLoading: allowanceLoading } = useContractRead({
        ...tokenContract,
        functionName: 'allowance',
        args: [address, STAKE_ADDRESS],
        watch: true,
    })

    const { data: totalTokensStakedByAddressData, isError: totalTokensStakedByAddressError, isLoading: totalTokensStakedByAddressLoading } = useContractRead({
        ...stakeContract,
        functionName: 'tokensStakedByAddress',
        args: [address],
    })

    const { data: StakeNonceData, isError: StakeNonceError, isLoading: StakeNonceLoading } = useContractRead({
        ...stakeContract,
        functionName: 'stakeNonce',
        args: [address],
    })



    const fetchData = async () => {
        setBalancesLoading(true)
        try {
            let arr = [];
            //@ts-ignore
            if (StakeNonceData && StakeNonceData._hex) {
                //@ts-ignore
                for (let i = 1; i <= parseInt(StakeNonceData._hex, 16); i++) {
                    arr.push(i);
                }
            }
            const SB = await Promise.all(
                arr.map(async (el) => {
                    const stakeBalance = await StakeProvider?.stakeBalances(address, el)
                    return stakeBalance;
                }
                ))
            setStakeBalances(SB)
            if (signer && signer._isSigner) {
                const CB = await Promise.all(
                    arr.map(async (el) => {
                        try {
                            await StakeSigner?.callStatic.claim(el)
                            return [el, true];
                        } catch (error: any) {
                            return [el, false];
                        }
                    }
                    ))
                setClaimButtonState(CB);
            }
            setBalancesLoading(false)
        } catch {
            setBalancesLoading(false)
            setBalancesError(true)
            console.log(balancesError);
        }
    }

    useEffect(() => {
        fetchData();
    }, [signer, address, StakeNonceData])

    const handleTokensAmountToStakeChange = (e: any) => {
        setTokenToStake(e.target.value);
    }

    const handleClaim = async (num: number) => {
        try {
            setErrorR("");
            if (chain?.unsupported) {
                handleSW();
                return
            }
            const claim = await StakeSigner?.claim(num)
            setSpinnerClaim(num)
            await claim.wait()

            setSpinnerClaim(undefined)
            setStakeClaimHash(claim.hash)
        } catch (error: any) {
            if (error.code === "ACTION_REJECTED") {
                setSpinnerClaim(undefined)
                console.log(error.message);
            } else {
                setSpinnerClaim(undefined)
                document.documentElement.scrollTop = 0;
                console.log(error);
            }
        }
    }

    // //@ts-ignore
    // const { config: TokenApproveConfig } = usePrepareContractWrite({
    //     ...tokenContract,
    //     functionName: "approve",
    //     //@ts-ignore
    //     args: [STAKE_ADDRESS, ethers.utils.parseEther(TokenToStake || "1")]
    // })

    // const { data: TokenApproveData, write: writeTokenApprove } = useContractWrite(TokenApproveConfig)

    // const { isLoading: TokenApproveLoading, isSuccess: TokenApproveIsSuccess } = useWaitForTransaction({
    //     hash: TokenApproveData?.hash,
    // })


    // const { config: StakeConfig } = usePrepareContractWrite({
    //     ...stakeContract,
    //     functionName: 'claim',
    //     //@ts-ignore
    //     args: [2],
    // })
    // const { data: ClaimWriteData, write: writeClaim } = useContractWrite(StakeConfig)

    // const { isLoading: ClaimTxLoading, isSuccess: ClaimTxIsSuccess } = useWaitForTransaction({
    //     hash: ClaimWriteData?.hash,
    // })

    const handleStakeTokens = async (e: { preventDefault: () => void; }) => {
        try {
            e.preventDefault();
            setErrorR("");
            if (chain?.unsupported) {
                handleSW();
                return
            }
            if (TokenToStake! > Number(Balance?.formatted)) {
                setErrorR("Not enough tokens!")
                setTokenToStake(undefined);
                return
            }
            if (!activeButton) {
                setErrorR("You must choose stake time!")
                return
            }
            let allowance = Number(ethers.utils.formatEther(await TokenProvider?.allowance(address, STAKE_ADDRESS)))
            while (allowance < TokenToStake!) {
                const approve = await TokenSigner?.approve(STAKE_ADDRESS, ethers.utils.parseEther(TokenToStake!.toString()));
                setSpinner(true);
                await approve.wait();
                allowance = Number(ethers.utils.formatEther(await TokenProvider?.allowance(address, STAKE_ADDRESS)))
            }
            const tx = await StakeSigner?.stake(ethers.utils.parseEther(TokenToStake!.toString()), activeButton)
            setSpinner(true);
            await tx.wait();
            setSpinner(false)
            setStakeTxHash(tx.hash)
            setTokenToStake(undefined);
        } catch (error: any) {
            if (error.code === "ACTION_REJECTED") {
                setSpinner(false)
                console.log(error.message);
            } else {
                setSpinner(false)
                document.documentElement.scrollTop = 0;
                setErrorR(error.message);
                console.log(error);
            }
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

    const formatUnixTimestampBlockchain = (unixTimestamp: number): string => {
        const date = new Date(unixTimestamp * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        return ` ${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return (
        <div>
            <Container >
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
                                    <td>{Balance?.formatted && Balance?.formatted}</td>
                                </tr>
                                <tr>
                                    <td>Token approved to spend:</td>
                                    {/* @ts-ignore */}
                                    <td>{allowanceData && allowanceData._hex && ethers.utils.formatEther(allowanceData._hex)}</td>
                                </tr>
                                <tr>
                                    <td>Total staked tokens by you:</td>
                                    {/* @ts-ignore */}
                                    <td>{totalTokensStakedByAddressData && totalTokensStakedByAddressData._hex && ethers.utils.formatEther(totalTokensStakedByAddressData._hex)}</td>
                                </tr>
                                <tr>
                                    <td>Refresh time:</td>
                                    <td>{(internal.dataUpdatedAt === 0)
                                        ? ""
                                        : formatUnixTimestamp(internal.dataUpdatedAt)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className={"tdHeight_30"}> </td>
                                </tr>
                                {!RewardsLoading && !PercentsLoading && Percents && Rewards && Rewards.map((el, index) => {
                                    return (
                                        <React.Fragment key={index}>
                                            <tr>
                                                {/* @ts-ignore */}
                                                <td >Rewards for stake {el && el._hex && parseInt(el._hex, 16)} days</td>
                                                <td>
                                                    {/* @ts-ignore */}
                                                    {Percents && Percents[index] && Percents[index]._hex && parseInt(Percents[index]._hex, 16) + " % yearly"}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </Table>
                    </Col>

                    <Col className='ColStake'>
                        <h1 className='white'>Stake tokens</h1>
                        <p></p>
                        {!chain?.unsupported && !RewardsLoading && !PercentsLoading && Percents && Rewards && Rewards.map((el) => {
                            return (
                                /* @ts-ignore */
                                <React.Fragment key={parseInt(el._hex, 16)}>
                                    <Button
                                        /* @ts-ignore */
                                        key={parseInt(el._hex, 16)} className={activeButton === parseInt(el._hex, 16) ? "active" : "notactive"}
                                        /* @ts-ignore */
                                        onClick={() => handleButtonClick(parseInt(el._hex, 16))}>
                                        {/* @ts-ignore */}
                                        {el && el._hex && parseInt(el._hex, 16)} days
                                    </Button>
                                </React.Fragment>
                            )
                        })}
                        <form
                            onSubmit={handleStakeTokens}>
                            <div className="my-4 ">
                                <input
                                    type="number"
                                    name="valueAddBalance"
                                    className="input input-bordered block w-full focus:ring focus:outline-none"
                                    placeholder="tokens amount to stake"
                                    onChange={handleTokensAmountToStakeChange}
                                    value={TokenToStake || ""} />
                            </div>
                            <footer>
                                {isConnected
                                    ? (SwNetworkLoading || spinner
                                        ? <Spinner as="span" animation="grow" />
                                        : <button
                                            type="submit"
                                            className="btn btn-secondary submit-button focus:ring focus:outline-none w-full">
                                            Stake tokens
                                        </button>)
                                    : <button
                                        type="button"
                                        /* @ts-ignore */
                                        onClick={open}
                                        className="btn btn-secondary submit-button focus:ring focus:outline-none w-full">
                                        Stake tokens
                                    </button>
                                }
                            </footer>
                            {stakeClaimHash
                                ? (<div>
                                    <p className='green'>Successfully claim tokens!</p>
                                    <div>
                                        <a href={`https://goerli.etherscan.io/tx/${stakeClaimHash}`}>Etherscan</a>
                                    </div>
                                </div>)
                                : ""
                            }
                            {stakeTxHash
                                ? (<div>
                                    <p className='green'>Successfully stake tokens!</p>
                                    <div>
                                        <a href={`https://goerli.etherscan.io/tx/${stakeTxHash}`}>Etherscan</a>
                                    </div>
                                </div>)
                                : ""}
                        </form>
                        <div className="alerts ">{error && error.message}</div>
                        <div className="alerts ">{errorR} </div>
                    </Col>
                    <p></p>
                    <div className='tableStake'>
                        {address && stakeBalances && stakeBalances.length
                            ? (balancesLoading
                                ? (<Spinner animation="grow" />)
                                : <Table responsive size="sm" bordered hover variant="dark">
                                    <thead>
                                        <tr>
                                            <th>№:</th>
                                            <th>Start</th>
                                            <th>Ends</th>
                                            <th>Locked</th>
                                            <th>Rewards</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stakeBalances && stakeBalances[0] && stakeBalances[0][0] && stakeBalances[0][0]._hex && stakeBalances.map((el, index) =>
                                        (
                                            <tr key={index}>
                                                {/* @ts-ignore */}
                                                <td >{index + 1}</td>
                                                <td>{formatUnixTimestampBlockchain(el && el[1] && el[1]._hex && parseInt(el[1]._hex, 16))}</td>
                                                <td>{formatUnixTimestampBlockchain(el && el[2] && el[2]._hex && parseInt(el[2]._hex, 16))}</td>
                                                <td>{el && el[0] && el[0]._hex && ethers.utils.formatEther(el[0]._hex)} {Balance?.symbol}</td>
                                                <td>{el && el[3] && el[3]._hex && ethers.utils.formatEther(el[3]._hex)} {Balance?.symbol}</td>
                                                <td>{el[4]
                                                    ? "Claimed"
                                                    : claimButtonState[index] && claimButtonState[index][1]
                                                        ? (spinnerClaim === index + 1)
                                                            ? <Spinner animation="grow" />
                                                            : <Button onClick={() => handleClaim(index + 1)}>Claim</Button>
                                                        : <Button disabled>Claim</Button>
                                                }</td>
                                            </tr>
                                        )
                                        )}
                                    </tbody>
                                </Table>)
                            : ""}
                    </div>
                </Row>
            </Container>
        </div >
    )
}












