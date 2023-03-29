import { ethers } from "ethers";
import { Col, Container, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import { useContractReads } from 'wagmi';
import STAKE_ABI from "../STAKE_ABI.json";
import TOKEN_ABI from "../TOKEN_ABI.json";



const Home = () => {
    const STAKE_ADDRESS = "0xa8FD4A0cd4E21903794deA2b1FB9a584c9815A92";
    const TOKEN_ADDRESS = "0x95245ab700942856BDfa83B7926889087e51F0b7";

    const stakeContract = {
        address: STAKE_ADDRESS as `0x{string}`,
        abi: STAKE_ABI,
    }

    const tokenContract = {
        address: TOKEN_ADDRESS as `0x{string}`,
        abi: TOKEN_ABI,
    }


    const { data, isLoading } = useContractReads({
        contracts: [
            {
                ...stakeContract,
                functionName: 'totalTokensStaked',
            },
            {
                ...stakeContract,
                functionName: 'uniqueAddressesStaked',
            },
            {
                ...tokenContract,
                functionName: 'symbol',
            },

        ],
    })

    return (
        <div className='white'>
            <Container>
                <Row>
                    <h1>We don't let you turn into a zombies</h1>
                    <br></br>
                    <h6>
                        When you buy our tokens, you are making great investment!!!
                        <p>
                            When you staked it, you fly in the sky!!!

                        </p>

                        Don't worry if you forget to collect your reward and your tokens stay staked for longer than you chose when you deposited, you will receive additional rewards for all additional staking time based on the annual percentage determined when you deposited.
                    </h6>

                    <p></p>
                    <Col className='ColHome'>
                        {/* @ts-ignore */}
                        <Button variant="outline-light" disabled>Total tokens staked:<p></p>{!isLoading && data && data[0] && data[0]._hex && ethers.utils.formatEther(data[0]._hex)} {data && data[2]}</Button>{' '}
                    </Col>
                    <Col className='ColHome'>
                        {/* @ts-ignore */}
                        <Button variant="outline-light" disabled>Unique addresses staked:<p></p>{!isLoading && data && data[1] && data[1]._hex && parseInt(data[1]._hex, 16)}</Button>{' '}
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default Home;
