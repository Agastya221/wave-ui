import React,{useEffect,useState} from "react";
import { ethers } from "ethers";
import HashLoader from "react-spinners/HashLoader";
import {FiSend} from "react-icons/fi";
import {contractAddress,contractABI} from "./constants";
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

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      }
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        //console.log("Found an authorized account:", account);
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
  });
  useEffect(()=>{
    retrieveCount();
    getAllWaves();
  })
  const retrieveCount=async()=> {
    const {ethereum}=window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await wavePortalContract.getTotalWaves();
        setWavesCount(count.toNumber());
       /**
         * Listen in for emitter events!
         */
        wavePortalContract.on("NewWave", async() => {
          let count = await wavePortalContract.getTotalWaves();
          setWavesCount(count.toNumber());
        });
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
        const waveTxn = await wavePortalContract.wave(message,{ gasLimit: 300000 });
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
            message: wave.message,
            winner:wave.winner
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);

        /**
         * Listen in for emitter events!
         */
         wavePortalContract.on("NewWave", (from, timestamp, message,winner) => {
          const newWave={address: from,
            timestamp: new Date(timestamp * 1000),
            message: message,
            winner:winner};
            if (allWaves.find((el)=>newWave===el)) {
              console.log(allWaves.find((el)=>newWave.timestamp===el.timestamp));
              setAllWaves(prevState => [...prevState, newWave]);
            }
        });
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
        <span role="img" aria-label="wave">👋</span> Hello there!
        </div>

        <div className="bio">
        I'm <b>Greg</b> and I've worked only on <b>Web2</b> websites up until now so getting to <b>Web3</b> seems really <span role="img" aria-label="cool">❄️</span>,right?
         <br/>Connect your Ethereum wallet and try waving at me! Maybe you get to earn some <b>Ξ</b>       
        </div>
        {currentAccount&&<div className="card">
          <div className="card-inner">
            <label>Send a Wave </label>
            <div className="container">
              <div className="input-container">
                <input 
                onChange={e=>setMessage(e.target.value)}
                placeholder="The taughts you want to share"/>
              </div>
              <button className="send" onClick={wave} disabled={loading}>
          {loading
          ?<HashLoader size={20}/>
          :<FiSend/>
          }
        </button>
            </div>
          </div>
        </div>}
        
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount&&<div className="totalScore">
          Total Waves: {wavesCount}
        </div>}
        {allWaves.map((wave, index) => {
          
          return (
            <div key={index} className="card">
              <div className="card-inner">
              <div>
                <span className="addy">
                  {wave.address} 
                </span>{wave.winner?'🏆':""}
                <p>Posted on {dayjs(wave.timestamp).format('LLL')}</p>
                <p style={{color:"#ffb86c"}}>{wave.message}</p>
                </div>
              </div>
            </div>)
        })}
      </div>
    </div>
  );
}