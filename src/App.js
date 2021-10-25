import React,{useEffect,useState} from "react";
import { ethers } from "ethers";
import abi from './utils/WavePortal.json';
import './App.css';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [wavesCount,setWavesCount]=useState(0);
  // ETH Contract const
  const contractAddress="0x3248C1dE344e95191e2Ee6F3c72D17cCAdFd4E9a";
  const contractABI = abi.abi;
  // End ETH Contract const
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        window.location.href = "https://metamask.io";
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {
    checkIfWalletIsConnected();
    
  }, []);
  useEffect(()=> {
    const interval = setInterval(() => {
            retrieveCount();
        }, 1000);
    return () => clearInterval(interval);
  });
  const retrieveCount=async()=> {
    const {ethereum}=window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await wavePortalContract.getTotalWaves();
        setWavesCount(count.toNumber());
       
    }
  }
  const wave = async () => {
     try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave();
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="wave">👋</span> Hey there!
        </div>

        <div className="bio">
        I'm <b>Greg</b> and I worked only on <b>Web2</b> websites so getting to <b>Web3</b> is really entertaining right? Connect your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        <div className="header">
          {wavesCount} total Waves
        </div>
      </div>
    </div>
  );
}