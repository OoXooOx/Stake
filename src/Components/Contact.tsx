import { Container, Row } from 'react-bootstrap';
import Image from 'react-bootstrap/Image';
import LinImg from "../images/link.png"

export default function Contact() {
    return (
        <div className='grey'>
            <Container>
                <Row>
                    <h1>Contact</h1>

                    <div >
                        <p></p>
                        <a href="https://www.linkedin.com/in/-geo/">
                            <Image className="linkImg" src={LinImg} /></a>

                    </div>
                </Row>
            </Container>

        </div>
    )
}
