import { ethers } from "./ethers.min.js";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./constants.js";

const connectButton = document.getElementById('connectButton');
const amountEth = document.getElementById('amountEth');
const inputDeposit = document.getElementById('inputDeposit');
const inputWithdraw = document.getElementById('inputWithdraw');
const depositButton = document.getElementById('depositButton');
const withdrawButton = document.getElementById('withdrawButton');

let connectedAccount;

connectButton.addEventListener('click', async function() {
    try {
        if(typeof window.ethereum !== 'undefined') {
            // Metamask est installé
            const resultAccount = await window.ethereum.request({ method: "eth_requestAccounts" })
            connectedAccount = ethers.getAddress(resultAccount[0])
            connectButton.innerHTML = "Connected with " + connectedAccount.substring(0,4) + "..." + connectedAccount.substring(connectedAccount.length - 5);
        }
        else {
            // Metamask n'est pas installé
            connectButton.innerHTML = "Please install Metamask";
        }
    }
    catch(error) {
        console.error("Connection error", error);
        connectButton.innerHTML = "Connection failed";
    }
})

/* getNumber.addEventListener('click', async function() {
    if(connectedAccount) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
            const number = await contract.getMyNumber();
            theNumber.innerHTML = number.toString();
        }
        catch(e) {
            console.log(e);
        }
    }
}) */

depositButton.addEventListener('click', async function() {
    if(connectedAccount) {
        try {
            const inputNumberByUser = inputDeposit.value;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const test = await  ethers.parseEther(inputNumberByUser);
            console.log(test);
            let transaction = await contract.sendEthers({ value: test });
            await transaction.wait();
        }
        catch(e) {
            console.log(e);
        }
    }
})

withdrawButton.addEventListener('click', async function() {
    if(connectedAccount) {
        try {
            const inputNumberByUser = inputWithdraw.value;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            let transaction = await contract.withdraw(ethers.parseEther(inputNumberByUser));
            await transaction.wait();
        }
        catch(e) {
            console.log(e);
        }
    }
})