import { Container, Row } from 'react-bootstrap';
import Image from 'react-bootstrap/Image';
import SiteCover from "../images/siteCover.png";

export default function About() {
    return (
        <Container>
            <Row>
                <div className='Col'>
                    <p></p>
                    <h6 className='word'>
                        Chain = Goerli testnet<p></p>
                        Stake smart contract address = 0xa8FD4A0cd4E21903794deA2b1FB9a584c9815A92<p></p>
                        Token smart contract address = 0x95245ab700942856BDfa83B7926889087e51F0b7<p></p>
                        Market smart contract address = 0xa0279390592A7453D187fFd123428a36c8eA922f</h6>

                </div>
                <div >
                    <p></p>
                    <Image className="siteCover" src={SiteCover} />
                </div>
            </Row>
        </Container>

    )
}
