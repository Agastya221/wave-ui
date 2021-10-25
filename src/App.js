import React,{useEffect,useState} from "react";
import { ethers } from "ethers";
import abi from './utils/WavePortal.json';
import HashLoader from "react-spinners/HashLoader";
import {FiSend} from "react-icons/fi";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import './App.scss';
import dayjs from "dayjs";
dayjs.extend(LocalizedFormat)
export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [message,setMessage]=useState();
  const [allWaves, setAllWaves] = useState([]);
  const [loading,setLoading]=useState(false);
  const [wavesCount,setWavesCount]=useState("??");
  // ETH Contract const
  const contractAddress="0xAaB513Cb3Aa8cb062D5eb43Ccf52A02CA900cE97";
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
            getAllWaves();
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

      if (ethereum&&message) {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(message);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        setLoading(false);
      } else {
        if (ethereum)
          console.log("Field must not be empty");
        else
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
      setLoading(false);
    }
  }
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();
        

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
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
        <div className="card">
          <div className="card-inner">
            <label>Send a Wave </label>
            <div className="container">
              <div className="input-container">
                <input 
                onChange={e=>setMessage(e.target.value)}
                placeholder="The taughts you want to share"/>
              </div>
              <button className="send" onClick={wave}>
          {loading
          ?<HashLoader size={20}/>
          :<FiSend/>
          }
        </button>
            </div>
          </div>
        </div>
        
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        <div className="totalScore">
          Total Waves: {wavesCount}
        </div>
        {allWaves.map((wave, index) => {
          const timeStamp =new Date(wave.timestamp.toString());

          return (
            <div key={index} className="card">
              <div className="card-inner">
              <div>
                <span className="addy">
                  {wave.address}
                </span>
                <p>Posted on {dayjs(timeStamp).format('LLL')}</p>
                <p style={{color:"#ffb86c"}}>{wave.message}</p>
                </div>
              </div>
            </div>)
        })}
      </div>
    </div>
  );
}