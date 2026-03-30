import { ethers } from "./ethers.min.js";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./constants.js";

const connectButton = document.getElementById('connectButton');
const getNumber = document.getElementById('getNumber');
const theNumber = document.getElementById('theNumber');
const inputNumber = document.getElementById('inputNumber');
const setNumber = document.getElementById('setNumber');

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

getNumber.addEventListener('click', async function() {
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
})

setNumber.addEventListener('click', async function() {
    if(connectedAccount) {
        try {
            const inputNumberByUser = inputNumber.value;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            let transaction = await contract.setMyNumber(inputNumberByUser);
            await transaction.wait();
        }
        catch(e) {
            console.log(e);
        }
    }
})