import { Navbar, Nav, Container } from "react-bootstrap";
import { Outlet, Link } from "react-router-dom";
import Logo from '../images/etheruem-staking.jpg';
import { useSwitchNetwork, useNetwork, goerli } from "wagmi";
import { Web3Button, Web3Modal } from "@web3modal/react";
import { ethereumClient } from './ethereumConfig';
import { useEffect } from "react";

// import ModalExample from "./Modal"
// import Button from 'react-bootstrap/Button';


const NavBar = () => {
    // const [show, setShow] = useState(false);
    // const handleClose = () => setShow(false);
    // const handleShow = () => setShow(true);
   
    // const handleWalletConnect = async (connector: Connector) => {
    //     await connectAsync({ connector })
    //     handleClose();
    // }

    // const getAddressSlice = (address: string | undefined) => {
    //     if (address) {
    //         return address.slice(0, 5) + "..." + address.slice(38, 42);
    //     } else {
    //         return;
    //     }
    // }

    const { switchNetwork } = useSwitchNetwork()
    const { chain } = useNetwork();


    useEffect(() => {
        if (chain) {
            if (chain?.id !== goerli.id) switchNetwork?.(goerli.id)
        }
    }, [chain])


    return (
        <>
            <header>
                <Navbar className="navBg" variant="dark" expand="lg">
                    <Container >
                        <Navbar.Brand as={Link} to="/" >
                            <img
                                src={Logo}
                                height="50"
                                width="80"
                                className="d-inline alighn-top"
                                alt="Logo"
                            />{" "}
                            Stake TST
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="me-auto">
                                <Nav.Link as={Link} to="/buy">Buy</Nav.Link>
                                <Nav.Link as={Link} to="/stake">Stake</Nav.Link>
                                <Nav.Link as={Link} to="/about">About</Nav.Link>
                                <Nav.Link as={Link} to="/contact">Contact</Nav.Link>

                            </Nav>
                            {/* <div>
                                {isConnected
                                    ? <Button variant="primary" title={address} disabled>connected:{" "}
                                        {getAddressSlice(address)}
                                    </Button>
                                    : <Button variant="primary" title={address} onClick={handleShow}>
                                        Connect Wallet
                                    </Button>}
                                <ModalExample
                                    handleClose={handleClose}
                                    show={show}
                                    addConnect={handleWalletConnect}
                                />
                            </div> */}

                            <div>
                                <Web3Modal
                                    themeMode='light'
                                    themeColor='blackWhite'
                                    themeBackground="themeColor"
                                    defaultChain={goerli}
                                    projectId="e5d7ab31bce4e635554187ea1e2642cf"
                                    ethereumClient={ethereumClient}
                                />
                                <Web3Button
                                    icon='hide' />
                            </div>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
            </header>
            <main >
                <Outlet></Outlet>
            </main>
            <footer >
            </footer>
        </>
    )
}
export default NavBar;