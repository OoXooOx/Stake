import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useConnect } from "wagmi";
import MetamaskImg from "../images/metamask.png";
import WalletConnectImg from "../images/walletconnect.png";

export default function ModalExample({ addConnect, handleClose, show }: any) {
  const { connectors } = useConnect();

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Choose your wallet</Modal.Title>
        </Modal.Header>
        <Modal.Footer className="d-flex justify-content-center">
          {connectors.map((connector) => {
            const { id, name } = connector;
            if (name === "MetaMask") {
              return <Button
                variant="outline-primary"
                size="sm"
                onClick={() => addConnect(connector)}
                key={id}>
                {name}{" "}
                <img src={MetamaskImg} height="90" width="90" className="d-inline alighn-top focus:ring focus:outline-none" />
              </Button>
            }
            if (name === "WalletConnect") {
              return <Button
                variant="outline-primary"
                size="sm"
                onClick={() => addConnect(connector)}
                key={id}>{name}{" "}
                <img src={WalletConnectImg} height="90" width="90" className="d-inline alighn-top focus:ring focus:outline-none" />
              </Button>
            }
          })}
        </Modal.Footer>
      </Modal>
    </>
  );
}
