'use client';
import { useState, useEffect } from "react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

import { SimpleStorageEvent } from "@/utils/types";

import { type BaseError, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'

import { parseAbiItem } from 'viem'

import { publicClient } from "@/lib/client";

const SimpleStorage = () => {

    const [inputNumber, setInputNumber] = useState('');
    const [events, setEvents] = useState<SimpleStorageEvent[]>([])

    const { data: hash, isPending: isPendingWrite, error: writeError, writeContract } = useWriteContract()

    const { data: myNumber, error: errorRead, isPending: isPendingRead } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getMyNumber'
    })

    const handleChangeNumber = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'setMyNumber',
            args: [BigInt(inputNumber)],
        })
        setInputNumber('');
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

    const getEvents = async() => {
        const numberChangedEvents = await publicClient.getLogs({  
            address: CONTRACT_ADDRESS,
            event: parseAbiItem('event NumberChanged(address indexed by, uint256 number)'),
            fromBlock: 0n,
            toBlock: 'latest'
        })
        setEvents(numberChangedEvents.map((event) => {
            return {
                by: event.args.by as string,
                number: event.args.number?.toString() || ''
            }
        }))
    }

    useEffect(() => {
        getEvents();
    }, [])

    return (
        <>
            <div>
                {isPendingRead ? (
                    <p>Chargement...</p>
                ) : (
                    <p>The number in the blockchain : {myNumber?.toString()}</p>
                )}

                {errorRead && (
                    <p>{(errorRead as unknown as BaseError).shortMessage || errorRead.message}</p>
                )}
                
            </div>
            <div>
                {writeError && (
                    <div>Error: {(writeError as BaseError).shortMessage || writeError.message}</div>
                )}
                {isConfirming && <div>Waiting for confirmation...</div>}
                {isConfirmed && <div>Transaction confirmed.</div>}
                {hash && <div>Transaction Hash: {hash}</div>}
                Change the number : 
                <Input
                    onChange={(e) => setInputNumber(e.target.value)}
                    value={inputNumber}
                />
                <Button onClick={handleChangeNumber} disabled={isPendingWrite}>
                    {isPendingWrite ? 'Pending...' : 'Change the number'}
                </Button>
            </div>
        </>
        
    )
}

export default SimpleStorage